define([
	'jquery',
    //Helpers
    'underscore', 'cookie', 'quickfit',
], function($){

	var last_update = 0;

	var countData = function(data) {
		var c = 0, l = data.paths.length;

		while(l--)
			c += data.paths[l].movies.length + data.paths[l].albums.length + data.paths[l].others.length;
		
		return c;
	}

	var api = {
		interval: null,
		files: function(cb) {
			var self = this, url = '/api/'+user.id+'/files';

        	if(last_update !== 0) {
        		url = url + '?t=' + last_update;
			}

            jQuery.getJSON( url
                , function( data, textStatus ) {
                    
                    if(data) {

                        if(countData(data)) {
                            self.desktop.append(data.paths);
                            last_update = Date.now();
                        } else {
                        	self.desktop.noFiles();
                            console.log('Aucuns fichiers trouvés');
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
					if(parseInt(size.percent) > 100) {
						$('#diskSpace #usedBar')
							.css('width', '100%')
							.css('background', 'rgba(70, 12, 30, 0.8)');
					} else
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

			});
		},
		setInterval: function() {
			var self = this;
			
			self.interval = setInterval(function() {
				//http://codepen.io/calebnance/pen/bIjid
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

