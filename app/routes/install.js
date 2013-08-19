var _s = require('underscore.string')
	, fs = require('fs')
  	, bcrypt = require('bcrypt-nodejs')
  	, mongoose = require('mongoose')
  	, models = require('../models')
  	, Users = mongoose.model('Users')
  	, Config = mongoose.model('Config')
	, Pathes = mongoose.model('Pathes');


/*
* GET install
*/

exports.install = function(req, res) {
	res.send('\
		<h1>Bienvenue sur ta nouvelle seedbox !</h1>\
		<form method="POST" action="/install/create">\
			<fieldset>\
				<legend>Créé le compte admin :</legend>\
				<label for="username">Nom d\'utilisateur</label>\
				<input type="text" name="username" />\
				<label for="password">Mot de passe</label>\
				<input type="password" name="password" />\
				<button type="submit">Envoyer</button>\
			</fieldset>\
	');
}

/*
* GET folder
* buffer
*/

exports.folder = function(req, res) {

	var string = new Buffer(res.locals.message + '<p>Instanciez le dossier de téléchargement par défaut où seront créés les différents dossiers de téléchargement pour les utilisateurs</p>'+
		'<form method="POST" action="/install/folder/create">'+
			'<fieldset>'+
				'<legend>Chemin du dossier à parser (absolu) : </legend>'+
				'<label for="path">Chemin<sup>*</sup></label>'+
				'<input type="text" name="path" style="width:350px" value="' + process.cwd().replace('app','') + 'downloads" />'+
				'<button type="submit">Envoyer</button>'+
				'<p>'+
				'Ce dossier servira à conserver les fichiers téléchargés par les différents utilisateurs.<br>'+
				'Chaque utilisateur reçoit son propre dossier par après dans ce dossier et il est possible d\'y ajouter des dossiers à partager.<br/>'+
				'Assurez-vous que le dossier ne contient <strong>aucuns</strong> sous dossiers pouvant provoquer une erreur du script.<br /><br />'+
				'<small><sup>*</sup>laissez par défaut si vous n\'êtes pas sûr, le dossier doit avoir les droits en lecture/écriture</small>'+
				'</p>'+
			'</fieldset>'+
		'</form>');

	res.send(string.toString());
}

/*
* GET Torrent
*/
exports.torrent = function(req, res) {
	res.send('<h1>Installation d\'un client torrent</h1>\
		<form method="POST" action="/install/transmission">\
		<label>Mot de passe pour transmission</label><input type="password" name="password" required><br>\
		<input type="submit" value="Installer transmission"></form><a href="/install/complete">Passer cette étape</a>');
}

exports.complete = function(req, res) {
	res.send('Installation complète, supprimez le fichier /routes/install.js');
}

/*
* POST create a new user
*/

exports.create = function(req, res) {

	//Generates the hash
	bcrypt.hash(req.body.password, null, null, function(err, hash) {

		if (err) throw err;
		
		//We save only the hash
		var user = new Users ({
		  username : _s.trim(req.body.username),
		  role : 'admin',
		  hash : hash
		});

		user.save(function(err) {
			if(err) {
				//Checking for the username validation - see models/index.js
				if(_.isEqual(err.name, 'ValidationError')) {
					req.session.error = "Le nom d'utilisateur ne peut contenir que des caractères alphanumériques et des tirets";
	  				res.redirect('/install');
				}
			} else {
				req.session.regenerate(function(){
					//Saving the user
					req.session.user = user.session;
					res.redirect('/install/folder');
				});
			}
		})
		
	});
	
}


/*
* POST set the download Folder and create one for the admin
* TODO symlink
*/

exports.folderCreation = function(req, res) {
	
	fs.exists(req.body.path, function(exists) {
		if(exists) {
			var config = new Config ({'path' : req.body.path});
			
			config.save(function(err) {
				if(err) throw err;

				var userPath = req.body.path + '/'+ req.session.user.username + '/';
				var userFolderKey = new Buffer(userPath).toString('hex');

				fs.mkdir(userPath, function(err) {
					if(err) console.log(err);

					var exec = require('child_process').exec,
    					child;

    				child = exec('ln -sf '+ req.body.path +' ' + process.cwd() + '/public/downloads',
					  	function (error, stdout, stderr) {
						   

						    var path = new Pathes({
								'folderKey' : userFolderKey
							});

									
							path.save(function(err) {
								if(err) console.log(err);
							});

							path.on('save', function(obj) {
								//Add it to the user pathes, by id = faster :)
							//$push: { 
								Users.findByIdAndUpdate(req.session.user.id, { pathes: obj._id }, function(err) { 
									if(err) console.log(err);
									req.session.user.dir = userPath;
									res.redirect('/install/torrent');
								});
							});

						}
					);

				});
			});
			
		} else {
			req.session.error = "Merci d'entrer un chemin valide";
			res.redirect('/install/folder');
		}
	});
}

/*
* POST install transmission - run shell !
*/
exports.transmission = function(req, res) {

	var execFile = require("child_process").execFile,
    installShell = process.cwd() + '/scripts/transmission/transmission.install.sh';

    fs.chmodSync(installShell, '777');

    execFile(installShell, process.cwd(), null,
	  	function (error, stdout, stderr) {

		    //Creating user
		    execFile(process.cwd() +'/scripts/transmission/transmission.user.sh', 
		    	[req.session.user.username, req.body.password, req.session.user.dir, process.cwd()],
		    	null,
		    	function(err, stdout, sdterr) {


		    		var settings = process.cwd() + '/scripts/transmission/config/settings.'+req.session.user.username+'.json';

					fs.readFile(settings, function (err, data) {
						if (err) throw err;
						var d = JSON.parse(data);


						//Default settings replacement
						d['ratio-limit-enabled'] = true;
						d['incomplete-dir-enabled'] = true;
						d['peer-port-random-on-start'] = true;
						d['lpd-enabled'] = true;
						d['peer-socket-tos'] = 'lowcost';
						d['rpc-password'] = req.body.password;
						d['rpc-enabled'] = true;
						d['rpc-whitelist-enabled'] = false;
						d['rpc-authentication-required'] = true;
						d['rpc-username'] = req.session.user.username;

						d['download-dir'] = req.session.user.dir;


						Users.count(function (err, count) {

							d['rpc-port'] = d['rpc-port'] + count;

							fs.writeFileSync(settings, JSON.stringify(d));

							execFile(process.cwd() +'/scripts/transmission/transmission.sh', 
						    	[req.session.user.username, 'start'],
						    	null,
						    	function(err, stdout, sdterr) {

									res.redirect('/install/complete');

								}
							);

						});

					});


				    
		    	}
		    )


		}
	);







}