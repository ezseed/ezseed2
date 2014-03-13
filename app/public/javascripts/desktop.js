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

    'eventEmitter/EventEmitter',

    //Helpers
    'underscore', 'cookie', 'quickfit'


], function(Albums, Movies, Others, Paths, Packery, imagesLoaded, async, $, api, alertify, EventEmitter){

    alertify.set({ delay : 10000 }); // 10s

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
        api: api,
        firstLoad : true,
        $container : $('section#desktop'), //Elements container
        itemSelector : '.element',
        displaySelector : null,
        display: $.cookie('display') ? $.cookie('display') : '.list',
        //Packery Instance
        pckry : null,
        hasLayout : false,
        //Socket
        socket : null,
        hasLayout : function() {},
        currentDisplay: function() {},
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
        resetDisplay: function(display) {
            this.display = display ? display : '.list';
            this.emit('display', this.display);
            return this;
        },
        sanitizeDisplay: function(display) {
            var displays = ['video', 'movie', 'video', 'tvseries', 'audio', 'other', 'list', 'miniature', 'table'];
             
            display = display.split('.');

            display = _.reject(display, function(d){ return displays.indexOf(d) === -1});

            display = display.join('.');

            return '.' + display;
        },
        setDisplay: function(selector, remove) {
            
            var option = ['.list', '.miniature','.table']
              , filter = ['.video.movie', '.video.tvseries', '.audio', '.other']
              , types = []
              , remove = remove ? remove : false
              , i = -1
              , display = this.display;         

            if(this.firstLoad) {
                //sanitize display to remove displays we didn't wanted i.e. themes ones
                display = this.sanitizeDisplay(display);
                this.emit('firstDisplay', display);
            } else {
                this.emit('display', display);
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
            return this;
        },
        init : function() {
            var self = this;

            if(self.pckry === null && isDesktop === true) {
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

            if(user && isDesktop === true) {
                self.api.init(self);
            } else if(user) {
                self.api.size();
            }

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
        sort: function(by) {
            var self = this
              , $items = this.sortBy[by](this.pckry.getItemElements());
            
            this.loader();

            this.pckry.remove(this.pckry.getItemElements());

            this.$container.addClass('notransition').css('visibility', 'hidden').append($items);

            this.pckry.appended($items);

            self.layout(function() { 

                self.loader();

                $.cookie('sort', by);

                self.$container.removeClass('notransition').css('visibility', 'visible');

            });

        },
        sortBy: {

            date: function($items) {

                $items.sort(function (a, b) {
                    a = $(a), b = $(b); //jquerying -"-
                    if (a.data('date-added') == b.data('date-added')) {
                        return 0;
                    } else if (a.data('date-added') < b.data('date-added')) {
                        return 1;
                    }
                    return -1;
                });
        
                return $items;
        
            },
            alpha: function($items) {

                $items.sort(function (a, b) {
                    a = $(a), b = $(b);

                    if(a.hasClass('table'))
                        a = a.find('a.table-link').text().replace(/\s+/g, '').charAt(0);
                    else
                        a = $(a).find('h1').text().replace(/\s+/g, '').charAt(0);

                    if(b.hasClass('table'))
                        b = b.find('a.table-link').text().replace(/\s+/g, '').charAt(0);
                    else
                        b = $(b).find('h1').text().replace(/\s+/g, '').charAt(0);
                    
                    // \o/
                    if (a == b)
                        return 0;
                    else if (a > b)
                        return 1;

                    return -1;
                });
                
                return $items;
        
            }

        },
        append : function(datas) {

            var self = this;

            if(!self.firstLoad)
                self.loader();
            
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

                    var sort = $.cookie('sort');

                    if(!sort)
                        sort = 'date';
                    
                    
                    $.cookie('sort', sort);

                    $items = self.sortBy[sort]($els);
                    self.emit('sort', sort);
                    
                    delete $els;

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
        layoutThumbnails: function(cb) {

            var self = this, selector = '#' + self.$container.attr('id') + ' '+ self.display;
           
            // console.log('layoutThumbs', self.display, selector);            
            
            imagesLoaded(
                selector +' img', 
            function(instance) {
                self.pckry.layout();

                $(self.itemSelector + self.display).css('display', 'block');

                $(selector).each(function(i, e) {

                    $(e).find('h1').quickfit({
                        min: 12,
                        max: 20,
                        truncate: true,
                        width: $(e).find('img').width() - 10
                    });
                });

                self.pckry.layout();

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
             
                self.hasLayout();

                if(typeof cb == 'function')
                    cb();
            }
               
        }


    };//Desktop ends

    return _.extend(Desktop.init(), EventEmitter.prototype);

});