'use strict';
var path = require('path'),
  https = require('https'),
  fs = require('fs'),
  util = require('util');


if(!String.prototype.endsWith) String.prototype.endsWith = function(suffix) {
  return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

module.exports = function(grunt) {
  return function () {
  
    var options = this.options({});
    //grunt.log.writeln('this:', this);
    var modules = {};
    var done = this.async();

    var folderPath = options.branch+'/';

    var files = fs.readdirSync(folderPath)
      .filter(function (fp) {
        //grunt.log.writeln('fp:', fp);
        return fp.endsWith('.js');
      })
      .map(function(fp) {
        var name = path.basename(fp).replace(/\.js$/,'');
        modules[name] = grunt.file.read(folderPath+fp);
      });

    var req = https.request({
      hostname: 'screeps.com',
      port: 443,
      path: '/api/user/code',
      method: 'POST',
      auth: options.email + ':' + options.password,
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    }, function(res) {
      res.setEncoding('utf8');
      var data = '';

      res.on('data', function(chunk) { data += chunk; });

      res.on('end', function() {
        data = JSON.parse(data);
        if(data.ok) {
          var msg = 'Commited to Screeps account "' + options.email + '"';
          if(options.branch) {
            msg += ' branch "' + options.branch+'"';
          }
          msg += '.';
          grunt.log.writeln(msg);
        } else {
          grunt.log.error('Error while commiting to Screeps: '+util.inspect(data));
        }
        done();
      });
    });

    var postData = {modules: modules};
    if(options.branch) {
      postData.branch = options.branch;
    }
    req.write(JSON.stringify(postData));
    req.end();
  };
};