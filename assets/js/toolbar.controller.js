(function () {
    'use strict';

    angular
        .module('app')
        .controller('ToolbarController', ToolbarController);

    ToolbarController.$inject = [
      '$scope',
      'AuthenticationService',
      'HbaseService',
      '$location'
    ];
    function ToolbarController($scope, AuthenticationService, HbaseService, $location) {
      AuthenticationService.events.addListener('login', function(user) {
        $scope.user = user;
      });
      HbaseService.events.addListener('subscriptions', function(subscriptions) {
        $scope.subscriptions = subscriptions;
      });
      HbaseService.events.addListener('subscriptionChanged', function(subscription) {
        $scope.currentSubscription = subscription;
      });
      HbaseService.events.addListener('statusChanged', function(status) {
        $scope.status = status;
      });
      $scope.logout = function() {
        AuthenticationService.ClearCredentials();
        $location.path('/login');
        $scope.user = null;
      }
      $scope.connect = function() {
        $scope.status = null;
        HbaseService.Connect();
      }
      $scope.disconnect = function() {
        HbaseService.Disconnect();
      }
      $scope.ChangeConnection = function(index) {
        HbaseService.ChangeSubscription(index);
      }
    }
})();