define([
    'jquery', 'desktop', 'alertify'
], function($, Desktop, Chat){

	if(user) {
		var socket = Desktop.socket;

		socket.emit('ckecker:launch', user);

		socket.on('checker:available', function(current) {
			alertify.error("Ezseed à besoin d'un coup de neuf ! La version " + current + " est sortie !", 0);
		});
	}
});