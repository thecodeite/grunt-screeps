/*
 * grunt-screeps
 * https://github.com/screeps/grunt-screeps
 *
 * Copyright (c) 2015 Artem Chivchalov
 * Licensed under the MIT license.
 */

'use strict';

var path = require('path'),
  https = require('https'),
  util = require('util'),
  _ = require('lodash'),
  fs = require('fs');

module.exports = function(grunt) {
  //console.log('hello1', typeof(grunt));

  return function () {
    
//git rev-parse --abbrev-ref HEAD

    var gitBranch = grunt.util.spawn({
      cmd: 'git',
      args: ['rev-parse', '--abbrev-ref', 'HEAD']
    }, function done(res) {
      grunt.log.ok('Current branch:', res);
    });

    gitBranch.stdout.on('data', function (data) {
      console.log('stdout: ' + data);
    });

    var options = this.options({});
    
    //grunt.log.writeln('options', options);
    var modules = {};

    var done = this.async();

    var reqOptions = {
      hostname: 'screeps.com',
      port: 443,
      path: '/api/user/code?branch='+options.branch,
      method: 'GET',
      auth: options.email + ':' + options.password
    };

    var req = https.request(reqOptions, function(res) {
      
      res.setEncoding('utf8');

      var data = '';

      res.on('data', function(chunk) {
        grunt.log.writeln('.');
        data += chunk;
      });

      res.on('error', function(error) {
        grunt.log.writeln('Error:', error);
      });

      res.on('end', function() {
        //grunt.log.writeln(data);
        data = JSON.parse(data);
        if(data.ok) {
          var msg = 'Read from Screeps account "' + options.email + '"';
          var branch = 'default';
          if(options.branch) {
            msg += ' branch "' + options.branch+'"';
            branch = options.branch;
          }
          msg += '.';
          grunt.log.writeln('Read data, writing to disk');
          writeModules(branch, data.modules, done);
        }
        else {
          grunt.log.error('Error while reading from Screeps: '+util.inspect(data));
          done();
        }
        
      });
    });
    req.end();
  };
};

function writeModules(path, modules, done) {
  fs.mkdir('./'+path, function() {
    var modulesArray = _.map(modules, function (v,k){ return {name: k, source: v}});
    writeModulesArray(path, modulesArray, done);
  });
}

function writeModulesArray(branch, modules, done) {
  if(modules.length <= 0) {
    return done();
  }

  var module = modules.pop();
  var path = './'+branch+'/'+module.name+'.js';
  var displayName = path;
  while(displayName.length < 40) displayName += ' ';

  process.stdout.write(displayName+':');

  if(module.source === null || module.source === '') {
    try{
      fs.unlinkSync(path, function(e) {
        //console.log("The file "+module.name+".js was deleted!", e);
        process.stdout.write(' deleted\n');
      });
      writeModulesArray(branch, modules, done);
    } catch(ex) {
      process.stdout.write(' already gone \n');
      //console.log("The file "+module.name+".js was not deleted!", ex);
      writeModulesArray(branch, modules, done);
    }
  } else {
    fs.writeFile(path, module.source, function(err){
      if(err) {
        console.log(err);
      } else {
        process.stdout.write(' updated\n');
        //console.log("The file "+module.name+".js was saved!");
      }

      writeModulesArray(branch, modules, done);
    });
  }

}
