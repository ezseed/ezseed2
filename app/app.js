
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , streaming = require('./routes/streaming')
  , files = require('./routes/files')
  , http = require('http')
  , path = require('path')
  , _ = require('underscore')
  , watcher = require('./utils/watcher.js').watcher
  , tmpWatcher = require('./utils/watcher.js').tmpWatcher
;

var mongoose = require('mongoose')
  , models = require('./models')
  , Pathes = mongoose.model('Pathes')
  , Movies = mongoose.model('Movies')
  , Albums = mongoose.model('Albums')
  , Others = mongoose.model('Others')
  , Users = mongoose.model('Users')
  , F = mongoose.model('File');

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

app.get('/watch/(:id)', streaming.watch);
// app.get('/listen/(:id)', streaming.listen);

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

  }
//});

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


var io = require('socket.io').listen(server);
//less log
//io.set('log level', 1);

module.exports.io = io;

io.sockets.on('connection', function (socket) {

  socket.on('update', function(uid) {
    Users.findById(uid).populate('pathes').exec(function(err, doc) {
      var ps = doc.pathes
        , paths = new Array()
        , pathsKeys = new Array();

      ps.forEach(function(e, i) {
        pathsKeys.push(e.folderKey);
        paths.push(new Buffer(e.folderKey, 'hex').toString());
      });

      watcher({'paths':paths, 'pathsKeys':pathsKeys,'allFiles': true, 'uid':uid, 'sid':socket.id });

    });
  });

  //Adds a tmp watcher + socket id, watch change of specific archive
  socket.on('archive', function(id) {
    tmpWatcher({
      'archive' : { 'path' : __dirname + '/public/tmp/'},
      'sid' : socket.id
    });
  });

});

 
