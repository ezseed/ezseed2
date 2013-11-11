var _ = require('underscore')
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

		    if(u.client == 'transmission') {

		      var transmissionConfig = jf.readFileSync(__dirname + '/scripts/transmission/config/settings.'+u.username+'.json');

		      //saving rpc-port
		      u['rpc-port'] = transmissionConfig['rpc-port'];
		    }

		    res.locals.user = u;

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