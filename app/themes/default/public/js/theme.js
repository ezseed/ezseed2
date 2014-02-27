define([
    'jquery', 'desktop', 'alertify', 'underscore'
], function($, Desktop, alertify){

    $section = Desktop.$container;

    //Some middlewares
    $('.select-on-click').on('click', function(e) { $(this).select(); });

    $('#alert .entypo-cross').on('click', function(e) { $(this).parent().empty(); });

    $(window).load(function() {

        var $msg = $('#alert').find('.msg');

        if($msg.length) {
            if($msg.hasClass('error'))
                alertify.error($msg.text());
            else if($msg.hasClass('success'))
                alertify.success($msg.text());
            else
                alertify.log($msg.text());
        }

    }).on('scroll', function() {
        var scrollTop = $('body').scrollTop() || $('html').scrollTop();
        if ( scrollTop > $('header').height() + 7 )
            onTopScroll();
        else
            onTopScroll(false);
        
    });

    $('body').on('click', '.delete-item', function(e) {
        e.preventDefault();

        var href =  $(this).attr('href');

        alertify.confirm("Attention cette fonction ne supprime pas le torrent, il est conseillé de supprimer torrent et données depuis votre client ! Êtes-vous sûr de vouloir effectuer cette action ?", function (e) {
            if (e) {
                $.get(href, function(d) {
                    Desktop.remove(d.id, false);
                }, 'json');
            } else {
                return false;
            }
        });

    });

    $('body').on('click', '.reset-db', function(e) {
        e.preventDefault();

        var href =  $(this).attr('href');

        alertify.confirm("Cette fonction réindexe la base de données des fichiers ! L'opération peut-être longue ! Êtes-vous sûr de vouloir effectuer cette action ?", function (e) {
            if (e)
                window.location = href;
            else {
                return false;
            }
        });
    });

    $('body').on('click', '.allow-notify', function() {
        notify.requestPermission(function() {
            $('#alert').empty();
        });
    });

    $('body').on('click', '.reset-item', function(e) {
        var $el = $(this).closest('.element'), id = $el.attr('data-id'), type = $(this).attr('data-type');

        $.get('/reset/'+type+'/'+id , function( ) {
            Desktop.remove(id, false);
        }, 'json');
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

            Desktop.layout(function() {
               $element.toggleClass('notransition');
            });

        } else {
            $button.html('<i class="entypo-attach"></i>Cacher');
    
            $element.toggleClass('notransition').css({'margin-bottom':'+'+margin+'px'});

            Desktop.layout(function() {
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

        if($(this).val().length > 2) {
            var matches = $section.find(Desktop.itemSelector + ':contains("'+$(this).val()+'")');
            
            matches.each(function(i, e) {
                if(!$(e).hasClass('highlight')) {
                    var id = $(e).attr('data-id');

                    $section.find(Desktop.itemSelector + '[data-id="'+id+'"]').addClass('highlight');
                }
            });

           Desktop.setDisplay('.highlight').layout();

        } else {
            $section.find('.highlight').toggleClass('highlight');
            Desktop.setDisplay('.highlight', true).layout();
        }
    });


    /** Filter Methods **/

    $('body').on('click', '#displayFilters li', function(){

        toTop();

        var selector = $(this).attr('data-filter');

        if(!$(this).hasClass('active')) { 

            $('#displayFilters li.active').removeClass('active');

            $(this).addClass('active');
            
            Desktop.setDisplay(selector).layout();
        
        } else {
            $(this).removeClass('active');
            Desktop.setDisplay(selector, true).layout();
        }    
        return false;
    });

    $('body').on('click', '#displayOptions i', function() {
        var selector = $(this).attr('data-filter');

        
        if(!$(this).hasClass('active')) {

            $(this).parent().find('.active').removeClass('active');

            $(this).addClass('active');

            toTop();

            Desktop.setDisplay(selector).layout();

        }

        return false;
    });

    /**
     * Extends Desktop
     * Called when packery desktop has Layout
     */
    Desktop = _.extend(Desktop, {
        hasLayout : function() {
            
        }
    });

    var $buttongroup = $('#displayPath');
  
    $buttongroup.on('click', function(e) {

        var target = $(e.target);

        if( target[0].nodeName === 'LI' ) {

            console.log('OK', target);
            if(target.hasClass('active')) {
                target.toggleClass('active');
                Desktop.setDisplay('.path', true).layout();
            } else {
                //removing previous active 
                $('#displayPath li.active').toggleClass('active');
                $(Desktop.itemSelector + '.path').toggleClass('path');

                target.toggleClass('active');
                $(Desktop.itemSelector + '[data-path="'+target.attr('data-path')+'"]').each(function(i, e) {
                    $(e).addClass('path');
                });

                Desktop.setDisplay('.path').layout(function() {
                    $buttongroup.toggleClass('active');
                });
            }
        //If it's the arrow <i>
        } else if( target[0].nodeName === 'I') {
            $buttongroup.toggleClass('active');
        }

        return false;
    });

    //Hate this
    $(document).on('click', function() {
        if($buttongroup.hasClass('active'))
            $buttongroup.removeClass('active');
    });

    var socket = Desktop.socket;

    var archiveComplete = function() {
        setTimeout(function() {
            $('#archiving').fadeOut('800');
            $('#archiving .percent').delay('800').text('0%');
        }, 3000);
    }

    socket.on('archive:error', function(error) {
        $('#archiving .name').text(error);

        archiveComplete();
    });

    socket.on('archive:progress', function(progress) {
        var done = $('#archiving').data('done') ? parseInt($('#archiving').data('done')) : 0;
            done += progress.size;

        $('#archiving').data('done', done);

        var percentDone = (parseInt(done) / parseInt(progress.total)) * 100; 

        percentDone = Math.round(percentDone * 100) / 100;

        percentDone = (percentDone < 100) ? percentDone : 100;

        console.log(done, progress.total, percentDone);

        $('#archiving .name').text(progress.el.length ? progress.el : 'Finition...');
        $('#archiving .percent').text(percentDone+'%');
        $('#archiving .progress').css('width', percentDone+'%');

    });

    socket.on('archive:complete', function(url) {
        $(window).unbind('beforeunload');
        window.location.href = url;
        archiveComplete();
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
    });

});