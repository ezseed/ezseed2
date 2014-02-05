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
			var self = this;

			jQuery.getJSON( '/api/'+user.id+'/files/to_remove', function(to_remove) {

				self.desktop.remove(to_remove);

				return typeof cb == 'function' ? cb(null, to_remove) : true;

				//Desktop.remove(to_remove);
			});
		},
		setInterval: function() {
			var self = this;
			
			self.interval = setInterval(function() {
				clearInterval(self.interval);

				self.fetchRemove(function(err, to_remove) {
					self.files(function() {
						self.setInterval();
					});
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

