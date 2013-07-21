} else {

			//Checks the movies
			Movies.findById(params.key, function(err, doc) {
				if(err) console.log(err);
				
				if(doc) {
					Others.findByIdAndRemove(params.key, function(err) {
						if(err)
							console.log(err);

						Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
							if(err)
								console.log(err);

							doc.others.pull(params.key);
							doc.save(function(err, doc) {
								return cb();	
							});
						});

					});
				//not founded, go on
				} else {
					//Checking the albums
					Albums.findById(params.key, function(err, doc) {
						if(err) console.log(err);

						if(doc) {
							Others.findByIdAndRemove(params.key, function(err) {
							if(err)
								console.log(err);

								Pathes.findOne({folderKey: params.pathKey}).exec(function(err, doc) {
									if(err)
										console.log(err);

									doc.others.pull(params.key);
									doc.save(function(err, doc) {
										return cb();	
									});
								});

							});
						} else {
							//Check in the others, same logic as before
							Others.findById(params.key, function(err, doc) {
								if(err) console.log(err);

								if(doc) {
									doc.files.addToSet(params.file);
			 						doc.save(function(err, doc) {
										return cb();	
									});
								} else {

									var other = new Others({
										_id : params.key,
										path : params.prevDir,
										files : [
											params.file
										]
									});

									other.save(function(err, obj) {
				        				Pathes.findOneAndUpdate({folderKey : params.pathKey}, 
				        					{ $addToSet : {'others': params.key }, 'dateUpdated': Date.now() }, 
				        					function(err) { 
				        						if(err) console.log(err); 
				        						return cb();
				        					}
				        				);
									});
								}
							})
						}
					});
				}
			});