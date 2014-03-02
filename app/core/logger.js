var level   = process.argv.indexOf('-d') === -1 ? 'info' : 'debug'
  , winston = require('winston')
  , log_path = global.config.root + '/../logs';

if(level == 'info' && process.env.NODE_ENV == 'production')
	level = 'notice';

//Writes log directory + transport file
var fs = require('fs');
if(!fs.existsSync(log_path))
	fs.mkdirSync(log_path, '777');

if(!fs.existsSync(log_path + '/err.log'))
	fs.writeFileSync(log_path + '/err.log');

if(!fs.existsSync(log_path + '/memory.log'))
	fs.writeFileSync(log_path + '/memory.log');

/**
 * Levels
 * 
 *  0 emerg    
 *  1 alert    
 *  2 crit     
 *  3 error    
 *  4 warning  
 *  5 notice   
 *  6 info     
 *  7 debug    
 *
 */


var logger = new (winston.Logger)({
	transports: [
	  	new (winston.transports.Console) ({ 

	  		level: level, 
	  		colorize: true, 
	  		levels: winston.config.syslog.levels,
	  		timestamp: level == 'debug' ? true : false
	  	}),

	  	new (winston.transports.File) ({ 
			filename: log_path + '/err.log',
	        levels: winston.config.syslog.levels,
	  		timestamp: level == 'debug' ? true : false,
	        level: 'notice' //forces level for file transport

	    })
	],
	exitOnError: false
});

logger.on('error', function (err) { 
	console.error("Logger error", err);
});


/**
 * Debugging tools
 */

/**
 * Logging exception before exiting
 * @param  {[type]} err [description]
 * @return {[type]}     [description]
 */
process.on('uncaughtException', function ( err ) {

    logger.emerg(err.message);
    logger.emerg(err.stack);

    if(err.code == 'MODULE_NOT_FOUND')
    	logger.notice('Please try : npm install', function () {
        process.exit(1); //exit
    	});
    else
      logger.emerg(err.code, function() {
        process.exit(1);
      });
});

//memwatch
var memwatch = require('memwatch');

var memory_logger = new (winston.Logger)({
	transports: [
  		new (winston.transports.File) ({ 

		    filename: global.config.root + '/log/memory.log',
            levels: winston.config.syslog.levels,
            level: 'notice',
            timestamp: true,
           	colorize: false, 
       })
	]
});

memwatch.on('leak', function(info) { 
	memory_logger.alert(info);
});

memwatch.on('stats', function(stats) { 
	//Only log stats on debug
	if( process.argv.indexOf('-d') === 1 )
		memory_logger.notice('Memory stats', stats);
});


module.exports = logger;