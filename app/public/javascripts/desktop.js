define([
    'packery/packery',
    'imagesloaded',
    'async',
    'jquery',
    'underscore', 'notify', 'ejs', 'cookie', 'quickfit',

], function(Packery, imagesLoaded, async, $){

    //Expression to search case insensitive
    $.expr[":"].contains = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().toLowerCase().indexOf(arg.toLowerCase()) >= 0;
        };
    });

    /* Render function */
    var View = $.Ejs({path : 'views/'});

    var Desktop = {
        firstLoad : true,
        $container : $('section#desktop'), //Elements container
        itemSelector : '.element',
        displaySelector : null,
        //Packery Instance
        pckry : null,
        hasLayout : false,
        //Socket
        socket : null,
        loader : function() {
            var $loader = $('#loader');
            
            if($loader.is(':visible'))
                $loader.fadeOut();
            else 
                $loader.fadeIn();
        },
        showNotification : function(params) {
            notify.createNotification(params.title, {body : params.text, icon: '/images/planetetrans.png', tag:params.tag, timeout:2500});
        },
        init : function() {
            var self = this;

            if(self.pckry === null && isDesktop == true) {
                self.pckry = new Packery( 
                    document.querySelector('section#desktop'),
                    {
                        itemSelector: '.element',
                        transitionDuration: "0"
                        // columnWidth: $('.grid-sizer').width(),
                    }
                );
            }

            if(self.socket === null)
                self.socket = io.connect('wss://'+document.domain+':3001');

            self.socket.emit('update', user.id);

            return self;
        },
        //Rendering methods
        render : {
            files : function(paths, callback) {
                var render = this;

                async.map(paths, render.path, function(err, results){

                    //Merging results
                    var i = results.length - 1, html = "";

                    do {
                        html += results[i].movies + results[i].albums + results[i].others;
                    } while(i--)

                    callback(err, html);
                });
                
            }, 
            path : function(path, cb) {
                var render = Desktop.render;

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
        },
        remove: function(id) {
            var self = this
              , $el = $(self.itemSelector + '[data-id="' + id + '"]');

            var titre = $el.find('h1').text();
            self.showNotification({title: 'Fichier supprimé',tag:id,text: titre + ' a été supprimé'});

            self.pckry.remove($el);

            $el.remove();

        },
        append : function(datas) {

            var self = this;

            var displayOption = $.cookie('display') === undefined ? '.list' : $.cookie('display');

            $('#displayFilters li').each(function(i, e) { 
                $(e).attr('data-display', displayOption); 
            });
            
            self.render.files(datas, function(err, html) {
                var $items = $.parseHTML(html);

                self.$container.css('visibility', 'hidden').append($items);

                self.pckry.appended($items);   

                self.displaySelector = displayOption;

                self.layout(displayOption, function() { 

                    if(self.firstLoad) {
                        self.firstLoad = false;
                        self.loader();
                    } else {
                        var count = $items.find(self.itemSelector+'.list').length();

                        if(count == 1) {
                            var titre = $items.find(self.itemSelector+'.list:first h1').text();
                            self.showNotification({title: 'Fichier ajouté',text: titre + ' ajouté !'});
                        } else {
                            self.showNotification({title: 'Fichiers ajoutés',text: count + ' fichiers ajoutés'});
                        }
                    }

                    self.$container.css('visibility', 'visible');

                });
            });
        },
        layout : function(selector, cb) {
            var self = this;

            selector = selector ? selector : self.displaySelector;

            self.displaySelector = selector;

            imagesLoaded(
                document.querySelector('#' + self.$container.attr('id')), 
            function() {

                if(!self.firstLoad)
                    self.loader();

                $(self.itemSelector).css('display', 'none');

                $(self.itemSelector + selector).each(function() {
                    $(this).css('display', 'block');
                });

                $(self.itemSelector + '.miniature h1').quickfit();

                self.pckry.layout();
                
                if(!self.firstLoad)
                    self.loader();

                if(typeof cb == 'function')
                    cb();
               
            });
        }


    };//Desktop ends

    return Desktop.init();

});