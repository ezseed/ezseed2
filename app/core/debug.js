var logger = require('./logger');
/**
 * Logging exception before exiting
 * @param  {[type]} err [description]
 * @return {[type]}     [description]
 */
process.on('uncaughtException', function ( err ) {

    logger.log('emerg', err.message);
    logger.log('emerg', err.stack);

    if(err.code == 'MODULE_NOT_FOUND')
    	logger.log('notice', 'Please try : npm install', function () {
	      process.exit(1); //exit

      	});
    else
    	process.exit(1);
});

var memwatch = require('memwatch'), winston = require('winston');

var memory_logger = new (winston.Logger)({
	transports: [
  		new (winston.transports.File) ({ 

		   filename: global.config.root + '/log/memory.log',
           levels: winston.config.syslog.levels,
           level: 7
       })
	]
});

memwatch.on('leak', function(info) { 
	memory_logger.log('alert', Date.now(), info);
});

memwatch.on('stats', function(stats) { 

	if( process.argv.indexOf('-d') === 1 )
		memory_logger.log('notice', 'Memory stats', Date.now(), stats);

});
