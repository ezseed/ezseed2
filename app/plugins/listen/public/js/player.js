function DGPlayer(root) {
    
    // Get elements
    var events = {},
        state = 'paused';
    
    // Preload images
    // new Image().src = "/dgplayer/resources/playbutton_active.png";
    // new Image().src = "/dgplayer/resources/pausebutton.png";
    // new Image().src = "/dgplayer/resources/pausebutton_active.png";
    // new Image().src = "/dgplayer/resources/choosefile_pressed.png";
    
    // Prevent text selection in IE
    root.onselectstart = function() {
        return false
    }
    
    var seekBar = (function() {
        
        var loading = root.querySelector(".seek .track .loaded"),
            progress = root.querySelector(".seek .track .progress"),
            played = root.querySelector(".seek span:first-child"),
            remaining = root.querySelector(".seek span:last-child"),
            maxWidth = loading.parentNode.offsetWidth - 2,
            loaded = 0, currentTime = 0, trackLength = 0, oldSeconds = 0;
            
            
        function pad(input) {
            return ("00" + input).slice(-2);
        }
        
        return {
            getTrackLength: function() {
                return trackLength;
            },

            setTrackLength: function(time) {
                trackLength = time;
                this.seekTime = currentTime;
            },

            getCurrentTime: function() {
                return currentTime;
            },

            setCurrentTime: function(time) {
                oldSeconds = Math.floor(currentTime / 1000 % 60);;
                currentTime = time;
                
                if (currentTime >= trackLength && trackLength > 0) {
                    emit("pause");
                    emit("trackends");
                }

                var t = currentTime / 1000,
                    seconds = Math.floor(t % 60),
                    minutes = Math.floor((t /= 60) % 60);
                    
                if (seconds === oldSeconds)
                    return;
                
                played.innerHTML = minutes + ':' + pad(seconds);
                
                // only show the progress bar and remaining time if we know the duration
                if (trackLength > 0) {
                    var r = (trackLength - currentTime) / 1000,
                        remainingSeconds = Math.floor(r % 60),
                        remainingMinutes = Math.floor((r /= 60) % 60);
                    
                    remaining.innerHTML = '-' + remainingMinutes + ':' + pad(remainingSeconds);
                    position = Math.max(0, Math.min(1, currentTime / trackLength));
                    progress.style.width = maxWidth * position + 'px';
                } else {
                    remaining.innerHTML = '-0:00';
                }
            },
            
            getAmountLoaded: function() {
                return loaded;
            },
            
            setAmountLoaded: function(val) {
                loaded = Math.max(0, Math.min(100, val));
                loading.style.width = maxWidth * (loaded / 100) + 'px';
            }
        }
        
    })();
        
    var playpause = (function() {
        
        var button = root.querySelector(".button"),
            icon = button.querySelector("i"),
            interval = null, playing = false;
            
        button.onclick = function() {
            emit(playing ? "pause" : "play");
        };

        root.addEventListener('keyup', function(e) {
            e.which === 32 && emit(playing ? "pause" : "play");
        });
        
        function setPlaying(play) {
            if (playing = play) {
                icon.classList.remove("entypo-play");
                icon.classList.add("entypo-pause");
            } else {
                icon.classList.remove("entypo-pause");
                icon.classList.add("entypo-play");
            }
        }
        
        return {
            setPlaying: setPlaying,
            getPlaying: function() {
                return playing;
            }
        }
        
    })();
    
    var slider = (function() {
        
       var handle = root.querySelector(".volume .handle"),
        progress = root.querySelector(".volume .progress"),
        track = root.querySelector(".volume .track")
        volumeLeft = root.querySelector(".volume img:last-child"),
        volumeRight = root.querySelector(".volume img:first-child");
            
        var lastX = 0, 
            down = false,
            width = 70,
            handleSize = 20,
            min = 0,
            max = width - handleSize / 2 - 3,
            curX = Math.floor(width / 2 - handleSize / 2),
            value = 50;
            
        function update(dontEmit) {
            if ('webkitTransform' in handle.style)
                handle.style.webkitTransform = "translate3d(" + curX + "px,0, 0)";
            else
                handle.style.left = curX + "px";

           progress.style.width = curX + "px";
           
            value = Math.round( (curX - min) / (max - min) * 100);

            if (!dontEmit)
                emit("volume", value);
        }
        update();
        
        handle.onmousedown = handle.ontouchstart = function(e) {
            lastX = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
            down = true;
            e.stopPropagation();
            handle.classList.add("active");
            e.preventDefault();
        }
        
        function onMove(e) {
            var eventX = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
            var x = Math.max(min, Math.min(max, curX + eventX - lastX));

            if (!down || x === curX) return;

            curX = x;
            lastX = eventX;
            update();
        }
        
        function onUp(e) {
            if(!down) return;
            down = false;
            handle.classList.remove("active");
        }
        
        document.addEventListener("mousemove", onMove, false);
        document.addEventListener("touchmove", onMove, false);
        document.addEventListener("mouseup", onUp, false);
        document.addEventListener("touchend", onUp, false);
        
        function animate() {
            handle.classList.add("animatable");
            progress.classList.add("animatable");

            update();

            setTimeout(function() {
                handle.classList.remove("animatable");
                progress.classList.remove("animatable");
            }, 250);
        }
        
        volumeLeft.onclick = function() {
            curX = max;
            animate();
        }

        volumeRight.onclick = function() {
            curX = min;
            animate();
        }
        
        // Handle clicking on the track
        track.onmousedown = track.ontouchstart = function(e) {
            var x = e.targetTouches ? e.targetTouches[0].pageX : e.clientX;
            
            // Get the absolute offsetTop of the track
            var offset = 0, obj = track;
            while (obj) {
                offset += obj.offsetLeft;
                obj = obj.offsetParent;
            }
            console.log('offset', offset);
            curX = Math.max(min, Math.min(max, x - offset - (handleSize + min)));

            handle.onmousedown(e);
            update();
        }
        
        return {
            getValue: function() {
                return value;
            },
            
            setValue: function(val) {
                val = Math.max(0, Math.min(100, val));
                curY = max - (val / 100) * (max - min);
                update(true);
            }
        }
        
    })();
    
    
    function emit(event) {
        if (!events[event]) return;
        
        var args = Array.prototype.slice.call(arguments, 1),
            callbacks = events[event];
            
        for (var i = 0, len = callbacks.length; i < len; i++) {
            callbacks[i].apply(null, args);
        }
    } 
    
    var API = {
        on: function(event, fn) {
            events[event] || (events[event] = []);
            events[event].push(fn);
        },
        
        off: function(event, fn) {
            var eventsOf = events[event],
                index = eventsOf.indexOf(fn);
                
            ~index && eventsOf.splice(index, 1);
        }
    };
    
    // Object.defineProperty shim for Opera
    Object.defineProperty || (Object.defineProperty = function(obj, prop, config) {
        if (config.get && obj.__defineGetter__)
            obj.__defineGetter__(prop, config.get);
            
        if (config.set && obj.__defineSetter__)
            obj.__defineSetter__(prop, config.set);
    })
    
    Object.defineProperty(API, "bufferProgress", {
        get: seekBar.getAmountLoaded,
        set: seekBar.setAmountLoaded
    });
    
    Object.defineProperty(API, "state", {
        set: function(newstate) {
            playpause.setPlaying(newstate == 'playing' || newstate == 'buffering');                
            state = newstate;
        },
        
        get: function() { 
            return state;
        }
    });
    
    Object.defineProperty(API, "duration", {
        get: seekBar.getTrackLength,
        set: seekBar.setTrackLength
    });
    
    Object.defineProperty(API, "seekTime", {
        get: seekBar.getCurrentTime,
        set: seekBar.setCurrentTime
    });
    
    Object.defineProperty(API, "volume", {
        get: slider.getValue,
        set: slider.setValue
    });
    
    var img = root.querySelector(".avatar img");
    Object.defineProperty(API, "coverArt", {
        get: function() {
            return img.src;
        },
        
        set: function(src) {
            img.src = src;
        }
    });
    
    var title = root.querySelector("span.title"),
        artist = root.querySelector("span.artist");
        
    Object.defineProperty(API, "songTitle", {
        get: function() {
            return title.innerHTML;
        },
        
        set: function(val) {
            title.innerHTML = val;
        }
    });
    
    Object.defineProperty(API, "songArtist", {
        get: function() {
            return artist.innerHTML;
        },
        
        set: function(val) {
            artist.innerHTML = val;
        }
    });
    
    /**
     * Playlist
     */
    
    var songs = [] //stores the songs array
      , current //stores the current song
      , track //stores the active track number
      , playlistLoaded = false
      , $playlist = root.querySelector("#playlist")
      //On Song click
      , onSongClick = function(evt) {

            evt.preventDefault();    

            var no = evt.target.parentElement.dataset.no;

            var active = $playlist.querySelector("li.active");

            if(active)
                active.classList.remove("active");

            evt.target.parentElement.classList.add("active");

            API.current = no;

            emit("playlist");

        }
      //Change current active class to current track
      , setActivePlaylist = function() {
            var active = $playlist.querySelector("li.active");

            if(active)
                active.classList.remove("active");

            if(songs.length)
                $playlist.querySelector("li[data-no='"+track+"']").classList.add('active');
        }

    var playlist = function() {
        var prev = root.querySelector(".button-prev")
        , next = root.querySelector(".button-next")
        , showlist = root.querySelector(".button-playlist")
        , playlistTemplate = 
                     "<ol>"
                   + "<% for(var i in songs) {"
                   + "  var song = songs[i];"
                   + "%>"
                   + "<li data-no='<%= i %>'><a href=''><%= song.name %></a></li>"
                   + "<% } %>"
                   + "</ol>"
        ;

        /**
         * loadElements - load playlist items, templating
         */
        var loadElements = function() {

            var listElements = $playlist.querySelectorAll("li");

            for (var i = 0; i < listElements.length; i++)
                listElements[i].onclick = onSongClick;

            playlistLoaded = true;
          
        };

        //Set active on play
        API.on('play', setActivePlaylist);

        //Set next on ends
        API.on('trackends', function() {
            var previous = API.current;

            API.current = track + 1 < songs.length ? track + 1 : track;
            
            if(API.current == previous)
                emit("pause");
            else {
                setActivePlaylist();
                emit("playlist");
            }
        });

        prev.onclick = function(evt) {
            API.current = track - 1 >= 0 ? track - 1 : track;
            setActivePlaylist();
            emit("playlist");
        }

        next.onclick = function(evt) {
            API.current = track + 1 < songs.length ? track + 1 : track;
            setActivePlaylist();
            emit("playlist");
        }

        showlist.onclick = function(evt) {
            this.classList.toggle('active');
            $playlist.classList.toggle('show');
        }

        return {
            getValue: function() {
                return songs;
            },
            setValue: function(datas) {
                var albumEnd = songs.length;
                
                songs = _.union(songs, datas);

                $playlist.innerHTML = _.template(playlistTemplate, {songs : songs});

                loadElements();

                console.log(songs.length, albumEnd);

                if(albumEnd !== 0 && songs.length > albumEnd) {
                    track = albumEnd;
                    current = songs[track];
                    emit("playlist");
                } else if(albumEnd == songs.length) {
                    //Hmm, playlist is firing twice, can't trace it ...
                } else {
                    track = 0;
                    current = songs[track];
                }
                setActivePlaylist();

            }
        }

    }();

    Object.defineProperty(API, "playlist", {
        get: playlist.getValue,
        set: playlist.setValue
    });

    var playlistAlbum = {artist : null, album : null, picture : null};

    Object.defineProperty(API, "album", {
        get : function() {
            return album;
        },
        set : function(album) {
            album = _.extend(playlistAlbum,album);

            playlistAlbum = album;

            if(album.artist && album.album)
                API.songArtist = album.artist + " - " + album.album;
            else if(album.artist && !album.album)
                API.songArtist = album.artist;
            else
                API.songArtist = album.album;

            if(album.picture)
                API.coverArt = album.picture;

            if(album.songs)
                API.playlist = album.songs;
        }
    });

    Object.defineProperty(API, "current", {
        get: function() {
            return current;
        },
        set: function(no) {
            track = no;
            current = songs[no];
        }
    });


    Object.defineProperty(API, "addSong", {
        get: function() {
            return false;
        },
        set: function(song) {            
            songs.push(song);

            var i = songs.length - 1, songTemplate = "<li data-no='<%= i %>'><a href=''><%= song.name %></a></li>";

            //Dummy element
            var dummy = document.createElement('div');
            dummy.innerHTML = _.template(songTemplate, {i : i, song : song});
            dummy = dummy.firstChild;

            dummy.onclick = onSongClick;

            $playlist.querySelector("ol").appendChild(dummy);

            delete dummy;
        }
    });

    Object.defineProperty(API, "removeSong", {
        get: function() {
            return false;
        },
        set: function(i) {
            if(songs[i]) {

                if(current == songs[i])
                    emit("pause"); //stop

                songs.splice(i, 1);

                var songElement = $playlist.querySelector("li[data-no='"+i+"']");

                songElement.removeEventListener('click', onSongClick);

                $playlist.querySelector("ol").removeChild(songElement);

                //reset data-no
                var elements = $playlist.querySelectorAll("ol > li");

                for(var j in elements)
                    if(elements[j].dataset)
                        elements[j].dataset.no = j;
                
                
            } else
                console.error("Song doesn't exist");
        }
    });
    
    return API;
    
}