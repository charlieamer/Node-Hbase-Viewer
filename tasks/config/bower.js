path = require('path');

module.exports = function (grunt) {
    grunt.config.set('bower', {
        install: {
            options: {
                targetDir: './assets/',
                install: true,
                cleanTargetDir: false,
                cleanBowerDir: false,
                layout: function(type, component, source) {
                    if (type === '__untyped__') {
                        type = source.substring(source.lastIndexOf('.') + 1);
                    }
                    var renamedType = type;
                    if (type == 'js') renamedType = 'js/dependencies/bower';
                    if (type == 'css' || type == 'less') renamedType = 'styles';
                    if (type == 'eot' || type == 'svg' || type == 'ttf' ||
                        type == 'woff' || type == 'woff2' || type == 'fonts')
                        renamedType = 'fonts';
                    return renamedType;
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-bower-task');
};