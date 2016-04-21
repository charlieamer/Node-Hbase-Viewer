(function () {
    'use strict';

    angular
        .module('app')
        .factory('HbaseService', HbaseService);

    HbaseService.$inject = ['$http', '$timeout', 'AuthenticationService'];
    function HbaseService($http, $timeout, AuthenticationService) {
      var user = null;
      var subscriptions = null;
      var currentSubscription = null;
      var currentStatus = null;
      var currentQueueStatus = null;
      var events = new EventEmitter();
      var currentQueue = null;

      var RefreshSubscriptions = function() {
        $http.get('/hbasesubscription/find?owner=' + user.id).success(function(subs) {
          subscriptions = subs;
          events.emitEvent('subscriptions', [subscriptions]);
          ChangeSubscription(0);
        });
      }

      var RefreshStatus = function(after) {
        $http.get('/hbase/status/' + currentSubscription.hbase.id).success(function(status) {
          if (!status) {
            status = {
              connected: false,
              userStatus: 'Disconnected'
            }
          }
          if (status.busy) {
            status.userStatus = status.status;
          }
          if (status.connected && !status.busy) {
            status.userStatus = "Connected";
          }
          if (status.error) {
            status.userStatus = status.error.code || "Error";
          }
          currentStatus = status;
          events.emitEvent('statusChanged', [status]);
          if (after)
            after();
        });
      }

      var EmitStatus = function() {
        events.emitEvent('statusChanged', [currentStatus]);
      }

      var EmitSubscriptions = function() {
        events.emitEvent('subscriptions', [subscriptions]);
      }

      var RefreshQueue = function(after) {
        $http.get('/hbase/request/' + currentQueue).success(function(status) {
          currentQueueStatus = status;
          events.emitEvent('queueStatusChanged', [status]);
          if (after)
            after();
        });
      }

      var ChangeSubscription = function(index) {
        currentSubscription = subscriptions[index];
        events.emitEvent('subscriptionChanged', [currentSubscription]);
        RefreshStatus();
      }

      var Connect = function() {
        $http.get('/hbase/connect/' + currentSubscription.hbase.id).success(function() {
          var theCall = function() {
            if (currentStatus.busy) {
              $timeout(function() {
                RefreshStatus(theCall)
              },1000);
            }
          }
          RefreshStatus(theCall);
        });
      }

      var Disconnect = function() {
        $http.get('/hbase/disconnect/' + currentSubscription.hbase.id).success(function(){
          RefreshStatus();
        });
      }

      var Command = function(command, params) {
        $http.post('/hbase/command/' + currentSubscription.hbase.id + '/' + command, params).success(function(queue) {
          var theCall = function() {
            if (currentQueueStatus.status != "done") {
              $timeout(function() {
                RefreshQueue(theCall);
              },1000);
            }
          }
          currentQueue = queue;
          RefreshQueue(theCall);
        });
      }

      AuthenticationService.events.addListener('login', function(logged) {
        user = logged;
        RefreshSubscriptions();
      });

      AuthenticationService.events.addListener('logout', function() {
        user = null;
      });

      var service = {
        events: events,
        ChangeSubscription: ChangeSubscription,
        Connect: Connect,
        Disconnect: Disconnect,
        Command: Command,
        EmitStatus: EmitStatus,
        EmitSubscriptions: EmitSubscriptions,
        RefreshSubscriptions: RefreshSubscriptions
      };
      return service;
    }

})();