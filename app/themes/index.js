var path = require('path'), fs = require('fs'), _ = require('underscore');

var themesPath = path.join(global.conf.root, "themes");

var themes = fs.readdirSync(themesPath);

//Parsing the themes folder
module.exports =  
	_.reject(
		_.map(themes, function(theme) { 
			theme = path.join(themesPath, theme);

			if(fs.statSync(theme).isDirectory()) {
				return path.basename(theme);
			} else 
				return null;
		}),
	function(theme) {
		return theme === null;
	});