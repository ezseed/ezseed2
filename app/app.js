//espace disque

//gérer la suppression

//Admin !!!
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , admin = require('./routes/admin')
  , streaming = require('./routes/streaming')
  , files = require('./routes/files')
  , db = require('./core/database')
  , users = require('./core/helpers/users')
  , http = require('http')
  , _ = require('underscore')
  , path = require('path')
  , cache = require('memory-cache')
;

var jf = require('jsonfile');

//to be removed
// global.rootPath = __dirname;

global.config = jf.readFileSync(__dirname + '/config.json');

//Writing conf file
if(global.config.root.length == 0) {
  global.config.root = __dirname;
  jf.writeFileSync(__dirname + '/config.json', global.config);
}

var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser('secret'));
app.use(express.session());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static('/home/myName/allMyMedia/'));

//Middleware session
app.use(function(req, res, next){
  var err = req.session.error
    , msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
  if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';

  res.locals.appDir = __dirname; //tomove

  res.locals.config = _.extend(global.config, 
                                { 
                                  location : req.originalUrl //request path dirname 
                                });

  res.locals.location = req.originalUrl;
  res.locals.ip_server = require('os').hostname();
  console.log(res.locals.ip_server);

  if(req.session.user) {
    var u = req.session.user;
    delete u.hash;
    res.locals.user = u;
    db.paths.byUser(u.id, function(err, paths) {
      users.usedSize(paths, function(size) {
        res.locals.usedSize = size;
        next();
      });
    });

  } else {
    res.locals.user = null;
    next();
  }
});

//Needs to be the last one called (http://stackoverflow.com/questions/12550067/expressjs-3-0-how-to-pass-res-locals-to-a-jade-view)
app.use(app.router);

/* Opening Database */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ezseed');

var mongo = mongoose.connection;

mongo.on('error', console.error.bind(console, 'connection error:'));
mongo.once('open', function callback () {
  console.log('DB opened successfuly !');
});


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/*
* App starts here 
*/

app.get('/', user.restrict, routes.index);
app.get('/login', user.login);
app.get('/logout', user.logout);
app.post('/login', user.authenticate);

app.get('/archive/(:id)', user.restrict, files.archive);
app.get('/download/archive/(:id)', files.downloadArchive);
app.get('/download/(:id)', files.download);
app.get('/download/(:id)/(:fid)', files.download);
app.get('/delete/(:type)/(:id)', user.restrict, files.delete);

app.get('/watch/(:id)', streaming.watch);
app.get('/watch/(:id)/(:fid)', streaming.watch);

// app.get('/stream/(:id)', streaming.stream);
app.get('/listen/(:id)', streaming.listen);

//dummy install
var err = null;
//fs.stat('./routes/install.js', function(err, stat) {
  if(err == null) {
    var install = require('./routes/install');
    app.get('/install', install.install);
    app.post('/install/create', install.create);

    app.get('/install/folder', install.folder);
    app.post('/install/folder/create', install.folderCreation);

    app.get('/install/complete', install.complete);

    app.get('/install/torrent', install.torrent);
    app.post('/install/transmission', install.transmission);
  }
//});

app.get('/admin', user.restrict, admin.restrict, admin.index);
app.post('/admin/config', user.restrict, admin.restrict, admin.config);
app.get('/admin/path', user.restrict, admin.restrict, admin.path);
app.post('/admin/path', user.restrict, admin.restrict, admin.createPath);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
var io = require('./core/sockets').listen(server);


// //less log
// io.set('log level', 1);

// module.exports.io = io;


 
