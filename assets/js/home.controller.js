(function () {
    'use strict';

    angular
        .module('app')
        .controller('HomeController', HomeController);

    HomeController.$inject = ['$scope','$rootScope', 'AuthenticationService', 'HbaseService'];
    function HomeController($scope, $rootScope, AuthenticationService, HbaseService) {
        $rootScope.menu = "home";
        var onLogged = function(user) {
            $scope.user = user;
        };
        $scope.currentTable = null;
        $scope.SetCommand = function(command) {
            $scope.command = command;
        }
        $scope.commands = ['scan'];
        $scope.command = $scope.commands[0];
        $scope.sentCommand = null;
        $scope.Submit = function() {
            var params = {};
            params.table = $scope.currentTable;
            $scope.sentCommand = $scope.command;
            HbaseService.Command($scope.command, params);
        }
        $scope.EditValue = function(row, columnIndex, value) {
            var columnSplit = $scope.columns[columnIndex].split(/\:(.+)?/);
            var column = columnSplit[1];
            var family = columnSplit[0];
            HbaseService.Command("put", {
                table: $scope.currentTable,
                row: row,
                family: family,
                column: column,
                value: value
            });
        }
        AuthenticationService.IsLogged(onLogged);
        AuthenticationService.events.addListener('login', onLogged);
        HbaseService.events.addListener('statusChanged', function(status) {
            $scope.status = status;
            if (status && status.tables)
                $scope.currentTable = status.tables[0];
            else
                $scope.currentTable = null;
        });
        HbaseService.EmitStatus();
        HbaseService.events.addListener('queueStatusChanged', function(status) {
            $scope.commandStatus = status;
            if (status.status == "done" && $scope.sentCommand) {
                $scope.rows = [];
                $scope.columns = [];
                var tmpData = {};
                var sent = $scope.sentCommand;
                $scope.sentCommand = null;
                for (var i=0;i<status.result.data.length;i++) {
                    for (var j=0;j<status.result.data[i].length;j++) {
                        var acc = status.result.data[i][j];
                        var cname = acc.column;
                        if ($scope.columns.indexOf(cname) == -1)
                            $scope.columns.push(cname);
                        tmpData[acc.key] = tmpData[acc.key] || [];
                        tmpData[acc.key].push(acc);
                    }
                }
                $scope.columns.sort();
                for (var rowName in tmpData) {
                    var row = {
                        key: rowName,
                        columns: []
                    };
                    for (var i=0;i<$scope.columns.length;i++)
                        row.columns.push({});
                    for (var i=0;i<tmpData[rowName].length;i++) {
                        var index = $scope.columns.indexOf(tmpData[rowName][i].column);
                        row.columns[index] = {
                            value: tmpData[rowName][i].$,
                            timestamp: tmpData[rowName][i].timestamp
                        };
                    }
                    $scope.rows.push(row);
                }
            }
        });

        $scope.ChangeTable = function(index) { 
            $scope.currentTable = $scope.status.tables[index];
        }
    }

})();