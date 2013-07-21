var allocine = require('../lib/allocine-api');

allocine.api('movie', {code: '143067'}, function(error, result) {
	if(error) { console.log('Error : '+ error); return; }

	console.log('Success !');
	console.log(result.movie.title);
});