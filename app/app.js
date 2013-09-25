//espace disque
//Ajouter fichiers plus rapidemment
//Régler others > limit
//gérer la suppression
//gérer les séries + episodes
//Admin !!!
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  //????
  , user = require('./routes/user')
  , streaming = require('./routes/streaming')
  , files = require('./routes/files')
  , http = require('http')
  , _ = require('underscore')
  , path = require('path')
  , cache = require('memory-cache')
;


var app = express();


//process.setMaxListeners(50);

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

  res.locals.appDir = process.cwd();
  res.locals.location = path.dirname(req.originalUrl);

  if(req.session.user) {
    var u = req.session.user;
    delete u.hash;
    res.locals.user = u;
  } else
    res.locals.user = null;

  next();
});

//Needs to be the last one called (http://stackoverflow.com/questions/12550067/expressjs-3-0-how-to-pass-res-locals-to-a-jade-view)
app.use(app.router);

/* Opening Database */
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ezseed');

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
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
app.get('/delete/(:type)/(:id)', user.restrict, files.delete);

app.get('/watch/(:id)', streaming.watch);
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

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require('./utils/sockets').listen(server);
// //less log
// io.set('log level', 1);

// module.exports.io = io;


 
