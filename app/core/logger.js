var level   = process.argv.indexOf('-d') === -1 ? 6 : 7;

if(level == 6 && process.env.NODE_ENV == 'production') {
	level = 5;
}

var logger  = require('caterpillar').createLogger({level:level})
  , filter  = require('caterpillar-filter').createFilter()
  , human   = require('caterpillar-human').createHuman({spacer: "  "});

logger.pipe(filter).pipe(human).pipe(process.stdout);

logger = require('underscore').extend(logger, 
	{
		error: function() {
			var args = [].splice.call(arguments, 0);
			args.unshift('error');
			this.log.apply(this, args);
		},
		warn: function() {
			var args = [].splice.call(arguments, 0);
			args.unshift('warn');
			this.log.apply(this, args);
		},
		info: function() {
			var args = [].splice.call(arguments, 0);
			args.unshift('info');	
			this.log.apply(this, args);
		},
		debug: function() {
			var args = [].splice.call(arguments, 0);
			args.unshift('debug');
			this.log.apply(this, args);
		},
		trace: function() {
			var args = [].splice.call(arguments, 0);

			console.trace(args);
			this.log.apply(this, args);
		},
		alert: function() {
			var args = [].splice.call(arguments, 0);
			args.unshift('alert');
			this.log.apply(this, args);
		}
	}
);

/**
 * var winston = require('winston'), _ = require('underscore');

// var syslogConfig = {};

// syslogConfig.levels = {
//   emerg: 0,
//   alert: 1,
//   crit: 2,
//   error: 3,
//   warning: 4,
//   notice: 5,
//   info: 6,
//   debug: 7,
// };

// syslogConfig.colors = {
//   emerg: 'red',
//   alert: 'yellow',
//   crit: 'red',
//   error: 'red',
//   warning: 'red',
//   notice: 'yellow',
//   info: 'green',
//   debug: 'blue'
// };
 

// var winston_config = winston.config.syslog;

var level   = process.argv.indexOf('-d') === -1 ? 'info' : 'debug';

if(level == 6 && process.env.NODE_ENV == 'production') {
	level = 'notice';
}


// winston.addColors(winston.config.syslog.colors);

// var logger = new (winston.Logger)({
// 	transports: [
// 	  new (winston.transports.Console)({ level: 'debug', colorize: true, levels: winston.config.syslog.levels, emitErrs: true }),
// 	  new (winston.transports.File)({ 
// 	  								   filename: global.config.root + '/exceptions.log'
// 	  	                             , handleExceptions: true 
// 	  	                             , levels: winston.config.syslog.levels
// 	  	                             , level: level
// 	  	                           })
// 	]
// });

var logger = new (winston.Logger)({ level: 'debug', colorize: true, levels: winston.config.syslog.levels, emitErrs: true });

logger.on('error', function (err) {
	console.log(err.message);
	// if(err.indexOf('Unknown log error')) {
	// 	console.log(message);
	// }
});

// logger.log = function() {
// 	console.log(this.info);
// 	var args = Array.prototype.slice.call(arguments);
	
// 	this.info.apply(null, args);
// 	// return logger.apply(logger, args);
// }

module.exports = logger;
 */

module.exports = logger;