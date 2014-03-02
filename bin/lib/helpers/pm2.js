var console = require(global.config.root+'/core/logger');
var exec = require('child_process').exec;

//https://github.com/Unitech/pm2-interface ?
module.exports = {
	restart: function(name, cb) {
		exec('pm2', ['restart', name], function(err) {
			
			if(err !== undefined && err !== null) {
				console.log('error', err);
				console.log('debug', 'pm2 restart '+name+''.info);
			}

			return typeof cb == 'function' ? cb() : true;
		});
	},
	 start: function (cb) {
	 	exec('pm2', ['start', global.app_path+'/ezseed.json'], function(err) {
			
			if(err !== undefined && err !== null) {
				console.log('error', err);
				console.log('debug', 'pm2 start ezseed.json'.info);
			}

			return typeof cb == 'function' ? cb() : true;
		});
	 }
};