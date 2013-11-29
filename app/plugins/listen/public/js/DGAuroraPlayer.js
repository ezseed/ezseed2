UNKNOWN_ART = 'img/avatar.jpeg';

function DGAuroraPlayer(player, DGPlayer) {
    this.player = player;
    this.ui = DGPlayer;
    
    DGPlayer.seekTime = 0;
    DGPlayer.duration = 0;
    DGPlayer.bufferProgress = 0;

    var onplay, onpause, onvolume, onformat, onbuffer, onprogress, onduration, onmetadata;
    
    DGPlayer.on('play', onplay = function() {
        player.play();
        DGPlayer.state = 'playing';
    });
    
    DGPlayer.on('pause', onpause = function() {
        player.pause();
        DGPlayer.state = 'paused';
    });

    DGPlayer.on('volume', onvolume = function(value) {
        player.volume = value;
    });
    
    player.on('buffer', onbuffer = function(percent) {
        DGPlayer.bufferProgress = percent;
    });
    
    player.on('progress', onprogress = function(time) {
        DGPlayer.seekTime = time;
    });
    
    player.on('duration', onduration = function(duration) {
        DGPlayer.duration = duration;
    });
    
    player.on('metadata', onmetadata = function(data) {
        DGPlayer.songTitle = data.title;
        DGPlayer.album = data;
        
        if(DGPlayer.current.picture)
            DGPlayer.coverArt = DGPlayer.current.picture;
        else if (data.coverArt)
            DGPlayer.coverArt = data.coverArt.toBlobURL();
        else 
            DGPlayer.coverArt = UNKNOWN_ART;
        
    });
    
    var originalDescription = DGPlayer.fileDescription;
    player.on('error', onerror = function(e) {
    	console.log(e);

        // reset state
        DGPlayer.state = 'paused';
        DGPlayer.duration = 0;
        DGPlayer.bufferProgress = 0;
        DGPlayer.seekTime = 0;
        DGPlayer.coverArt = UNKNOWN_ART;
        DGPlayer.songTitle = 'Unknown Title';
        DGPlayer.songArtist = 'Unknown Artist';
        
        // DGPlayer.fileDescription = "Hmm. I don't recognize that format. Try another.";
        // setTimeout(function() {
        //     DGPlayer.fileDescription = originalDescription;
        // }, 3000);
    });
    
    player.volume = DGPlayer.volume;
    player.play();
    DGPlayer.state = 'playing';
    
    this.disconnect = function() {
        if (player) player.stop();
        
        DGPlayer.off('play', onplay);
        DGPlayer.off('pause', onpause);
        DGPlayer.off('volume', onvolume);
        player.off('buffer', onbuffer);
        player.off('format', onformat);
        player.off('progress', onprogress);
        player.off('duration', onduration);
        player.off('metadata', onmetadata);
    }
}