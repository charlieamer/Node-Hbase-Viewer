module.exports = function (grunt) {
	grunt.registerTask('default', [
    'bower:install',
    'compileAssets',
    'linkAssets', 
    'watch'
  ]);
};
