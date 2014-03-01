var level   = process.argv.indexOf('-d') === -1 ? 'info' : 'debug';

if(level == 'info' && process.env.NODE_ENV == 'production')
	level = 'notice';

var winston = require('winston');

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
require('fs').mkdirSync(global.config.root + '/../logs', '777');
require('fs').writeFileSync(global.config.root + '/../logs/exceptions.log');

var logger = new (winston.Logger)({
	transports: [
	  	new (winston.transports.Console) ({ 

	  		level: level, 
	  		colorize: true, 
	  		levels: winston.config.syslog.levels,
	  		timestamp: level == 'debug' ? true : false
	  	}),

	  	new (winston.transports.File) ({ 

			filename: global.config.root + '/../logs/exceptions.log',
	        handleExceptions: true,
	        levels: winston.config.syslog.levels,
	        level: level,

	    })
	],
	exitOnError: false
});

logger.on('error', function (err) { 
	console.error("Logger error", err);
});


module.exports = logger;