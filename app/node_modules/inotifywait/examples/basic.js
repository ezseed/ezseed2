/*jslint node: true, maxlen: 100, maxerr: 50, indent: 2 */
'use strict';

var INotifyWait = require('../index.js');
var uuid        = require('uuid');
var fs          = require('fs');
var mkdirp      = require('mkdirp');
var remove      = require('remove');


var watcher = new INotifyWait('/tmp/');
watcher.on('ready', function (filename) {
  console.log('watcher is watching');
});
watcher.on('add', function (filename) {
  console.log(filename + ' added');
  watcher.close(); // stop watching
});
watcher.on('close', function () {
  console.log('watcher exited');
});

setTimeout(function () {
  fs.writeFileSync('/tmp/' + uuid.v1(), '.');
}, 1000);