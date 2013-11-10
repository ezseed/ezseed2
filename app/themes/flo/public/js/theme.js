define([
    'jquery', 'desktop'
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
        
    });

    $('body').on('click', '.allow-notify', function() {
        notify.requestPermission(function() {
            $('#alert').empty();
        });
    });


    var toTop = function(veryTop) {
        var veryTop = veryTop === undefined ? false : veryTop;

        if ( $('body').scrollTop() > $('header').height() + 7) {

            if(veryTop !== true)
                $('body, html').animate({'scrollTop':$('header').height() + 10});
            else
                $('body, html').animate({'scrollTop':0});
        }
    }



    $('#toTop').on('click', function(e) {
        toTop(true);
    });

    $('body').on('click', '.showFiles', function() {
        
        var $files = $(this).closest('.panel').find('.panel-collapse');
        var $element = $(this).closest('.element');

        if($element.data('margin-bottom') === undefined)
            $element.data('margin-bottom', $element.css('margin-bottom'));

        if($files.hasClass('in')) {

            //Playing with margins + layout before collapse
            $element.css('margin-bottom', '-=' + $files.find('.panel-body').height());
            Desktop.layout();

            //Because of collapse
            setTimeout(function() {
                $element.css('margin-bottom', $element.data('margin-bottom'))
            }, 350);

        } else {
            $element.css('margin-bottom', '+=' + $files.find('.panel-body').height());
            Desktop.layout();

            setTimeout(function() {
                $element.css('margin-bottom', $element.data('margin-bottom'))
            }, 350);
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

    var socket = Desktop.socket;

    socket.on('size', function(size) {
        
        var mb = size.size / 1024 / 1024;

        $('#diskSpace #usedBar').css('width',  mb / config.diskSpace * 100 + '%');
        $('#diskSpace .used').text(size.pretty);
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

});