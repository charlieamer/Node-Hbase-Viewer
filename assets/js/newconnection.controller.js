(function () {
  'use strict';

  angular
    .module('app')
    .controller('NewConnectionController', NewConnectionController);

  NewConnectionController.$inject = ['$scope', '$http', '$timeout', 'HbaseService'];
  function NewConnectionController($scope, $http, $timeout, HbaseService) {
    $scope.newPort = 8080;
    $scope.newConnection = function(ip, port) {
      $scope.error = null;
      $http.post('/hbase',{ip:ip, port:port}).success(function(){
        $timeout(HbaseService.RefreshSubscriptions,1000);
        $('#createNewModal').modal('hide');
      }).error(function(err){
        if (err.invalidAttributes.ip)
          $scope.error = "IP field is invalid";
        else
          $scope.error = "Port field is invalid";
      });
    }
  }
})();