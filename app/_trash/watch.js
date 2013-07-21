//if the config is set
			    if(!_.isEmpty(config)) {

			        watch.createMonitor(config.path + req.session.user.username, {ignoreDotFiles : true}, function (monitor) {
				        monitor.files['../downloads/.zshrc']; // Stat object for my zshrc.
				        monitor.on("created", function (f, stat) {
				        	
				        	//hex path to watch
				        	var userFolderKey = new Buffer(config.path + req.session.user.username).toString('hex');

				        	db.pathes.findOne({'userFolderKey' : userFolderKey}, function(err, doc) {
				        		if(_.isEmpty(doc)) {
				        			var document = {
				        				'userFolderKey': userFolderKey,
				        				'files' : {
				        					'albums' : [],
				        					'movies' : [],
				        					'others' : []
				        				}
				        			};

				        			db.pathes.insert(document, function(err, doc) { });
				        		}
				        	});

				        	/*TODO Move this so it can be called by monitor + parser*/

				        	//No dir
					        if(!stat.isDirectory()) {
					        	
					          	var file = {
					          		mime : mime.lookup(f),
					          		stat : stat,
					          		path : f,
					          		name : path.basename(f),
					          		ext : path.extname(f)
					          	};

					          	//speed type from mime
						        var type = file.mime.split('/'),
						            prevDir = f.replace(path.basename(f), ''),
						          	prevDirKey = new Buffer(prevDir).toString('hex');


						        if(type[0] == 'video') {
						        	console.log('Video');

						          	file = release.parseVideoName(file);

						          	//Save in the userfolder video folder key ;)

						          	
						          	//db.files.insert()

						            // console.log('mime : '+mime.lookup(f));
						            // console.dir(stat);
						        } else if (type[0] == 'audio') {

						        	//If the previous dir isn't the user download folder
						        	if(prevDirKey != userFolderKey) {

							        	fs.stat(prevDir, function(err, stats) {
							        		if(err) console.log(err);

							        		//It's an album parse, find cover and save files pathes
							        		if(stats.isDirectory()) {

							        			//Check if the albums exists already
												db.pathes.findOne({'userFolderKey':userFolderKey}, function(err, docs) {
													if(err) console.log(err);

													console.log(docs.files.albums);
													//No albums yet adding one
													if(docs.files.albums.length == 0) {

														var tags = id3(fs.readFileSync(f)); 

									        			var album = {
									        				key : prevDirKey,
									        				path : prevDir,
									        				artist : tags.artist,
									        				album : tags.album,
									        				year : tags.year,
									        				genre : tags.genre,
									        				cover : release.findCover(prevDir),
									        				files : [
									        					{ title : tags.title }
									        				]
									        			};

									        			docs.files.albums.push(album);

														db.pathes.update(
															{'userFolderKey': userFolderKey}, 
															{'files' : {'albums': docs.files.albums} }, 
															function(err, num) {
																if(err) console.log(err);

																if(num > 0)
																	console.log('Album added');
															}
														);


													} else {
														console.log('Albums :');
														console.log(docs.files.albums);

														docs.files.albums.forEach(function(e, i, array) {

															console.log(e);
															if(e.key == prevDirKey)
																console.log('Album exists');
														});
													}

													

												});
											/*		//It's empty, adding the album to the db
													if(_.isEmpty(docs)) {
							        					console.log('Album founded');

							        					var tags = id3(fs.readFileSync(f)); 

									        			var album = {
									        				key : prevDirKey,
									        				path : prevDir,
									        				artist : tags.artist,
									        				album : tags.album,
									        				year : tags.year,
									        				genre : tags.genre,
									        				cover : release.findCover(prevDir),
									        				files : [
									        					{ title : tags.title }
									        				]
									        			};

														db.pathes.findOne({'userFolderKey':userFolderKey}, function (err, docs) {
															if(err) console.log(err);
														
															docs.files.albums.push(album);


															db.pathes.update(
																{'userFolderKey': userFolderKey}, 
																{'files' : {'albums': docs.files.albums} }, 
																function(err, num) {
																	if(err) console.log(err);

																	console.log('Replaced : ' + num);
																}
															);
														});
													the album exists already, simply add the file to the list
													} else {
														var tags = id3(fs.readFileSync(f));

														var file = {title : tags.title};
														console.log('Album exists');
														console.log(docs);
													}
												});
											*/

												// db.pathes.findOne({'userFolderKey':userFolderKey}, function (err, docs) {
												// 	console.dir(docs.files);
												// });
							        		}

							        	});
									//else it's a unique audio file
									}

									// var tags = id3(fs.readFileSync(f)); 

									// _.extend(file, tags);


									// db.pathes.update(
									// 	{'userFolderKey': userFolderKey, 'files.albums.key' : prevDirKey}, 
									// 	{ $inc: {'files.albums.files' : file} },
									// 	function(err) {
									// 		if(err) console.log(err);
									// 	}
									// );



						        } else {
						        	//console.log('Other');
						        }

					        } else {
					        	console.log('dir added :' + f); 
					        }
						})
						monitor.on("changed", function (f, curr, prev) {
						console.log(f + ' changed');
						})
						monitor.on("removed", function (f, stat) {
						console.log(f + ' removed');

						//if is dir => hex => remove
						//else find dir => hex => file
						})
			        });
			   	}