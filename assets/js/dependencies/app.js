(function () {
    'use strict';

    angular
        .module('app', ['ngRoute', 'ngCookies', 'xeditable'])
        .config(config)
        .filter('bitwiseAnd', function () {
            return function (firstNumber, secondNumber) {
                return ((parseInt(firstNumber, 10) & parseInt(secondNumber, 10)) === parseInt(secondNumber, 10));
            }
        })
        .run(run);

    config.$inject = ['$routeProvider', '$locationProvider'];
    function config($routeProvider, $locationProvider) {
        $routeProvider
            .when('/', {
                controller: 'HomeController',
                templateUrl: '/templates/home.view.html',
                controllerAs: 'vm'
            })

            .when('/login', {
                controller: 'LoginController',
                templateUrl: '/templates/login.view.html',
                controllerAs: 'vm'
            })

            .when('/register', {
                controller: 'RegisterController',
                templateUrl: '/templates/register.view.html',
                controllerAs: 'vm'
            })
            .when('/tables', {
                controller: 'TableController',
                templateUrl: '/templates/table.view.html',
                controllerAs: 'vm'
            })
            .when('/users', {
                controller: 'UserController',
                templateUrl: '/templates/user.view.html',
                controllerAs: 'vm'
            })

            .otherwise({ redirectTo: '/' });
    }

    run.$inject = ['editableOptions', '$rootScope', '$location', '$http', 'HbaseService', 'AuthenticationService'];
    function run(editableOptions, $rootScope, $location, $http, HbaseService, AuthenticationService) {
        editableOptions.theme = 'bs3';
        $rootScope.$on('$locationChangeStart', function (event, next, current) {
            // redirect to login page if not logged in and trying to access a restricted page
            var restrictedPage = $.inArray($location.path(), ['/login', '/register']) === -1;

            AuthenticationService.IsLogged(function(loggedIn) {
                if (restrictedPage && !loggedIn) {
                    $location.path('/login');
                }
            });
        });
    }

})();