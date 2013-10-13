/*jslint node: true, maxlen: 100, maxerr: 50, indent: 2 */
'use strict';

var fs           = require('fs');
var util         = require('util');
var spawn        = require('child_process').spawn;
var Lazy         = require('lazy');
var EventEmitter = require('events').EventEmitter;

// Constructor
var INotifyWait = function(wpath, options) {
  var self = this;
  
  self.wpath = wpath;

  self.options = mixin({
    recursive: true,
    watchDirectory: false
  }, options);

  self.currentEvents = {};

  self.runProcess = function () {

    // run inotifywait command in background
    self.inwp = spawn('inotifywait', [
      (self.options.recursive ? '-r' : ''),
      '--format',
      '{ "type": "%e", "file": "%w%f" }',
      '-m',
      wpath 
    ]);
    self.inwp.on('close', function (err) {
      self.inwp = null;
      self.emit('close', err);
    });
    self.inwp.on('error', function (err) {
      self.emit('error', err);
    });

    // parse stdout of the inotifywatch command
    Lazy(self.inwp.stdout)
      .lines
      .map(String)
      .map(function (line) {
        try {
          return JSON.parse(line);
        } catch (err) {
          return { type: '', file: '' };
        }
      })
      .map(function (event) {
        event.type = event.type.split(',');
        return event;
      })
      .forEach(function (event) {

        // skip directories ?
        var isDir = (event.type.indexOf('ISDIR') != -1);
        if (isDir && !self.options.watchDirectory) {
          return;
        }

        if (event.type.indexOf('CREATE') != -1) {
          self.currentEvents[event.file] = 'add';
          fs.lstat(event.file, function (err, stats) {
            if (!err && !stats.isDirectory() && (stats.isSymbolicLink() || stats.nlink > 1)) {
              // symlink and hard link does not receive any CLOSE event
              self.emit('add', event.file);
              delete self.currentEvents[event.file];
            }
          });
        } else if (event.type.indexOf('MODIFY') != -1 || // to detect modifications on files
                   event.type.indexOf('ATTRIB') != -1) { // to detect touch on hard link 
          if (self.currentEvents[event.file] != 'add') {
            self.currentEvents[event.file] = 'change';
          }
        } else if (event.type.indexOf('DELETE') != -1) {
          self.emit('unlink', event.file);
        } else if (event.type.indexOf('CLOSE') != -1) {
          if (self.currentEvents[event.file]) {
            self.emit(self.currentEvents[event.file], event.file);
            delete self.currentEvents[event.file];
          } else {
            self.emit('unknown', event.file, event);
          }
        }
      });

    // parse stderr of the inotifywatch command
    Lazy(self.inwp.stderr)
      .lines
      .map(String)
      .forEach(function (line) {
        if (/^Watches established/.test(line)) {
          // tell when the watch is ready
          self.emit('ready', self.inwp);
        } else if (/^Setting up watches/.test(line)) {
          // ignore this message
        } else {
          self.emit('error', new Error(line));
        }
      });

    // Maybe it's not this module job to trap the SIGTERM event on the process
    // ======>
    // check if the nodejs process is killed
    // then kill inotifywait shell command
    // process.on('SIGTERM', function () {
    //   if (self.inwp) {
    //     self.inwp.kill();
    //   }
    // });

  };

  self.runProcess();
}

INotifyWait.prototype = Object.create(EventEmitter.prototype);

INotifyWait.prototype.close = function (cb) {
  // if already killed
  if (!this.inwp) {
    if (cb) {
      this.removeAllListeners(); // cleanup
      return cb(null);
    }
    return;
  }
  // if not already killed
  this.on('close', function (err) {
    this.removeAllListeners(); // cleanup
    if (cb) {
      return cb(err);
    }    
  });
  this.inwp.kill();
};

module.exports = INotifyWait;

/**
 *  Mixing object properties. 
 */
var mixin = function() {
  var mix = {}; 
  [].forEach.call(arguments, function(arg) { 
    for (var name in arg) {
      if (arg.hasOwnProperty(name)) {
        mix[name] = arg[name];
      }
    }
  });
  return mix;
};
