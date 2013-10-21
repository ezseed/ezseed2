var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;

var _ = require('underscore');

/* Setting the pathes Schemes */

//File schema
var file = new Schema(
	{
		name : String,
		path : String,
		prevDir : String,
		prevDirRelative : String,
		type : String,
		size : Number,
		episode : {type : String, default : null}
	}
);

//Albums schema
var albums = new Schema(
	{
		artist : String,
		album : String,
		year : String,
		genre : String,
		songs : [file],
		picture : String,
		prevDir : String,
		prevDirRelative : String,
		dateAdded: { type: Date, default: Date.now }
	}
);

var movies = new Schema({
	movieType : String,
	name : String,
	season : String,
	title : String,
	synopsis : String,
	trailer : String,
	picture : String,
	videos : [file],
	prevDir : String,
	prevDirRelative : String,
	dateAdded: { type: Date, default: Date.now },
});

//Others
var others = new Schema(
	{
		name : String,
		dateAdded: { type: Date, default: Date.now },
		prevDir : String,
		prevDirRelative : String,
		files : [file]
	}
);

//The pathes schema
var PathsSchema = new Schema({
	'path': {'type': String, 'unique': true},
	'albums' : [{'type' : ObjectId, ref: 'Albums'}],
	'movies' : [{'type' : ObjectId, ref: 'Movies'}],
	'others' : [{'type' : ObjectId, ref: 'Others'}],
	dateUpdated : { type: Date, default: Date.now }
	}
);

/* Basic user schema */
var UsersSchema = new Schema({
	username : { 'type' : String, 'match': /^[a-zA-Z0-9-_]{3,15}$/, 'required': true },
	hash : { 'type' : String },
	role : { 'type' : String, 'default': 'user' },
	paths : [{'type' : ObjectId, ref:'Paths'}]
});

/* Setting a virtual schema for the session */
UsersSchema.virtual('session').get(function() {
	return {
		'id' : this._id,
		'username' : this.username,
		'role' : this.role,
		'pathes' : this.pathes
	}
});

var bcrypt = require('bcrypt-nodejs');

UsersSchema.statics.create = function(username, password, done) {
	var Users = this;
	
	//Generates the hash
	bcrypt.hash(password, null, null, function(err, hash) {
		//We save only the hash
		var user = new Users ({
		  username : username,
		  role : 'admin',
		  hash : hash
		});

		user.save(function(err, u) {
			if(err) {
				//Checking for the username validation - see models/index.js
				if(_.isEqual(err.name, 'ValidationError'))
					done("Le nom d'utilisateur ne peut contenir que des caractères alphanumériques et des tirets", null);
				else
					done(err, null);
			}
		});

		user.on('save', function(u) {
			done(null, u);
		});
	});
}


module.exports = mongoose.model('Users', UsersSchema);
module.exports = mongoose.model('Paths', PathsSchema);

//Exporting individual schemas (movies,albums,others)
module.exports = mongoose.model('Movies', movies);
module.exports = mongoose.model('Albums', albums);
module.exports = mongoose.model('Others', others);
module.exports = mongoose.model('File', file);


