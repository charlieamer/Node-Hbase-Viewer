(function () {
  'use strict';

  angular
    .module('app')
    .controller('UserController', UserController);

  UserController.$inject = ['$rootScope', '$scope', '$http', 'AuthenticationService', 'HbaseService'];
  function UserController($rootScope, $scope, $http, AuthenticationService, HbaseService) {
    $rootScope.menu = "users";
    AuthenticationService.IsLogged(function(user){
      $scope.user = user;
    });
    var toWords = function(word) {
      return word
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, function(str){ return str.toUpperCase(); });
    }
    $http.get('/hbasesubscription/roles').success(function(roles) {
      var obj = [];
      for (var key in roles)
        obj.push({
          name: toWords(key),
          value: roles[key]
        });
      $scope.roles = obj;
    });
    $scope.changeRole = function(subscription, value) {
      updateUserRole(subscription);
      $http.put('/hbasesubscription/' + subscription.id, {
        role: subscription.role ^ value
      }).success(function(newSub) {
        for (var i in $scope.tables) {
          for (var s=0;s<$scope.tables[i].users.length;s++) {
            if ($scope.tables[i].users[s].id == newSub.id)
              $scope.tables[i].users[s] = newSub;
          }
        }
        updateUserRole(newSub);
      });
    }
    var updateUserRole = function(subscription) {
      $scope.userRoles[subscription.id] = $scope.userRoles[subscription.id] || {};
      for (var ri=0;ri<$scope.roles.length;ri++)
        $scope.userRoles[subscription.id][$scope.roles[ri].value] =
          ($scope.roles[ri].value & subscription.role) > 0;
    }
    $scope.UpdateConnection = function(id) {
      var table = $scope.tables[id].data;
      var obj = {
        ip: table.ip,
        port: table.port
      };
      $http.put("/hbase/" + id, obj).success(function(data) {
        $scope.tables[id].data = data;
      });
    }
    $scope.DeleteSubscription = function(id) {
      $http.delete("/hbasesubscription/" + id).success(HbaseService.RefreshSubscriptions);
    }
    HbaseService.events.addListener('subscriptions', function(subscriptions){
      subscriptions = subscriptions || [];
      $scope.subscriptions = subscriptions;
      $scope.tables = {};
      $scope.userRoles = {};

      var someFunc = function(i) {
        var hbaseId = subscriptions[i].hbase.id.toString();
        $http.get('/hbasesubscription/find?hbase=' + hbaseId).success(function(subs) {
          $scope.tables[hbaseId] = $scope.tables[hbaseId] || {
            data: subscriptions[i].hbase,
            mySubscription: null,
            users: []
          };
          for (var j=0;j<subs.length;j++) {
            if (subs[j].owner.id == $scope.user.id)
              $scope.tables[hbaseId].mySubscription = subs[j].id;
            $scope.tables[hbaseId].users.push(subs[j]);
            updateUserRole(subs[j]);
          }
        });
      }
      for (var i=0;i<subscriptions.length;i++) {
        someFunc(i);
      }
    });
    HbaseService.EmitSubscriptions();
  }

})();
