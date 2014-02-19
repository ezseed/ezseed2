var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;

var chatSchema = new Schema({
	active: {type: Boolean, default: true},
	messages: [
		{
			user: String,
			message: String,
			time: { type: Date, default: Date.now }
		}
	]
});

var model = mongoose.model('pluginchat', chatSchema);

var database = {
	setStatus: function(status, cb) {
		model.findOneAndUpdate({}, {active: status}, cb);
	},
	get: function(cb) {
		model.findOne({}, cb);
	},
	//message is an object !
	saveMessage: function(message, cb) {
		model.findOneAndUpdate({}, {messages: {$push: message} }, cb);
	}
};

module.exports = database;