var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;

/* Setting the pathes Schemes */

//File schema
var file = new Schema(
	{
		name: String,
		path: String,
		prevDir: String,
		prevDirRelative: String,
		type: String,
		ext: String,
		size: Number,
		disc: Number,
		episode: {type: String, default: null}
	}
);

//Albums schema
var albums = new Schema(
	{
		artist: String,
		album: String,
		year: String,
		genre: String,
		songs: [file],
		picture: String,
		prevDir: String,
		prevDirRelative: String,
		dateAdded: { type: Date, default: Date.now }
	}
);



var movies = new Schema({
	quality: String,
	subtitles: String,
	language: String,
	audio: String,
	season: String,
	format: String,
	movieType: String,
	name: String,
	infos: {'type': ObjectId, ref:'MoviesInformations'},
	videos: [file],
	prevDir: String,
	prevDirRelative: String,
	code: String,
	dateAdded: { type: Date, default: Date.now },
});

// movies.plugin(require(global.conf.root + '/plugins/allocine/mongoose').plugin);


//Others
var others = new Schema(
	{
		name: String,
		dateAdded: { type: Date, default: Date.now },
		prevDir: String,
		prevDirRelative: String,
		files: [file]
	}
);

//The pathes schema
var PathsSchema = new Schema({
	'path': {'type': String, 'unique': true},
	'albums': [{'type': ObjectId, ref: 'Albums'}],
	'movies': [{'type': ObjectId, ref: 'Movies'}],
	'others': [{'type': ObjectId, ref: 'Others'}],
	dateUpdated: { type: Date, default: Date.now }
	}
);

/* Basic user schema */
var UsersSchema = new Schema({
	username: { 'type': String, 'match': /^[a-zA-Z0-9-_]{3,15}$/, 'required': true, 'unique':true },
	hash: { type: String },
	role: { type: String, 'default': 'user' },
	client: { type: String, 'default': 'aucun'},
	spaceLeft: {type: Number, 'default': 1024},
	paths: [{type: ObjectId, ref:'Paths'}]
});

/* Setting a virtual schema for the session */
UsersSchema.virtual('session').get(function() {
	return {
		'id': this._id,
		'username': this.username,
		'role': this.role,
		'paths': this.pathes,
		'client': this.client,
		'size':this.spaceLeft
	}
});

var RemoveSchema = new Schema({
	path: {'type':ObjectId, 'required':true, 'unique': true, index: true},
	to_remove: [{
		type: {'type': String},
		item: {'type': ObjectId},
		file: {'type': ObjectId}
	}]
}, { autoIndex: false });

//store things that should be removed... Redis would me more appropriate... 
//Big change from mongo => SQL Lite ? + Redis ? :D
module.exports = mongoose.model('Remove', RemoveSchema);

module.exports = mongoose.model('Users', UsersSchema);
module.exports = mongoose.model('Paths', PathsSchema);

//Exporting individual schemas (movies,albums,others)
module.exports = mongoose.model('Movies', movies);

module.exports = require('../scrappers/model').model;

module.exports = mongoose.model('Albums', albums);
module.exports = mongoose.model('Others', others);
module.exports = mongoose.model('File', file);


