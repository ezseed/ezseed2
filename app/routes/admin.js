/*
 * GET /admin
 */
exports.index = function(req, res) {
	res.render('admin', { title: 'Ezseed V2 - Administration' });
}


exports.restrict = function (req, res, next) {
	if (req.session.user && req.session.user.role == 'admin') {
		next();
	} else {
		req.session.error = "L'accès à cette section n'est pas autorisé ! <i class='entypo-cross pullRight'></i>";
		res.redirect('/');
	}
}
