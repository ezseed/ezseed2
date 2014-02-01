var _ = require('underscore')
  , pathInfo = require('path')
  , explorer = require('./explorer')
  , async = require('async')
  , fs = require('fs')
  , jf = require('jsonfile')
  , db = require('./database');

if(!fs.existsSync(__dirname + '/../public/tmp'))
	fs.mkdirSync(__dirname + '/../public/tmp', '0775');

var Watch = function(params) {
	var self = this;

	self.addTimeout = null;
	self.removeTimeout = null;
	self.removedFiles = [];
	self.path = params.path;
	self.uid = params.uid;
	self.pid = params.pid;

	self.removedIds = [];

	return _.extend(self, {
		eventHandler : function(event, data) {

			if(event == 'delete')
				this.delete(data);
			else if(event == 'move' || event == 'moved' || event == 'moved to' || event == 'create')
				this.create(data);
			else
				this.unknown(data);
		},

		delete : function(filename) {
			var self = this;

			self.removedFiles.push(
				pathInfo.join(self.path, filename)
			);

			if(self.removeTimeout !== null)
				clearTimeout(self.removeTimeout);

			self.removeTimeout = setTimeout(function() {
				console.log('removeFile');

				watcher.removeFiles({uid : self.uid, removedFiles : self.removedFiles, removedIds : self.removedIds}, function() {
					self.removeTimeout = null;
					watcher.writeRemovedFiles(self);
				});
			}, 750);

		},

		create : function(filename) {
			// var self = this;

			// if(self.addTimeout !== null)
			// 	clearTimeout(self.addTimeout);

			// self.addTimeout = setTimeout(function() {
			// 	console.log('Watcher updateFiles');

			// 	watcher.updateFiles(self.uid, function() {
			// 		self.addTimeout = null;
			// 	});

			// }, 750);
		},

		unknown : function(filename) {
			//Could be nice : add the file once + % downloaded ? possible ?
			//console.log('Unknow event', filename);
		}
	}, new Watcher(self.path, function(event, data) {
		self.eventHandler(event, data);
	}) );
};

// util.inherits(Watch, Watcher);

var watcher = {
	watchers : [],
	initFetch : function() {
		db.users.getAll(function(err, users) {
			var paths = [];
			_.each(users, function(u) {
				_.each(u.paths, function(p) {
					watcher.watchers.push(
						new Watch(
							{path : p.path, uid:u._id, pid:p._id}
						)
					);
					// console.log(watcher.watchers);
				});
			});
		});

	},
	updateFiles : function(uid, cb) {
		console.log('Updating files - watcher');
		db.paths.byUser(uid, function(err, paths) {
            explorer.explore(paths, function(err, update) {
            	cb();
            });
        });
	},
	writeRemovedFiles : function(watch) {
		var path = pathInfo.join(__dirname, '/../public/tmp/', watch.uid+'.json');

		if(!fs.existsSync(path))
			jf.writeFileSync(path, watch.removedIds);
		else
			jf.writeFileSync(path, _.union(jf.readFileSync(path), watch.removedIds));

		watch.removedIds = [];
	},
	//add path ID to unset from array type
	removeFiles : function(params, cb) {
		var removedFiles = params.removedFiles, done = 0;

		db.files.byUser(params.uid, 0, function(err, pathsFiles) {

			pathsFiles = pathsFiles.paths;
			
			var files = []
			  , i = pathsFiles.length - 1 //paths cursor
			  , j = removedFiles.length - 1 //removedFiles cursor
			  , dirnames = []
			  ;

			//All files from paths to array
			do {
				files.push(pathsFiles[i].movies, pathsFiles[i].albums, pathsFiles[i].others);
			} while(i--)

			files = _.flatten(files);

			//Get the dirname from each removed files
			do {
				dirnames.push(pathInfo.dirname(removedFiles[j]));
			} while(j--)

			dirnames = _.uniq(dirnames);

			var k = dirnames.length - 1;

			do {
				//Finds by prevDir
				var toRemove = _.where(files, {prevDir : dirnames[k]}), elements;

				//searches for the file path in an element
				_.each(toRemove, function(e) {

					if(e.songs !== undefined) {
						type = 'albums';
						elements = e.songs;
					} else if (e.videos !== undefined) {
						type = 'movies';
						elements = e.videos;
					} else {
						type = "others";
						elements = e.files;
					}

					//If we find it, we can remove safely from DB
					if( _.findWhere(elements, {path : removedFiles[k]}) !== undefined ) {

						db.files[type].delete(e._id, function(err) {
							params.removedIds.push(e._id);
							done++;

							if(done == removedFiles.length)
								cb();
						});

						return false;
					}

				});

			} while(k--)

			
		});
	}
};

module.exports = watcher;
