
/*
 * GET home page.
 */

exports.index = function(req, res){
	//Let the socket do the job, we can render safely
  	res.render('desktop', { title: 'Ezseed V2 - Bureau' });
};

