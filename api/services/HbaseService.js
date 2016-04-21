Client = require('node-hbase');

statuses = {};
clients = {};

requests = [];
queues = {};

function meaningfulError(err) {
  if (err)
    return err.name + ": " + err.message;
}

function errorCode(err) {
  if (err)
    return err.code;
}

function checkParams(requiredArgs, realArgs, done) {
  for (var idx in requiredArgs) {
    if (!(requiredArgs[idx] in realArgs))
    {
      done({
        error: "Required argument not found: " + requiredArgs[idx]
      });
      return false;
    }
  }
  return true;
}

function standardDone(done, successCallback) {
  return function(err, data) {
    done({error: meaningfulError(err), errorCode: errorCode(err), data: data});
    if (!err && successCallback && typeof(successCallback) == "function")
      successCallback();
  }
}

// Adds request to specified queue. Func should be a function like:
// function(done), where done is a callback like: function(result).
// when request is finished it should call done(result). It returns
// request ID, and can be used later to see result of request.
function addRequest(id, func) {
  var ret = requests.push({func: func, status: 'queued', connection: id});
  if (!queues[id]) {
    sails.log.debug("Created queue for connection " + id);
    queues[id] = [];
  }
  var qNum = queues[id].push(ret);
  if (qNum == 1) setTimeout(function(){advanceQueue(id)},100);
  return ret;
}

function advanceQueue(id) {
  // - 1 because it represents length of array when it was added in queue
  var reqId = queues[id][0];
  if (!reqId)
    return;
  reqId--;
  sails.log.verbose("Starting request " + reqId + " on connection " + id);
  if (statuses[id] && statuses[id].busy)
    return setTimeout(function(){
      sails.log.verbose("Waited 1s for request " + reqId + " restart");
      advanceQueue(id)
    }, 1000);
  queues[id].splice(0,1);
  if (!clients[id] || !statuses[id].connected) {
    sails.log.verbose("   - No connection present, skipping");
    requests[reqId].status = 'done';
    requests[reqId].result = {
      error: "Disconnected from HBase REST server"
    }
    return advanceQueue(id);
  }
  requests[reqId].status = 'working';
  requests[reqId].func(function(result){
    sails.log.verbose("Request " + reqId + " done on connection " + id);
    requests[reqId].status = 'done';
    requests[reqId].result = result;
    advanceQueue(id);
  });
}

function doError(id, ipString, err) {
  sails.log.verbose("Error in connection to " + ipString + " (" + err.code + ")");
  statuses[id].busy = false;
  statuses[id].connected = false;
  statuses[id].error = err;
  delete clients[id];
}

function doSuccess(id, ipString, description) {
  sails.log.verbose("Successful query done on " + ipString + " - " + description);
  statuses[id].busy = false;
}

function reconnect(id) {
  HbaseService.disconnect(id);
  HbaseService.connect(id);
}

function reconnectCallback(id) {
  return function() {
    reconnect(id);
  }
}

module.exports = {
  getStatus: function(id) {
    return statuses[id];
  },
  getRequest: function(id) {
    return requests[id - 1];
  },
  connect: function(id) {
    if (statuses[id] && (statuses[id].connected || statuses[id].busy)) {
      sails.log.warn("Already connected, or connection is busy (connection id: " + id + ")");
      return;
    }
    Hbase.findOne(id).then(function(hbase) {
      if (hbase) {
        var ipString = "`" + hbase.ip + ":" + hbase.port + "`";
        statuses[id] = {};
        statuses[id].busy = true;
        sails.log.verbose("Creating new connection to: " + ipString);
        var client = Client({host: hbase.ip, port: hbase.port, timeout: 10000});

        // Get version of REST client
        client.getVersion(function(err, version) {
          if (err) {
            doError(id, ipString, err);
          } else {
            doSuccess(id, ipString, 'connected');
            statuses[id].busy = true;
            statuses[id].version = version;
            statuses[id].connected = true;
            statuses[id].status = "Fetching tables";
            clients[id] = client;

            // Get list of tables
            client.getTables(function(err, tables) {
              if (err) {
                doError(id, ipString, err);
              } else {
                doSuccess(id, ipString, 'tables fetched');

                statuses[id].busy = true;
                statuses[id].version = version;
                statuses[id].tables = tables;
                statuses[id].status = "Fetching table schemas";
                var schemas = 0;

                var getSchema = function(key) {
                  var fetchingTable = tables[key];
                  client.getTable(fetchingTable.name).getSchema(function(err, schema) {
                    schemas++;
                    if (!err) {
                      for (idx in statuses[id].tables) {
                        if (statuses[id].tables[idx].name == fetchingTable.name) {
                          statuses[id].tables[idx].schema = schema;
                        }
                      }
                    } else {
                      sails.log.error("Error fetching schema for " + fetchingTable);
                      sails.log.error(err);
                      doError(id, ipString, err);
                    }
                    if (schemas == tables.length && statuses[id].connected) {
                      delete statuses[id].status;
                      doSuccess(id, ipString, 'Schemas fetched');
                    }
                  });
                }
                for (key in tables) {
                  getSchema(key);
                }
                if (tables.length == 0) {
                  delete statuses[id].status;
                  doSuccess(id, ipString, 'Schemas fetched');
                }
              }
            });
          }
        });
      }
    });
  },
  disconnect: function(id) {
    delete statuses[id];
    delete clients[id];
  },
  commands: {
    put: function(id, args) {
      return addRequest(id, function(done) {
        if (!checkParams(['table', 'row', 'family', 'column', 'value'], args, done))
          return;
        clients[id].getTable(args.table).getRow(args.row).put(args.family + ":" + args.column, args.value, standardDone(done));
      });
    },
    scan: function(id, args) {
      return addRequest(id, function(done) {
        if (!checkParams(['table'],args, done))
          return;
        var scanner = clients[id].getTable(args.table).getScanner();
        var first = true;
        var result = [];
        var cb = function(err, data) {
          if (err) {
            standardDone(done)(err,data);
          } else {

            if (data != null) {
              scanner.get(cb);
              if (!first)
                result.push(data);
              first = false;
            }
            else
              done({data: result});
          }
        };
        scanner.create(args.params || {}, cb);
      })
    },
    get: function(id, args) {
      return addRequest(id, function(done) {
        if (!checkParams(['table', 'row'], args, done))
          return;
        var get = clients[id].getTable(args.table).getRow(args.row);
        if (args.families)
          get.get(args.families, standardDone(done))
        else
          get.get(standardDone(done));
      })
    },
    delete: function(id, args) {
      return addRequest(id, function(done) {
        if (!checkParams(['table', 'row'], args, done))
          return;

      })
    },
    createTable: function(id, args) {
      return addRequest(id, function(done) {
        if (!checkParams(['table', 'families'], args, done))
          return;
        var preparedFamilies = {ColumnSchema:[]};
        for (var key in args.families) {
          preparedFamilies.ColumnSchema.push(args.families[key]);
        }
        clients[id]
          .getTable(args.table)
          .create(preparedFamilies, standardDone(done, reconnectCallback(id)));
      })
    },
    deleteTable: function(id, args) {
      return addRequest(id, function(done) {
        if (!checkParams(['table'], args, done))
          return;
        clients[id]
          .getTable(args.table)
          .delete(standardDone(done, reconnectCallback(id)));
      })
    }
  },
  queues: function() {
    return queues;
  }
}