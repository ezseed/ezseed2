define([
    'jquery', 'desktop'
], function($, Desktop){
    // Chrome doesn't support changing the sample rate, and uses whatever the hardware supports.
    // We cheat here.  Instead of resampling on the fly, we're currently just loading two different
    // files based on common hardware sample rates.
    var _sampleRate = (function() {
        var AudioContext = (window.AudioContext || window.webkitAudioContext);
        if (!AudioContext)
            return 44100;
        
        return new AudioContext().sampleRate;
    }());

    DGPlayer = DGPlayer(document.getElementById('dgplayer')); 

    // (function(DGPlayer) {
        

    //     // var add = document.querySelector('.add-song'), remove = document.querySelector('.remove-song');

    //     // add.onclick = function() {
    //     //     DGPlayer.addSong =  {
    //     //         "name":"Jeux de vagues",
    //     //         "url":"medias/BIS1447-002-mp3_320.mp3",
    //     //         "picture" : "medias/debussy.jpg"
    //     //     };
    //     // }

    //     // remove.onclick = function() {
    //     //     DGPlayer.removeSong = 2; //dummy example ofc
    //     // }

    DGPlayer.album = {};
        
    DGPlayer.volume = 100;
    
    var player, onplay;
    
    DGPlayer.on('play', onplay = function(){
        if (player)
            player.disconnect();
            
        player = new DGAuroraPlayer(AV.Player.fromURL(DGPlayer.current.url), DGPlayer);
        DGPlayer.off('play', onplay);
    });


    DGPlayer.on('playlist', onplaylist = function() {
        if(player) {
            player.disconnect();

            DGPlayer.state = 'paused';
        }

        player = new DGAuroraPlayer(AV.Player.fromURL(DGPlayer.current.url), DGPlayer);

    });


    // })(DGPlayer(document.getElementById('dgplayer')));

    $(Desktop.$container).on('click', '.listen', function(event) {
        event.preventDefault();

        var el = $(this).closest(Desktop.itemSelector);

        $.get('/plugins/listen/'+el.attr('data-id'), function(data) {
            DGPlayer.album = data.album;

            if($('#dgplayer').is(':hidden')) 
                $('#dgplayer').fadeIn().find('.button').click();
        }, 'json');
    });

});