var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;

var chatSchema = new Schema({
	active: {type: Boolean, default: true}
});

var messagesSchema = new Schema(
	{
		user: String,
		message: String,
		time: { type: Date, default: Date.now }
	}
);

var chatModel = mongoose.model('pluginchat', chatSchema);
var messagesModel = mongoose.model('pluginchat_messages', messagesSchema);

var database = {
	// setStatus: function(status, cb) {
	// 	chatModel.findOneAndUpdate({}, {active: status}, cb);
	// },
	// get: function(cb) {

	// 	chatModel.findOne({}, function (err, chat) {
	// 		if(err)
	// 			console.error(err);

	// 		if(!err && !chat) {
	// 			chat = new chatModel({
	// 				active: true
	// 			});

	// 			chat.save();
	// 		}

	// 		return cb(err, chat);
	// 	});
	// },
	getMessages: function (cb) {
		messagesModel.find({}, cb);
	},
	//message is an object !
	saveMessage: function(message, cb) {
		var message = new messagesModel(message);
		message.save();

		cb();
	}
};

module.exports = database;