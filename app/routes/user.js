var _s = require('underscore.string')
	, _ = require('underscore')
  	, bcrypt = require('bcrypt-nodejs')
  	, mongoose = require('mongoose')
  	, models = require('../models')
  	, db = require('../core/database')
  	, Users = mongoose.model('Users');

/*
* Authetication fonction
*/
function authenticate(name, pass, fn) {
	// query the db for the given username
	Users.findOne({ username: name }, function (err, user) {

		//No user
		if (err || _.isEmpty(user)) return fn(new Error('cannot find user'));
		
		//Bcrypt
		bcrypt.compare(pass, user.hash, function(err, res){
			if (err) return fn(err);

			//password is ok
			if (res === true) return fn(null, user.session);

			fn(new Error('invalid password'));
		})
	});
}

/*
* Checks is the session is there
* Called before / is reached
*/

exports.restrict = function (req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.error = "L'accès à cette section n'est pas autorisé ! <i class='entypo-cross pullRight'></i>";
		res.redirect('/login');
	}
}

/*
* GET Login
*/

exports.login = function(req,res) {
	if (req.session.user) {
		res.redirect('/');
	} else {
		res.render('login', { title: 'Ezseed V2 - Connexion' });
	}
}

/*
* GET Logout
*/ 

exports.logout = function(req, res) {
  // destroy the user's session to log them out
  // will be re-created next request
  req.session.destroy(function(){
    res.redirect('/login');
  });
}

exports.reset = function(req, res) {
	db.user.reset(req.params.uid, function() {
		res.redirect('/');
	});
}

/*
* POST Login
* TODO !
*/

exports.authenticate = function(req, res) {
	authenticate(req.body.username, req.body.password, function(err, user){
	if (user) {
	  // Regenerate session when signing in
	  // to prevent fixation 
	  req.session.regenerate(function(){
	    // Store the user's primary key 
	    // in the session store to be retrieved,
	    // or in this case the entire user object
	    req.session.user = user;
	    // req.session.success = 'Authenticated as ' + user.name
	    //   + ' click to <a href="/logout">logout</a>. '
	    //   + ' You may now access <a href="/restricted">/restricted</a>.';
	    res.redirect('/');
	  });
	} else {
	  req.session.error = 'Mauvaises informations de connexion  <i class="entypo-cross pullRight"></i>';
	  res.redirect('login');
	}
	});
}