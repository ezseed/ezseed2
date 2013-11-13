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

    //Expression to search for first letter
    $.expr[':'].startsWith = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            return $(elem).text().replace(/\s+/g, '').charAt(0).toUpperCase() == arg.toUpperCase();
        };
    });

    $.expr[':'].match = $.expr.createPseudo(function(arg) {
        return function( elem ) {
            var c = $(elem).text().replace(/\s+/g, '').charAt(0);
            return c.match( new RegExp( arg ) );
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
        toRemove : null,
        //Socket
        socket : null,
        hasLayout : function() {},
        alphabet : {'A':0,'B':0,'C':0,'D':0,'E':0,'F':0,'G':0,'H':0,'I':0,'J':0,'K':0,'L':0,'M':0,'N':0,'O':0,'P':0,'Q':0,'R':0,'S':0,'T':0,'U':0,'V':0,'W':0,'X':0,'Y':0,'Z':0,'#':0},
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
                self.socket = io.connect('wss://localhost');

            self.socket.emit('update', user.id);

            //hash
            self.toRemove = window.location.hash.substr(1);

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

            var titre = $el.find('h1:first').text();
            self.showNotification({title: 'Fichier supprimé',tag:id,text: titre + ' a été supprimé'});

            self.pckry.remove($el);

            self.layout();

        },
        append : function(datas) {

            var self = this;

            var displayOption = $.cookie('display') === undefined ? '.list' : $.cookie('display');

            $('#displayFilters li').each(function(i, e) { 
                $(e).attr('data-display', displayOption); 
            });
            
            self.render.files(datas, function(err, html) {
                var $items = $.parseHTML(html);

                self.$container.addClass('notransition').css('visibility', 'hidden').append($items);

                self.pckry.appended($items);

                self.displaySelector = displayOption;

                self.layout(displayOption, function() { 

                    if(self.firstLoad) {
                        self.firstLoad = false;

                        if(self.toRemove) {
                            self.remove(self.toRemove);
                            self.toRemove = null;
                            location.hash = '#';
                        }

                        self.loader();
                    } else {
                        var count = 0, els = [];

                        _.each($items, function(e) {
                            var isTxt = e instanceof Text;

                            if(!isTxt) {
                                if($(e).hasClass('list'))
                                    els.push($(e));

                                count++;
                            }
                        });

                        count = count / 3;

                        if(count == 1) {
                            var titre = els[0].find('h1').text();
                            self.showNotification({title: 'Fichier ajouté',text: titre + ' ajouté !'});
                        } else {
                            self.showNotification({title: 'Fichiers ajoutés',text: count + ' fichiers ajoutés'});
                        }
                    }

                    self.$container.removeClass('notransition').css('visibility', 'visible');

                });
            });
        },
        countElementsByLetter : function() {
            var self = this, $els = self.$container.find(self.itemSelector + '.list');

            $els.each(function(i, e) {
                var firstLetter = $(this).find('h1').text().charAt(0).toUpperCase();

                if(firstLetter.match(/\d/g))
                    firstLetter = '#';

                self.alphabet[firstLetter]++;
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

                self.countElementsByLetter();

                self.hasLayout();
                if(typeof cb == 'function')
                    cb();
               
            });
        }


    };//Desktop ends

    return Desktop.init();

});