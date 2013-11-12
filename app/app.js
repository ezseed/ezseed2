//espace disque

//gérer la suppression

//Admin !!!
/**
 * Module dependencies.
 */

var express = require('express')
  , db = require('./core/database')
  , users = require('./core/helpers/users')
  , http = require('http')
  , _ = require('underscore')
  , path = require('path')
  , cache = require('memory-cache')
  , jf = require('jsonfile')
  , MongoStore = require('connect-mongo')(express)
;

global.config = jf.readFileSync(__dirname + '/config.json');

//Writing conf file
if(global.config.root.length == 0) {
  global.config.root = __dirname;
  jf.writeFileSync(__dirname + '/config.json', global.config);
}

var app = express();

// all environments
app.set('port', process.env.PORT || 3001);

//More views engines ? See ghost each theme = git submodule !
app.set('views', path.join(__dirname, 'themes', global.config.theme, 'views'));
app.set('view engine', 'ejs');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());

//Mongodb sessions
app.use(express.session({
  store: new MongoStore({
    url: 'mongodb://127.0.0.1:27017/',
    db : 'sessions'
  }),
  secret: '3xam9l3'
}));

//Crap (googleit)
app.use(express.methodOverride());

app.use(express.static(path.join(__dirname, 'public')));

//Only theme
app.use(express.static(path.join(__dirname, 'themes', global.config.theme, 'public')));

//Middlewares
require('./core/helpers/middlewares')(app);

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
* Routes
*/
  
require('./routes/user')(app);
require('./routes/files')(app);
require('./routes/streaming')(app);
require('./routes/admin.js')(app);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('./core/sockets').listen(server);


// //less log
// io.set('log level', 1);

// module.exports.io = io;


 
