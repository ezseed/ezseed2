var level   = process.argv.indexOf('-d') === -1 ? 'info' : 'debug';

if(level == 'info' && process.env.NODE_ENV == 'production')
	level = 'notice';

var winston = require('winston');

var logger = new (winston.Logger)({
	transports: [
	  new (winston.transports.Console)({ level: level, colorize: true, levels: winston.config.syslog.levels }),
	  new (winston.transports.File)({ 
	  								   filename: global.config.root + '/exceptions.log'
	  	                             , handleExceptions: true 
	  	                             , levels: winston.config.syslog.levels
	  	                             , level: level
	  	                           })
	]
});

process.on('uncaughtException', function ( err ) {

    logger.log('alert', err.message);
    logger.log('alert', err.stack);

    if(err.code == 'MODULE_NOT_FOUND')
    	logger.log('notice', 'Please try : npm install', function () {
	      process.exit(1);

      	});
    else
    	process.exit();
});

module.exports = logger;