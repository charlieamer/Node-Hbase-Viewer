/**
 * HbaseController
 *
 * @description :: Server-side logic for managing hbases
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	create: function(req, res) {
    var params = utils.bodyToObjParams(req.body, Hbase);
    Hbase.create(params).then(function (hbase) {
      hbase.owner = req.session.user.id;
      hbase.save();
      hbase.initOthers();
      res.json(true);
    }).catch(function(err) {
      res.status(400).json(err);
      sails.log.error("Error creating hbase connection");
      sails.log.error(err);
    });
  },
  status: function(req, res) {
    var status = HbaseService.getStatus(req.params.id);
    res.json(status || false);
  },
  connect: function(req, res) {
    HbaseService.connect(req.params.id);
    res.json(true);
  },
  disconnect: function(req, res) {
    HbaseService.disconnect(req.params.id);
    res.json(true);
  },
  request: function(req, res) {
    res.json(HbaseService.getRequest(req.params.id));
  },
  command: function(req, res) {
    if (!HbaseService.commands.hasOwnProperty(req.params.command))
      res.status(400).json("Invalid command: " + req.params.command);
    else
      res.json(HbaseService.commands[req.params.command](req.params.id, req.body));
  }
};

