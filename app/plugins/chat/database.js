var mongoose = require('mongoose')
	, Schema =  mongoose.Schema
	, ObjectId = Schema.ObjectId;

var console = require(global.config.root + '/core/logger');

var chatSchema = new Schema({
	user: ObjectId,
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
	setStatus: function(uid, status, cb) {
		chatModel.findOneAndUpdate({user: uid}, {active: status}, function(err, updated) {
			if(err)
				console.error(err);

			cb(err, updated);
		});
	},
	getStatus: function(uid, cb) {
		if(!uid)
			cb('No user', {});

		chatModel.findOne({user: uid}, function(err, doc) {
			
			if(err)
				console.error(err);

			// console.debug('Get status, doc ', doc);

			if(!doc) {
				var doc = new chatModel({
					user: uid
				});

				doc.save(cb);
			} else {
				cb(err, doc.active);
			}
		})
	},
	purge: function(cb) {
		messagesModel.remove({}, cb);
	},
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