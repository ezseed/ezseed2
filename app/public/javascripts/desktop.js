define([
    //templates
    'text!/views/albums.ejs',
    'text!/views/movies.ejs',
    'text!/views/others.ejs',

    //Modules
    'packery/packery',
    'imagesloaded',
    'async',
    'jquery',

    //Helpers
    'underscore', 'notify', 'cookie', 'quickfit',


], function(Albums, Movies, Others, Packery, imagesLoaded, async, $){

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
            return c.match( new RegExp( arg, 'ig' ) ); 
        };
    });

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
                self.socket = io.connect('wss://'+document.domain+':3001');

            if(user && isDesktop)
                self.socket.emit('update', user.id);

            //hash
            self.toRemove = window.location.hash.substr(1);

            return self;
        },
        template : function(View, datas) {

            var bytesToSize = function bytesToSize(bytes) {
                var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                if (bytes == 0) return 'n/a';
                var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                if (i == 0) return bytes + ' ' + sizes[i]; 
                return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
            };

            return _.template(View, _.extend(datas, {bytesToSize : bytesToSize}));
        },
        //Rendering methods
        render : {
            files : function(paths, callback) {
                var render = this;

                async.map(paths, render.path, function(err, results){

                    //Merging results
                    var i = results.length - 1, html = "";

                    do {
                        if(results[i])
                            html += results[i].movies + results[i].albums + results[i].others;
                    } while(i--)

                    if(html.length == 0)
                        err = "Aucun fichiers, le chemin est-il surveillé ?";

                    callback(err, html);
                });
                
            }, 
            path : function(path, cb) {
                var render = Desktop.render;

                async.parallel({
                    movies : function(callback) 
                    {
                        if(path.movies.length) {
                            callback(null, Desktop.template(Movies, {movies : path.movies}));
                        } else
                            callback(null, '');
                    },
                    albums : function(callback) 
                    {
                        if(path.albums.length) {
                            callback(null, Desktop.template(Albums, {albums : path.albums}));
                        } else
                            callback(null, '');

                    },
                    others : function(callback) 
                    {
                        if(path.others.length) {
                            callback(null, Desktop.template(Others, {others : path.others}));
                        } else 
                            callback(null, '');

                    }
                },
                //Callback Paths
                function(err, results){
                    cb(err, results);
                });
            }
        },
        remove: function(id, notify) {
            var self = this
              , $el = $(self.itemSelector + '[data-id="' + id + '"]')
              , notify = notify === undefined ? true : notify;

            var titre = $el.find('h1:first').text();

            if(notify)
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
                if(err)
                    console.log(err);

                var $items = $.parseHTML(html), $els = [];

                _.each($items, function(e) {
                    var isTxt = e instanceof Text; //parseHTML causes element duplicated

                    if(!isTxt)
                        $els.push(e);
                    
                });

                $items = $els;
                delete $els;

                $items.sort(function (a, b) {
                    a = $(a), b = $(b); //jquerying -"-
                    if (a.data('date-added') == b.data('date-added')) {
                        return 0;
                    } else if (a.data('date-added') < b.data('date-added')) {
                        return 1;
                    }
                    return -1;
                });

                if(self.firstLoad) {
                    self.$container.addClass('notransition').css('visibility', 'hidden').append($items);

                    self.pckry.appended($items);
                } else {
                    self.$container.addClass('notransition').css('visibility', 'hidden').prepend($items);

                    self.pckry.prepended($items);
                }

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
                                if($(e).hasClass('list'))
                                    els.push($(e));
                        });

                        count = els.length;

                        if(count == 1) {
                            var titre = els[0].find('h1').text();
                            self.showNotification({title: 'Fichier ajouté',text: titre + ' ajouté !'});
                        } else if(count != 0) {
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

            //Hiding miniatures
            $(self.itemSelector + '.miniature').css('visibility', 'hidden');

            //Make it async is way toooo long
            imagesLoaded(
                document.querySelector('#' + self.$container.attr('id') + ' .miniature'), 
            function() {
                self.pckry.layout();

                $(self.itemSelector + '.miniature h1').quickfit();
                $(self.itemSelector + '.miniature').css('visibility', 'visible');

            });

                if(!self.firstLoad)
                    self.loader();

                $(self.itemSelector).css('display', 'none');

                $(self.itemSelector + selector).each(function() {
                    $(this).css('display', 'block');
                });


                self.pckry.layout();
                
                if(!self.firstLoad)
                    self.loader();                

                self.countElementsByLetter();

                self.hasLayout();
                if(typeof cb == 'function')
                    cb();
               
        }


    };//Desktop ends

    return Desktop.init();

});