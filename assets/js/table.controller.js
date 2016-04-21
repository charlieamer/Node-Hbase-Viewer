(function () {
    'use strict';

    angular
        .module('app')
        .controller('TableController', TableController);

    TableController.$inject = ['$rootScope', '$scope', 'AuthenticationService'];
    function TableController($rootScope, $scope, AuthenticationService) {
        $rootScope.menu = "table";
    }

})();
