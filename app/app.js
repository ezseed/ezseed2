
/**
 * Module dependencies.
 */
var jf = require('jsonfile');

if(!process.env.NODE_ENV)
  process.env.NODE_ENV = 'development';

global.config = jf.readFileSync(__dirname + '/config.json');

//Writing conf file
if(global.config.root.length == 0 || !global.config.aucun) {
  global.config.root = __dirname;
  global.config.aucun = true;
  jf.writeFileSync(__dirname + '/config.json', global.config);
}

process.on('uncaughtException', function ( err ) {

    console.log(1, err.message);
    console.log(1, err.stack);

    if(err.code == 'MODULE_NOT_FOUND')
      console.log(5, 'Please try : npm install');


    setTimeout(function() {
      process.exit(1);
    }, 10);
});

var console = require('./core/logger');

var express = require('express')
  , db = require('./core/database')
  , users = require('./core/helpers/users')
  , http = require('http')
  , _ = require('underscore')
  , path = require('path')
  , MongoStore = require('connect-mongo')(express)
;


var app = express();

//See expressjs (nginx X-Forwarded-*)
app.enable('trust proxy');

app.set('port', 3001); //don't touch (sockets desktop.js are listening to this port)

//More views engines ? See ghost each theme = git submodule !
app.set('views', path.join(__dirname, 'themes', global.config.theme, 'views'));

app.set('view engine', 'ejs');

app.use(express.logger('dev'));
app.use(express.compress());

//not using bodyparser middleware
app.use(express.json());
app.use(express.urlencoded());

app.use(express.cookieParser());
app.use(express.methodOverride());

//Mongodb sessions
app.use(express.session({
  store: new MongoStore({
    url: 'mongodb://127.0.0.1:27017/',
    db : 'sessions'
  }),
  secret: '3xam9l3'
}));



app.use(express.static(path.join(__dirname, 'public')));

//Only theme
app.use(express.static(path.join(__dirname, 'themes', global.config.theme, 'public')));


//Middlewares
require('./core/helpers/middlewares')(app);
require('./plugins')(app);

//Needs to be the last one called (http://stackoverflow.com/questions/12550067/expressjs-3-0-how-to-pass-res-locals-to-a-jade-view)
app.use(app.router);


/*
* Routes
*/
  
require('./routes/user')(app);
require('./routes/files')(app);
require('./routes/streaming')(app);
require('./routes/admin')(app);
require('./routes/api').app(app);


/* 
* Open database and launch server
*/
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/ezseed');

var mongo = mongoose.connection;

mongo.on('error', console.log.bind(global, 'connection error:'));

mongo.once('open', function callback () {
  console.log('DB opened successfuly !');

  var server = http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  });

  var io = require('./core/sockets').listen(server);

});
-

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});


//This should be an error
app.use(function(err, req, res, next) {
  console.log('This should be an error');

  if(err)
    console.log('error', err);

  next(err);
});

//This is shit
//http://www.itamarweiss.com/post/57962670227/error-handling-in-node-js-express
// app.all('*', function(req, res, next){

//   if(req.route.params[0].match(/css|js|views|img|plugins|audiocogs/))
//     next();
//   else {
//     res.status(404);
    
//     // respond with html page
//     if (req.accepts('html')) {
//       res.render('404', { url: req.url });
//       return;
//     }

//     // respond with json
//     if (req.accepts('json')) {
//       res.send({ error: 'Not found' });
//       return;
//     }

//     // default to plain-text. send()
//     res.type('txt').send('Not found');
//   }
// });