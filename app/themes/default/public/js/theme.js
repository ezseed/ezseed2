define([
    'jquery', 'desktop', 'underscore'
], function($, Desktop){

    $section = Desktop.$container;

    //Some middlewares
    $('.select-on-click').on('click', function(e) { $(this).select(); });

    $('#alert .entypo-cross').on('click', function(e) { $(this).parent().empty(); });

    $(window).load(function() {

        var allowed = notify.permissionLevel();

        switch(allowed) {
            case notify.PERMISSION_DEFAULT:
                //Ask for notify permissions
                $('#alert').append('<p class="warning"><i class="entypo-warning"></i> <a href="#" class="allow-notify">Cliquez ici pour activer les notifications de bureau.</a></p>');
            break;
            // case notify.PERMISSION_GRANTED:

            // break;
            case notify.PERMISSION_DENIED:
            //kaput

            break;
        }

    }).on('scroll', function() {
        var scrollTop = $('body').scrollTop() || $('html').scrollTop();
        if ( scrollTop > $('header').height() + 7 )
            onTopScroll();
        else
            onTopScroll(false);
        
    });

    $('body').on('click', '.delete-item', function(e) {
        if(!confirm("Attention cette fonction ne supprime pas le torrent, il est conseillé de supprimer torrent et données depuis votre client ! Êtes-vous sûr de vouloir effectuer cette action ?"))
           return false; 
    });

    $('body').on('click', '.reset-db', function(e) {
        if(!confirm("Cette fonction réindexe la base de données des fichiers ! L'opération peut-être longue ! Êtes-vous sûr de vouloir effectuer cette action ?"))
            return false;
    });

    $('body').on('click', '.allow-notify', function() {
        notify.requestPermission(function() {
            $('#alert').empty();
        });
    });


    var toTop = function(veryTop) {
        var veryTop = veryTop === undefined ? false : veryTop;
        var scrollTop = $('body').scrollTop() || $('html').scrollTop();

        if ( scrollTop > $('header').height() + 7) {

            if(veryTop !== true)
                $('body, html').animate({'scrollTop':$('header').height() + 10});
            else
                $('body, html').animate({'scrollTop':0});
        }
    }


    var onTopScroll = function(onTop) {
        var onTop = onTop === undefined ? true : onTop;

        if(onTop) 
        {
            if(!$('nav#display').hasClass('fixed')) {
                $('nav#display').addClass('fixed').css('opacity', '0.7');
                $section.css('marginTop', '80px');
                $('#toTop').stop().animate({'opacity':'0.8'});
            }
        } else 
        {
            $('nav#display').removeClass('fixed').css('opacity', '1');   
            $section.css('marginTop', '20px');
            $('#toTop').stop().animate({'opacity':'0'});
        }

    }

    $('#toTop').on('click', function(e) {
        toTop(true);
    });

      $('body').on('click', '.showFiles', function() {
        $button = $(this);
        
        if($button.data('text') === undefined)
            $button.data('text', $button.text());

        $files = $(this).next('.files');
        $element = $(this).parent();

        var margin = $files.height() + 20;

        if($files.hasClass('open')) {
            
            $button.html('<i class="entypo-attach"></i>'+$button.data('text'));
            
            $element.toggleClass('notransition').css({'margin-bottom':'20px'});

            $files.css({'visibility':'hidden', 'opacity':'0'});

            Desktop.layout(null, function() {
               $element.toggleClass('notransition');
            });

        } else {
            $button.html('<i class="entypo-attach"></i>Cacher');
    
            $element.toggleClass('notransition').css({'margin-bottom':'+'+margin+'px'});

            Desktop.layout(null, function() {
                $files.css({'top': $element.height() + 20 + 'px', 'visibility': 'visible', 'opacity': 1});
                $element.toggleClass('notransition');
            });
           
        }

        $files.toggleClass('open');
    });

    $('body').on({
        mouseenter : function() {
            $(this).css('opacity', '1');
        },
        mouseleave : function() {
            $(this).css('opacity', '0.7');
        }
    },'nav#display.fixed');

   

    /** Search **/

    $('#search input').on('keyup', function(e) {
        toTop();

        var filter = '', display = $('#displayFilters li:first-child').attr('data-display');

        if($('#displayFilters li.active').length)
            filter = $('#displayFilters li.active').attr('data-filter');

        if($(this).val().length > 2) {
            var matches = $section.find(Desktop.itemSelector + ':contains("'+$(this).val()+'")');
            
            matches.each(function(i, e) {
                if(!$(e).hasClass('highlight')) {
                    var id = $(e).attr('data-id');

                    $section.find(Desktop.itemSelector + '[data-id="'+id+'"]').addClass('highlight');
                }
            });

           Desktop.layout(display+filter+'.highlight');

        } else {
            $section.find('.highlight').toggleClass('highlight');
            Desktop.layout(display+filter);
        }
    });


    /** Filter Methods **/

    $('body').on('click', '#displayFilters li', function(){

        toTop();

        if(!$(this).hasClass('active')) { 
            var selector = $(this).attr('data-filter');
            var display = $(this).attr('data-display');

            $('#displayFilters li.active').removeClass('active');

            $(this).addClass('active');
            
            Desktop.layout(display + selector);
        
        } else {
            $(this).removeClass('active');
            Desktop.layout($(this).attr('data-display'));
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

            Desktop.layout(selector);

            $('#displayFilters li').each(function() {
                $(this).attr('data-display', selector);
            });
        }

        return false;
    });

    /**
     * Extends Desktop
     * Called when packery desktop has Layout
     */
    Desktop = _.extend(Desktop, {
        hasLayout : function() {
            var maxPercent = 150, minPercent = 100, min = 0, max = 0;

            _.each(Desktop.alphabet, function(e) {
                max = (e > max ? e : max);
                min = (min > e ? e : min);
            });

            var multiplier = (maxPercent-minPercent)/(max-min);

            $('#alpha-nav li a').each(function(i, e) {
                var letter = $(this).attr('href').substr(1), nb = Desktop.alphabet[letter];

                if(parseInt(nb) !== NaN) {
                    var size = minPercent + ((max-(max-(nb-min)))*multiplier) + '%';

                    $(this).css('font-size',size);
                }
            });
        }
    });

    /**
     * Filters on first letter
     */
    $('#alpha-nav li a').on('click', function(e) {
        e.preventDefault();

        toTop();

        var $letter = $(this)
          , letter = $(this).parent().hasClass('active') ? '' : $letter.attr('href').substr(1);
        
        $section.find('.startsWith').toggleClass('startsWith');

        $(this).closest('ul').find('li.active').removeClass('active');

        var filter = '', display = $('#displayFilters li:first-child').attr('data-display');

        if($('#displayFilters li.active').length)
            filter = $('#displayFilters li.active').attr('data-filter');

        if(letter.length || letter === '#') {

            var matches;

            if(letter == '#')
                matches = $section.find(Desktop.itemSelector + ':match("/\\d/g")');
            else
                matches = $section.find(Desktop.itemSelector + ':startsWith("'+letter+'")');

            if(letter == '#')
                console.log(matches);


            matches.each(function(i, e) {
                if(!$(e).hasClass('startsWith')) {
                    var id = $(e).attr('data-id');

                    $section.find(Desktop.itemSelector + '[data-id="'+id+'"]').addClass('startsWith');
                }
            });

            Desktop.layout(display+filter+'.startsWith', function() {
                $letter.parent().addClass('active');
            });
        } else {
            Desktop.layout(display+filter);
        }
    });

    var socket = Desktop.socket;

    socket.on('size', function(size) {
        $('#diskSpace #usedBar').css('width', size.percent);
        $('#diskSpace .used').text(size.pretty);
        $('#diskSpace .left').text(' / ' + size.left)
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
                $(window).unbind('beforeunload');
                window.location.href = '/download/archive/'+id;
                $archiving.find('.percent').text('Téléchargement en cours...');
                $archiving.find('.progress').css('width', '100%');

                //todo show err
                setTimeout(function() {
                    $archiving.fadeOut('800');
                    $archiving.find('.percent').delay('800').text('0%');
                }, 3000);
            } else {
                $archiving.find('.percent').text(res.error);
                $archiving.find('.progress').css('width', '100%');
                console.log(res.error);
            }

        }, 'json');
    });

});