
define([
    'jquery', 'jplayer', 'playlist', 'aurora', 'flac'
], function($){

	var playlist = [];

	for(var i in album.songs) {
		var file = album.songs[i];
		
		if(file.ext !== 'm3u') { 
			if(file.ext == 'x-flac') {
				playlist.push({
					title: file.name.replace(album.title, ''),
					mp3 : file.fullUrl,
					isFlac : true
				});
			} else {
				playlist.push({
					title: file.name.replace(album.title, ''),
					mp3 : file.fullUrl
				});
			}
		}
	}
	
	// var p = AV.Player.fromURL(album.songs[0].fullUrl);
 // 	p.on('error', function(e) { throw e });
	// console.log(p);
	// p.play();

	console.log(playlist);

	var Playlist = new jPlayerPlaylist({
		jPlayer: "#jquery_jplayer_1",
		cssSelectorAncestor: "#jp_container_1"
	}, playlist, {
		swfPath: "/javascripts/listen",
		supplied: "mp3",
		wmode: "window",
		smoothPlayBar: true,
		keyEnabled: true
	});

	var AVPlayer;

	$('#jquery_jplayer_1').bind($.jPlayer.event.play, function (event) {   
        var current = playlist[Playlist.current];
        console.log(current);

        if(AVPlayer)
        	AVPlayer.stop();

        if(current.isFlac) {
        	AVPlayer = AV.Player.fromURL(current.mp3);
		 	AVPlayer.on('error', function(e) { throw e });
			AVPlayer.play();

			return false;
        }
       
    }).bind($.jPlayer.event.pause, function(event) {

    	if(AVPlayer.playing) {
    		AVPlayer.pause();

    		return false;
    	}

    }).bind($.jPlayer.event.abort, function(e) {
    	console.log('suspend');
    });



	
});

