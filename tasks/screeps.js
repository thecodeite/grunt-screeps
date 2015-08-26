'use strict';

var screepsPull = require('./screepsPull'),
    screepsPush = require('./screepsPush');

module.exports = function (grunt) {

  var pushTask = screepsPush(grunt);
  var pullTask = screepsPull(grunt);

  grunt.registerTask(
    'screepsPush', 
    'A Grunt plugin for commiting code to your Screeps account', 
    pushTask
    );
  grunt.registerTask(
    'screepsPull', 
    'A Grunt plugin for fulling your code from your Screeps account', 
    pullTask
  );
}