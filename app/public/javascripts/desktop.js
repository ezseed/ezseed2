define([
    //templates
    'text!../views/albums.ejs',
    'text!../views/movies.ejs',
    'text!../views/others.ejs',
    'text!../views/paths.ejs',

    //Modules
    'packery/packery',
    'imagesloaded',
    'async',
    'jquery',
    'api',
    'alertify',

    //Helpers
    'underscore', 'cookie', 'quickfit',


], function(Albums, Movies, Others, Paths, Packery, imagesLoaded, async, $, api, alertify){

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
        display: $.cookie('display') === undefined ? '.list' : $.cookie('display'),
        //Packery Instance
        pckry : null,
        hasLayout : false,
        //Socket
        socket : null,
        hasLayout : function() {},
        currentDisplay: function() {},
        alphabet : {'A':0,'B':0,'C':0,'D':0,'E':0,'F':0,'G':0,'H':0,'I':0,'J':0,'K':0,'L':0,'M':0,'N':0,'O':0,'P':0,'Q':0,'R':0,'S':0,'T':0,'U':0,'V':0,'W':0,'X':0,'Y':0,'Z':0,'#':0},
        loader : function() {

            var $loader = $('#loader');
            
            if($loader.is(':visible'))
                $loader.fadeOut();
            else 
                $loader.fadeIn();

        },
        showNotification : function(params) {
            // notify.createNotification(params.title, {body : params.text, icon: '/images/planetetrans.png', tag:params.tag, timeout:2500});
        },
        setDisplay: function(selector, remove) {
            
            var option = ['.list', '.miniature','.table']
              , filter = ['.video.movie', '.video.tvseries', '.audio', '.other']
              , remove = remove ? remove : false
              , i = -1
              , display = this.display;         


            if(this.firstLoad) {
                
                display = display.replace('.highlight', '').replace('.startsWith','').replace('.path', '');

                $('#displayOptions i').each(function(i, e) {

                    if( display.indexOf( $(e).attr('data-filter') ) !== -1 )
                        $(e).addClass('active');
                });

                $('#displayFilters li').each(function(i, e) {

                    if( display.indexOf( $(e).attr('data-filter') ) !== -1 )
                        $(e).addClass('active');
                });
                
            }


            if(selector !== undefined && display.indexOf(selector) === -1) {
                    
                i = option.indexOf(selector);

                if(i !== -1)
                    for(var j in option)
                        if(j !== i)
                            display = display.replace(option[j], '');               

                i = filter.indexOf(selector);

                if(i !== -1)
                    for(var j in filter)
                        if(j !== i)
                           display = display.replace(filter[j], '');

                display += selector;

            } else if(selector !== undefined && remove)
                display = display.replace(selector, '');

            $.cookie('display', display);
            this.display = display;

            console.log(display);

            return this;
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

            if(user && isDesktop) {
                api.init(self);
            } else if(user) {
                api.size();
            }

            //hash
//            self.toRemove = window.location.hash.substr(1);
//            
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


                    if($('#displayPath').length !== 0)
                        $('#displayPath').html(_.template(Paths, {paths: paths}));

                    callback(err, html);
                });
                
            }, 
            path : function(path, cb) {

                async.parallel({
                    movies : function(callback) 
                    {
                        if(path.movies.length) {

                            //parse each path + search dom id and remove it :p
                            path.movies.forEach(function(movie) {

                                var $el = $(Desktop.itemSelector + '[data-id="' + movie._id + '"]');

                                //Cheating...
                                if($el.length)
                                    Desktop.pckry.remove($el);

                            });

                            callback(null, Desktop.template(Movies, {movies : path.movies, path: path._id}));
                        } else
                            callback(null, '');
                    },
                    albums : function(callback) 
                    {
                        if(path.albums.length) {
                            callback(null, Desktop.template(Albums, {albums : path.albums, path: path._id}));
                        } else
                            callback(null, '');

                    },
                    others : function(callback) 
                    {
                        if(path.others.length) {
                            callback(null, Desktop.template(Others, {others : path.others, path: path._id}));
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
        remove: function(to_remove) {
            var self = this
              , removed = [];

            if(to_remove.length) {
                _.each(to_remove, function(r) {
                    var $item = $(self.itemSelector + '[data-id="' + r.item + '"]'), $el = $item.find('tr[data-id="' + r.file + '"]');

                    if($el.length) {
                        removed.push($el.find('td.file_name').text());

                        if($el.closest('tbody').find('tr').length == 1) {
                            self.pckry.remove($item);
                            $el.remove();
                        } else 
                            $el.remove();

                    } else {
                        removed.push($item.find('h1:first').text());
                        self.pckry.remove($item);
                    }
                });

                if(removed.length == 1)
                    alertify.log(removed[0]+' a été supprimé');
                else
                    alertify.log(removed.length + " fichiers supprimés");

                self.layout();

            }
        },
        noFiles: function() {
            
            var self = this;

            if(self.firstLoad) {
                self.loader();
                self.firstLoad = false;
                alertify.log('Aucun fichier trouvé');
            }

            return;
        },
        append : function(datas) {

            var self = this;

            if(!self.firstLoad)
                self.loader();

            // self.display = $.cookie('display') === undefined ? '.list' : $.cookie('display');
           
            // $('#displayFilters li').each(function(i, e) { 
            //     $(e).attr('data-display', displayOption); 
            // });
            
            self.render.files(datas, function(err, html) {
                if(err)
                    console.error(err);

                if(html.length > 0) {

                    var $items = $.parseHTML(html), $els = [];

                    _.each($items, function(e) {
                        var isTxt = e instanceof Text; //parseHTML causes element duplicated

                        if(!isTxt)
                            $els.push(e);
                        
                    });

                    $items = $els;
                    delete $els;

                    //SORT TODO
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

                    if(self.firstLoad) {
                        self.setDisplay();
                    }

                    self.layout(function() { 
                        self.loader();

                        if(self.firstLoad) {
                            self.firstLoad = false;
                        } else {
                            var count = 0, els = [];

                            //Getting titles
                            _.each($items, function(e) {
                                    if($(e).hasClass('list'))
                                        els.push($(e).find('h1').text());
                            });

                            count = els.length;

                            if(count == 1) {
                                alertify.log(els[0] + ' a été ajouté');
                                //self.showNotification({title: 'Fichier ajouté',text: titre + ' ajouté !'});
                            } else if(count != 0) {
                                alertify.log(count + ' élements ajoutés');
                                //self.showNotification({title: 'Fichiers ajoutés',text: count + ' fichiers ajoutés'});
                            }
                        }

                        self.$container.removeClass('notransition').css('visibility', 'visible');

                    });
                }
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
        layoutThumbnails: function(cb) {

            var self = this, selector = '#' + self.$container.attr('id') + ' '+ self.display +' img';
           
            // console.log('layoutThumbs', self.display, selector);            
            
            imagesLoaded(
                selector, 
            function(instance) {
                self.pckry.layout();

                // $(selector+' h1').quickfit();
                $(self.itemSelector + self.display).css('display', 'block');
                
                self.pckry.layout();

                self.countElementsByLetter();

                self.hasLayout();
                
                if(typeof cb == 'function')
                    cb();

            });
            
        },
        layout : function(cb) {
            var self = this;

            $(self.itemSelector).css('display', 'none');

            if(self.display.indexOf('.miniature') !== -1) {
                self.layoutThumbnails(cb);
            } else {

                $(self.itemSelector + self.display).css('display', 'block');

                self.pckry.layout();
             
                self.countElementsByLetter();

                self.hasLayout();

                if(typeof cb == 'function')
                    cb();
            }
               
        }


    };//Desktop ends

    return Desktop.init();

});