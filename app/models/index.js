var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;


/* Configuration schema */
var ConfigSchema = new Schema(
	{
		path : { 'type': String }
	}
);


/* Setting the pathes Schemes */

//File schema
var file = new Schema(
	{
		_id : {'type' : String, 'unique' : true},
		mime : {'type':String},
		size : {'type':String},
		path : {'type':String},
		name : {'type':String},
		ext : {'type':String}
	}, 
	{ autoIndex : false }
);

//Albums schema
var albums = new Schema(
	{
		_id : {'type':String, 'unique':true},
		path : {'type':String},
		title: {'type':String},
		artist : {'type':String},
		album : {'type':String},
		year : {'type':String},
		genre : {'type':String},
		cover : {'type':String},
		dateAdded: { type: Date, default: Date.now },
		files : [file]
	},
	{ autoIndex: false }
);

//Movies Schema
var movies = new Schema(
	{
		_id : {'type' : String, 'unique' : true},
		type:{'type': String},
		quality : {'type':String},
		subtitles : {'type':String},
		language : {'type':String},
		audio : {'type':String},
		season: {'type':String},
		episode: {'type':String},
		code : {'type':String},
		title : {'type':String},
		synopsis : {'type':String},
		poster : {'type':String},
		trailer : {'type':String},
		dateAdded: { type: Date, default: Date.now },
		files : [file]
	},
	{ autoIndex : false }
);

//Others
var others = new Schema(
	{
		_id : {'type': String, 'unique':true},
		dateAdded: { type: Date, default: Date.now },
		title : {'type':String},
		files : [file]
	},
	{ autoIndex : false }
);

//The pathes schema
var PathesSchema = new Schema({
	'folderKey': {'type': String, 'unique': true},
	'albums' : [{'type' : String, ref: 'Albums'}],
	'movies' : [{'type' : String, ref: 'Movies'}],
	'others' : [{'type' : String, ref: 'Others'}],
	dateUpdated : { type: Date, default: Date.now }
	},
	{ autoIndex : false }

);

/* Basic user schema */
var UsersSchema = new Schema({
	username : { 'type' : String, 'match': /^[a-zA-Z0-9-_]{3,15}$/, 'required': true },
	hash : { 'type' : String },
	role : { 'type' : String, 'default': 'user' },
	pathes : [{'type' : String, ref:'Pathes'}]
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


module.exports = mongoose.model('Users', UsersSchema);
module.exports = mongoose.model('Config', ConfigSchema);
module.exports = mongoose.model('Pathes', PathesSchema);

//Exporting individual schemas (movies,albums,others)
module.exports = mongoose.model('Movies', movies);
module.exports = mongoose.model('Albums', albums);
module.exports = mongoose.model('Others', others);
module.exports = mongoose.model('File', file);


