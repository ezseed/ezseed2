var exec = require('child_process').exec;

//https://github.com/Unitech/pm2-interface ?
module.exports = {
	restart: function(name, cb) {
		exec('pm2', ['restart', name], function(error) {
			
			if(err)
				console.log(error);

			return typeof cb == 'function' ? cb() : true;
		});
	}
};