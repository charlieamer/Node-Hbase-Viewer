(function () {
    'use strict';

    angular
        .module('app')
        .factory('AuthenticationService', AuthenticationService);

    AuthenticationService.$inject = ['$http', '$rootScope', '$timeout'];
    function AuthenticationService($http, $rootScope, $timeout) {
        var service = {};

        var events = new EventEmitter();

        service.Login = Login;
        service.SetCredentials = SetCredentials;
        service.ClearCredentials = ClearCredentials;
        service.IsLogged = IsLogged;
        service.events = events;

        return service;

        var credentials = null;
        var didCheck = false;

        function Login(username, password, callback) {
            $http.post('/session', { identifier: username, password: password })
            .success(function (response) {
                SetCredentials(response);
                callback({success: true, data: response});
            })
            .error(function (response) {
                callback({success: false, message: response});
            });
        }

        function IsLogged(callback, force) {
            if (force || (!credentials && !didCheck)) {
                didCheck = true;
                $http.get('/session')
                .success(function(response) {
                    if (response)
                        SetCredentials(response);
                })
                .finally(function(){
                    callback(credentials);
                });
            } else {
                callback(credentials);
            }
        }

        function SetCredentials(user) {
            credentials = user;
            events.emitEvent('login', [user]);
        }

        function ClearCredentials() {
            credentials = null;
            $rootScope.globals = {};
            $http.delete('/session');
            events.emitEvent('logout');
        }
    }

})();