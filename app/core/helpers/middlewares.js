var _ = require('underscore')
  , fs = require('fs')
  , jf = require('jsonfile')
  , cache = require('memory-cache')
;

var middlewares = {
	flashs : function(req, res, next){

		var err = req.session.error
		, msg = req.session.success;

		delete req.session.error;
		delete req.session.success;

		res.locals.message = '';

		if (err) res.locals.message = '<p class="msg error">' + err + '</p>';
		if (msg) res.locals.message = '<p class="msg success">' + msg + '</p>';

		next();
	},
	locals : function(req, res, next) {
		
		res.locals.config = 
			_.extend(global.conf, 
                { 
                  location : req.originalUrl, 
                  host : req.host
                }
            );

		res.locals.location = req.originalUrl;
		res.locals.host = req.host;
		
		res.locals.plugins = [];

		res.locals.themes = require(global.conf.root + '/themes');
		
		next();
	},
	user : function(req, res, next) {
		if(req.session.user) {
			//Shortcut, used ?
			req.user = req.session.user;

		    var u = req.session.user;
		    delete u.hash; //Deleting password from user local variable

		    var confPath = global.conf.root + '/../scripts/transmission/config/settings.'+u.username+'.json';

		    if(u.client == 'transmission') {

				if(fs.existsSync(confPath)) {

					var transmissionConfig = jf.readFileSync(confPath);

					//saving rpc-port
					u['rpc-port'] = transmissionConfig['rpc-port'];

				    res.locals.user = u;

					next();

			    } else {
					req.session.destroy(function(){
						// req.session.error = "Une erreur de client torrent est survenue, merci de vous connecter à nouveau";
					    res.redirect('/login');
					});
			    }

			} else {
				//rutorrent
				res.locals.user = u;
				next();
			}
		} else {
			req.user = null;
			res.locals.user = null;
			next();
		}
	},
	version: function(req, res, next) {

		if(cache.get('version'))
			res.locals.version = cache.get('version');
		else {
			var version = require(global.conf.root + '/../package.json').version;
			cache.put('version', version);
			res.locals.version = version;
		}

		next();
	}
};


module.exports = function(app) {

	//Middleware session error/message
	_.each(middlewares, function(e) {
		app.use(e);
	})

}