(function () {
    'use strict';

    angular
        .module('app')
        .controller('RegisterController', RegisterController);

    RegisterController.$inject = ['$location', '$rootScope', 'AuthenticationService', 'FlashService'];
    function RegisterController($location, $rootScope, AuthenticationService, FlashService) {
        var vm = this;

        vm.register = register;
        $rootScope.menu = "register";

        function register() {
            vm.dataLoading = true;
        }
    }

})();
