var _ = require('underscore')
  , fs = require('fs')
  , jf = require('jsonfile')
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
			_.extend(global.config, 
                { 
                  location : req.originalUrl, 
                  host : req.host
                }
            );

		res.locals.location = req.originalUrl;
		res.locals.host = req.host;

		next();
	},
	user : function(req, res, next) {
		if(req.session.user) {
		  	//Shortcut, used ?
			req.user = req.session.user;

		    var u = req.session.user;
		    delete u.hash; //Deleting password from user local variable

		    var confPath = global.config.root + '/scripts/transmission/config/settings.'+u.username+'.json';

		    console.log(u);
		    if(u.client == 'transmission') {

		    	if(fs.existsSync(confPath)) {

					var transmissionConfig = jf.readFileSync(confPath);

					//saving rpc-port
					u['rpc-port'] = transmissionConfig['rpc-port'];

				    res.locals.user = u;

					next();

			    } else {
			    	req.session.destroy(function(){
			    		req.session.error = "Une erreur de client torrent est survenue, merci de vous connecter à nouveau";
					    res.redirect('/login');
					});
			    }

			} else 
				next();
		} else {
			req.user = null;
			res.locals.user = null;
			next();
		}
	}

};


module.exports = function(app) {

	//Middleware session error/message
	_.each(middlewares, function(e) {
		app.use(e);
	})

}