var fs = require('fs')
  , path = require('path');

/**
 * Prompt validators
 * @type {Object}
 */
var validators = {
	user : function(v) {
		if(!v.match(/^[a-z0-9-_]{3,15}$/))
			throw new Error("Le nom d'utilisateur ne peut contenir que des caractères alphanumériques minuscules et des tirets".error);

		return v;
	},
	path : function(p) {
		if(!fs.existsSync(p))
			throw new Error("Le chemin spécifié n'est pas valide".error);

		return p;
	},
	ssl : function(ssl) {

		var nb = ssl.length, sslkeys = [];

		ssl = nb != 0 ? ssl.split(' ') : '';

		nb = ssl.length;

		if(nb == 2) {
			while(nb--) {
				var ext = path.extname(ssl[nb]);
				if(ext != '.pem' && ext != '.key')
					throw new Error("Il faut un fichier pem et un fichier key".error);
		
				sslkeys[nb] = {path : ssl[nb], ext: ext};
			}

		} else if(nb == 1)
			throw new Error("Il faut un fichier pem et un fichier key".error);
		
		if(sslkeys.length == 0)
			sslkeys = ssl;

		return sslkeys;
	}
};


module.exports = validators;