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

module.exports = logger;