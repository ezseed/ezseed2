var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;

var moviesInformations = new Schema({
	season: String,
	title: String,
	synopsis: String,
	trailer: String,
	picture: String,
	id: String
});

module.exports = mongoose.model('MoviesInformations', moviesInformations);
