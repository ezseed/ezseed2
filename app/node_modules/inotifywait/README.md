# node-inotifywait

Yet another nodejs fs.watch implementation that can watch:

* folders recursively
* big number of directories and files
* with low CPU use

This implementation is a wrapper above the inotifywait system command.

### Why

Because other implementations:
* [fs.watch](http://nodejs.org/api/fs.html) 
* [node-watch](https://github.com/yuanchuan/node-watch)
* [chokidar](https://github.com/paulmillr/chokidar)
* [watch](https://github.com/mikeal/watch)

Are not performant for huge number of directories and files watching. Some are not recursive, other have high CPU usage when watching lot of directories and files. 

### Installation

```bash
npm install inotifywait
```

Prerequisit is to have the `inotifywait` command in the current PATH. On debian/ubuntu, you have to `sudo apt-get install inotify-tools`

### Events

* add (p1 = filename): received when a file or directory is added
* change (p1 = filename): received when a file is modified
* unlink (p1 = filename): received when a file or directory is deleted
* unknown (p1 = filename, p2 = full raw event object): received when unknown action is done on a file or directory

* ready (p1 = unix process object): received when inotifywait is ready to watch files or directories
* close (no parameter): received when inotifywait exited
* error (p1 = error object): received when an error occures

### Example

```js
var INotifyWait = require('inotifywait');

var watch1 = new INotifyWait('/tmp/', { recursive: false });
watch1.on('ready', function (filename) {
  console.log('watcher is watching');
});
watch1.on('add', function (filename) {
  console.log(filename + ' added');
  watch1.close(); // stop watching
});

var watch2 = new INotifyWait('/var/log/', { recursive: true });
watch2.on('change', function (filename) {
  console.log(filename + ' changed');
  watch2.close(); // stop watching
});
``` 
