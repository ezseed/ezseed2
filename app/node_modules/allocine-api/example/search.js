var allocine = require('../lib/allocine-api');

allocine.api('search', {q: 'spiderman', filter: 'movie'}, function(error, results) {
	if(error) { console.log('Error : '+ error); return; }
	
	console.log('Success !');
	console.log(results);
});