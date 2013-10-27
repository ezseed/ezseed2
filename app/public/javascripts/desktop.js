jQuery(function($) {

    function loader() {
        var $loader = $('#loader');
    
        if($loader.is(':visible'))
            $loader.fadeOut();
        else 
            $loader.fadeIn();
    }

    function showNotification(params) {
        notify.createNotification(params.title, {body : params.text, icon: '/images/planetetrans.png', tag:params.tag, timeout:2500});
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }


    $(window).load(function() {
        loader();

        var allowed = notify.permissionLevel();

        switch(allowed) {
            case notify.PERMISSION_DEFAULT:
                $('#alert').append('<p class="warning"><i class="entypo-warning"></i> <a href="#" class="allow-notify">Cliquez ici pour activer les notifications de bureau.</a></p>');
            break;
            // case notify.PERMISSION_GRANTED:

            // break;
            case notify.PERMISSION_DENIED:
            //kaput

            break;
        }

    });

    function toTop(veryTop) {
        var veryTop = veryTop === undefined ? false : veryTop;

        if ( $('body').scrollTop() > $('header').height() + 7) {

            if(veryTop !== true)
                $('body, html').animate({'scrollTop':$('header').height() + 10});
            else
                $('body, html').animate({'scrollTop':0});
        }
    }


    function onTopScroll(onTop) {
        var onTop = onTop === undefined ? true : onTop;

        if(onTop) 
        {
            if(!$('nav#display').hasClass('fixed')) {
                $('nav#display').addClass('fixed').css('opacity', '0.7');
                $section.css('marginTop', '80px');
                $('#toTop').animate({'opacity':'0.8'});
            }
        } else 
        {
            $('nav#display').removeClass('fixed').css('opacity', '1');   
            $section.css('marginTop', '20px');
            $('#toTop').animate({'opacity':'0'});
        }

    }

    $(window).on('scroll', function() {
        if ( $('body').scrollTop() > $('header').height() + 7 )
            onTopScroll();
        else
            onTopScroll(false);
        
    });

    $('#toTop').on('click', function(e) {
        toTop(true);
    });

     $('body').on('click', '.allow-notify', function() {
        notify.requestPermission(function() {
            $('#alert').empty();
        });
    });

    $('body').on('click', '.showFiles', function() {
        $button = $(this);
        
        if($button.data('text') === undefined)
            $button.data('text', $button.text());

        $files = $(this).next('.files');
        $element = $(this).parent();

        if($files.is(':hidden')) {
            $button.html('<i class="entypo-attach"></i>Cacher');

            var margin = $files.height() + 20;
            $element.css({'margin-bottom':'+'+margin+'px'});

            $files.css({'top': $element.height() + 20 + 'px'}).delay(100).fadeIn();
            $section.isotope('reLayout');

        } else {
            $button.html('<i class="entypo-attach"></i>'+$button.data('text'));
            $files.hide();
            $element.css({'margin-bottom':'20px'});
            $section.isotope('reLayout');
        }
    });

    $('body').on({
        mouseenter : function() {
            $(this).css('opacity', '1');
        },
        mouseleave : function() {
            $(this).css('opacity', '0.7');
        }
    },'nav#display.fixed');

    $('#search input').on('keyup', function(e) {
        toTop();

        var filter = '', display = $('#displayFilters li:first-child').attr('data-display');

        if($('#displayFilters li.active').length)
            filter = $('#displayFilters li.active').attr('data-filter');

        if($(this).val().length > 2) {
            var matches = $section.find('.element:contains("'+$(this).val()+'")');
            
            matches.each(function(i, e) {
                if(!$(e).hasClass('highlight')) {
                    var id = $(e).attr('data-id');

                    $section.find('.element[data-id="'+id+'"]').addClass('highlight');
                }
            });

            $section.isotope({filter: display+filter+'.highlight'});

        } else {
            $section.find('.highlight').toggleClass('highlight');
            $section.isotope({filter: display+filter});
        }
    });

    $('body').on('click', '#displayFilters li', function(){

        toTop();

        if(!$(this).hasClass('active')) { 
            var selector = $(this).attr('data-filter');
            var display = $(this).attr('data-display');

            $('#displayFilters li.active').removeClass('active');

            $(this).addClass('active');

            $section.isotope({ filter: display + selector });
        
        } else {
            $(this).removeClass('active');

            $section.isotope({ filter: $(this).attr('data-display') });
        }    
        return false;
    });

    $('body').on('click', '#displayOptions i', function() {
        var selector = $(this).attr('data-filter'), display="";


        if(!$(this).hasClass('active')) {

            $(this).parent().find('.active').removeClass('active');

            $(this).addClass('active');

            $.cookie('display', selector);

            toTop();

            if($('#displayFilters li.active').length)
                display = $('#displayFilters li.active').attr('data-filter');

            $section.isotope({ 
                filter: selector + display
            });

            if(selector == '.miniature') {
                $section.css('opacity','0');
                loader();

                $section.isotope({
                    layoutMode: "packer"
                });            

                setTimeout(function() {
                    $section.isotope('reLayout');
                    loader();
                    $section.css('opacity','1');

                }, 750);


            } else {
                $section.isotope({ layoutMode: "masonry", sortBy : 'time'});
            }

            $('#displayFilters li').each(function() {
                $(this).attr('data-display', selector);
            });
        }

        return false;
    });

    //Archive through ajax
    $section.on('click', '.archive', function(e) {
        e.preventDefault();

        var $el = $(this).closest('.element'),
        id = $el.attr('data-id'),
        titre = $el.find('h1').text(),
        $archiving = $('#archiving');
        
        socket.emit('archive', id);

        $archiving.find('.name').text(titre);

        $archiving.show();

        $(window).bind('beforeunload', function() {
            return 'Une compression est en cours';
        });

        $.get($(this).attr('href'), function(res) {
            if(res.error == null) {
                window.location.href = '/download/archive/'+id;
            }

            $archiving.find('.percent').text('Téléchargement en cours...');
            $archiving.find('.progress').css('width', '100%');

            //todo show err
            setTimeout(function() {
                $(window).unbind('beforeunload');
                $archiving.fadeOut('800');
                $archiving.find('.percent').delay('800').text('0%');
            }, 3000);

        }, 'json');
    });


    /* Render function */
    var View = $.Ejs();

    var render = {
        files : function(paths, callback) {

            async.map(paths, render.path, function(err, results){

                //console.log('Results', results);
                //Merging results
                var i = results.length - 1, html = "";

                do {
                    html += results[i].movies + results[i].albums + results[i].others;
                } while(i--)

                callback(err, html);
            });
            
        }, 
        path : function(path, cb) {
            
            async.parallel({
                movies : function(callback) 
                {
                    if(path.movies.length) {
                        render.movies(path.movies,function(err, html) {
                            callback(err, html);
                        });
                    } else
                        callback(null, '');
                },
                albums : function(callback) 
                {
                    if(path.albums.length) {
                        render.albums(path.albums,function(err, html) {
                            callback(err, html);
                        });
                    } else
                        callback(null, '');

                },
                others : function(callback) 
                {
                    if(path.others.length) {
                        render.others(path.others,function(err, html) {
                            callback(err, html);
                        });
                    } else 
                        callback(null, '');

                }
            },
            //Callback Paths
            function(err, results){
                cb(err, results);
            });
        },
        movies : function(movies, cb) {
            View.render('movies', { movies : movies }, function(err, html) {
                cb(err, html);
            });
        },
        albums : function(albums, cb) {
            View.render('albums', { albums : albums }, function(err, html) {
                cb(err, html);
            });
        },
        others : function(others, cb) {
            View.render('others', { others : others }, function(err, html) {
                cb(err, html);
            });
        }
    }      

    /*Sockets Client size*/

    var socket = io.connect('wss://'+document.domain+':3001');

    //var reload = setInterval(socket.emit('reload', user), 10000);

    socket.emit('update', user.id);

    socket.on('size', function(size) {
        
        var mb = size.size / 1024 / 1024;

        $('#diskSpace #usedBar').css('width',  mb / config.diskSpace * 100 + '%');
        $('#diskSpace .used').text(size.pretty);
    });


    socket.on('files', function(d) {

        d = JSON.parse(d);
        
        var firstLoad = false;

        if($section.find('.element').length == 0) {
            firstLoad = true;

            var displayOption = $.cookie('display') === undefined ? '.list' : $.cookie('display');

            $('#displayFilters li').each(function(i, e) { 
                $(e).attr('data-display', displayOption); 
            });

            $section.isotope({
                containerStyle: { overflow: 'visible', position: 'relative'},
                itemSelector : '.element', filter:displayOption,
                getSortData : {
                    time : function ( $elem ) {
                      return parseInt($elem.attr('data-date-added'));
                    }
                },
                packer: {
                    'realWidth': '80%'
                    ,'nbColumns': 12
                    ,'nbMaxCols': 4
                    ,'nbMaxRows': 5
                    ,'picturesClass': '.miniature'
                },
                transformsEnabled: true,
                sortAscending : false
            });

            if(displayOption == '.miniature') {
                $section.isotope({'layoutMode': 'packer'});
            }

            $section.css({'opacity':'0'});

        } else {
            loader();
            
            showNotification({title: 'Fichier ajouté',text: d.count + ' fichier(s) ajouté(s)'});
        }

        console.log('Receiving files', d.paths);

        render.files(d.paths, function(err, html) {
            var $items = $(html);
            
            $section.isotope( 'insert', $items, function() {
                $section.isotope('reLayout');

                loader();

                if(firstLoad)
                    $section.animate({'opacity':'1'}, '450');

            });
        });

    });

    socket.on('remove', function(id) {

        if($('.element.list[data-id='+id+']').length) {
            var titre = $('.element.list[data-id='+id+']').find('h1').text();
            showNotification({title: 'Fichier supprimé',tag:id,text: titre + ' a été supprimé'});
        }

        $section.isotope( 'remove', $('[data-id='+id+']'), function() {

        });
    });

    var waitForDownloadTimeout;

    socket.on('compressing', function(data) {
        
        // data.done
        var $el = $('.element.list[data-id='+data.id +']'),
        $archiving =  $('#archiving'),
        size = $el.find('a.archive').attr('data-full-size');

        var percentDone = (parseInt(data.done) / parseInt(size)) * 100; 

        percentDone = Math.round(percentDone * 100) / 100;

        percentDone = (percentDone < 100) ? percentDone : 100;

        if(percentDone == 100 && waitForDownloadTimeout == undefined)
            waitForDownloadTimeout = setTimeout(
                $archiving.find('.progress').text('En attente...')
            , 750);

        $archiving.find('.percent').text(percentDone+ '%');
        $archiving.find('.progress').css('width', percentDone+ '%');
    });
});
