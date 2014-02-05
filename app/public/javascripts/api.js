define([
	'jquery',
    //Helpers
    'underscore', 'notify', 'cookie', 'quickfit',
], function($){

	var api = {
		last_update: 0,
		interval: null,
		files: function(cb) {
			var self = this, url = '/api/'+user.id+'/files';

        	if(self.last_update !== 0) {
        		loader();
        		url = url + '?t=' + self.last_update;
			}

            jQuery.getJSON( url
                , function( data, textStatus ) {
                    
                    if(data) {
                        if(data.paths.length) {
                            self.desktop.append(data.paths);
                            self.last_update = Date.now();
                        } else {
                            alert('Aucuns fichiers trouvés');
                            loader();
                        }

                    } else {
                        console.error(textStatus, data);
                    }

                    return typeof cb == 'function' ? cb(null, data) : true;

            });
		},
		size: function() {

			jQuery.getJSON( '/api/'+user.id+'/size', function(size) {

				if(size) {
			        $('#diskSpace #usedBar').css('width', size.percent);
			        $('#diskSpace .used').text(size.pretty);
			        $('#diskSpace .left').text(' / ' + size.left)
				} else
					console.error('No size');		    
			});

		},
		fetchRemove: function(cb) {
			jQuery.getJSON( '/api/'+user.id+'/files/to_remove', function(to_remove) {
				console.log('To remove', to_remove);

				return typeof cb == 'funtion' ? cb(null, data) : true;

				//Desktop.remove(to_remove);
			});
		},
		setInterval: function() {
			var self = this;
			
			console.log(config);

			self.interval = setInterval(function() {
				self.fetchRemove(function() {
					self.files();
				});
				
			}, config.fetchTime)
		},
		init: function(Desktop) {
			var self = this;

			this.desktop = Desktop;
			this.size();
			this.files(function() {
				self.setInterval();
			});

		}
	};

	return api;
});

