/*
https://github.com/chunksnbits/jquery-quickfit
Licence : Apache2
@author : chunksnbits
*/
(function(e){var t,n,r,i;i="quickfit";r={min:18,max:20,tolerance:.02,truncate:true,width:240,sample_number_of_letters:10,sample_font_size:12};n=function(){function n(t){this.options=t;this.item=e('<span id="meassure"></span>');this.item.css({position:"absolute",left:"-1000px",top:"-1000px","font-size":""+this.options.sample_font_size+"px"});e("body").append(this.item);this.meassures={}}var t;t=null;n.instance=function(e){if(!t)t=new n(e);return t};n.prototype.get_meassure=function(e){var t;t=this.meassures[e];if(t===void 0){t=this.set_meassure(e)}return t};n.prototype.set_meassure=function(e){var t,n,r,i,s;i="";r=e===" "?" ":e;for(n=0,s=this.options.sample_number_of_letters-1;0<=s?n<=s:n>=s;0<=s?n++:n--){i+=r}this.item.html(i);t=this.item.width()/this.options.sample_number_of_letters/this.options.sample_font_size;this.meassures[e]=t;return t};return n}();t=function(){function t(t,s){this.element=t;this.options=e.extend({},r,s);this.element=e(this.element);this._defaults=r;this._name=i;this.quickfit_helper=n.instance(this.options)}t.prototype.fit=function(){var e;if(!this.options.width){e=this.element.width();this.options.width=e-this.options.tolerance*e}if(this.text=this.element.attr("data-quickfit")){this.previously_truncated=true}else{this.text=this.element.html()}this.calculate_font_size();if(this.options.truncate)this.truncate();return this.element.css("font-size",""+this.font_size+"px")};t.prototype.calculate_font_size=function(){var e,t,n,r,i;t=0;i=this.text;for(n=0,r=i.length;n<r;n++){e=i[n];t+=this.quickfit_helper.get_meassure(e)}this.target_font_size=parseInt(this.options.width/t);return this.font_size=Math.max(this.options.min,Math.min(this.options.max,this.target_font_size))};t.prototype.truncate=function(){var e,t,n,r,i;if(this.font_size>this.target_font_size){r="";i=3*this.quickfit_helper.get_meassure(".")*this.font_size;e=0;while(i<this.options.width&&e<this.text.length){n=this.text[e++];if(t)r+=t;i+=this.font_size*this.quickfit_helper.get_meassure(n);t=n}if(r.length+1===this.text.length){r=this.text}else{r+="..."}this.text_was_truncated=true;return this.element.attr("data-quickfit",this.text).html(r)}else{if(this.previously_truncated)return this.element.html(this.text)}};return t}();return e.fn.quickfit=function(e){return this.each(function(){return(new t(this,e)).fit()})}})(jQuery,window)

/*!
* https://github.com/jakesgordon/bin-packing/
* Demo : http://codeincomplete.com/posts/2011/5/7/bin_packing/example/
* Licence : https://github.com/jakesgordon/bin-packing/blob/master/LICENSE
* @author : jakesgordon
*/
Packer = function(w, h) {
  this.init(w, h);
};

Packer.prototype = {

  init: function(w, h) {
    this.root = { x: 0, y: 0, w: w, h: h };
  },

  fit: function(blocks) {
    var n, node, block;
    for (n = 0; n < blocks.length; n++) {
      block = blocks[n];
      if (node = this.findNode(this.root, block.w, block.h))
        block.fit = this.splitNode(node, block.w, block.h);
    }
  },

  findNode: function(root, w, h) {
    if (root.used)
      return this.findNode(root.right, w, h) || this.findNode(root.down, w, h);
    else if ((w <= root.w) && (h <= root.h))
      return root;
    else
      return null;
  },

  splitNode: function(node, w, h) {
    node.used = true;
    node.down  = { x: node.x,     y: node.y + h, w: node.w,     h: node.h - h };
    node.right = { x: node.x + w, y: node.y,     w: node.w - w, h: h          };
    return node;
  }

}

/*!
 * Packer extension for Isotope
 *
 * Adaptation from bin-packing to isotope
 *
 * Usage :
 * $('#container').isotope({
 *   layoutMode: "packer",
 *   packer: {
 *       'realWidth': '80%' //real width
 *       ,'nbColumns': 12 //Nb of cols
 *       ,'nbMaxCols': 4 //Max cols for the picture container
 *       ,'nbMaxRows': 6 //Max row for the picture container
 *       ,'picturesClass': '.miniature' //Pictures class
 *   }
 * });
 * Add this css to the picture container :
 * .miniature {
 *   position: relative;
 *   overflow:hidden;
 * }
 *
 * @author Soyuka for EzSeed - https://github.com/soyuka/EzSeed
 */
;(function($, undefined) {

    $.extend($.Isotope.prototype, {

        /**
         * Reset layout properties
         *
         * Runs before any layout change
         * -------------------------------------------------------------------------------------------------------- */
        _packerReset: function() {

            // Setup layout properties
            var that = this
            ,prop = that.packer = {
                nbColumns : 12,
                realWidth : '80%',
                nbMaxCols : 3,
                nbMaxRows : 2
            };

            prop = $.extend(prop, that.options.packer);

            prop.columnWidth = this.element.width() / prop.nbColumns;

            // Calculate cols & rows, resizes DOM elements
            that._packerGetSegments();
            
            //setting the grid and resize DOM to fit the grid
            that._packerSetGrid();


        },



        /**
         * Create layout
         * -------------------------------------------------------------------------------------------------------- */
        _packerLayout: function($elems) {

            var that = this, prop = this.packer;

            var elements = [];

            //Getting each elements heights/widths
            $elems.each(function(i, e) {
                var element = {
                    $el : $(e),
                    w : $(e).outerWidth(),
                    h : $(e).outerHeight()
                };

                elements.push(element);
            });

            //Calcs the max height to make sure all fits
            var height = 0;
            for (var i = 0; i < elements.length; i++) 
                height += parseInt(elements[i].h);

            prop.rowHeight = height;

            var packer = new Packer(that.element.width(), prop.rowHeight);

            //Sort functions from bin-packing js
            var sort = {

                random  : function (a,b) { return Math.random() - 0.5; },
                w       : function (a,b) { return b.w - a.w; },
                h       : function (a,b) { return b.h - a.h; },
                a       : function (a,b) { return b.area - a.area; },
                max     : function (a,b) { return Math.max(b.w, b.h) - Math.max(a.w, a.h); },
                min     : function (a,b) { return Math.min(b.w, b.h) - Math.min(a.w, a.h); },

                height  : function (a,b) { return sort.msort(a, b, ['h', 'w']);               },
                width   : function (a,b) { return sort.msort(a, b, ['w', 'h']);               },
                area    : function (a,b) { return sort.msort(a, b, ['a', 'h', 'w']);          },
                maxside : function (a,b) { return sort.msort(a, b, ['max', 'min', 'h', 'w']); },

                /* sort by multiple criteria */
                msort: function(a, b, criteria) {
                  var diff, n;
                  for (n = 0 ; n < criteria.length ; n++) {
                    diff = sort[criteria[n]](a,b);
                    if (diff != 0)
                      return diff;  
                  }
                  return 0;
                }
            }

            //Could change but it seems to be the better sort 
            elements.sort(sort.width);

            packer.fit(elements);

            var newHeight = 0;

            for(var n = 0 ; n < elements.length ; n++) {
                var block = elements[n];
                if (block.fit) {
                    if(block.fit.x == 0)
                        newHeight += block.h;
                    
                    that._pushPosition( block.$el, block.fit.x, block.fit.y );

                } else {
                    //should not append cause the height has been calculated with all elements height
                    console.log('No fit', block);
                }
            }

            that.packer.rowHeight = newHeight;
        },



        /**
         * Get container size
         *
         * Resizes the container
         * -------------------------------------------------------------------------------------------------------- */
        _packerGetContainerSize: function() {
            return {
                width: this.packer.realWidth,
                height: this.packer.rowHeight
            };
        },



        /**
         * Resize changed
         *
         * Figure out if layout changed
         * -------------------------------------------------------------------------------------------------------- */
        _packerResizeChanged: function() {
            var prop = this.packer;

            this._packerGetSegments();

            return true;
        },


        /**
         * Get segments
         * -------------------------------------------------------------------------------------------------------- */
        _packerGetSegments: function() {
            var prop = this.packer;
          
            this._getSegments();
            this._getSegments(true);

        },

        /**
        * Sets a grid by the maxCols/maxRows
        * It's used for resizing the pictures container
        */
        _packerSetGrid: function() {
            
            var prop = this.packer
                ,grid = []
                ,n = 0;

            prop.columnWidth = this.element.width() / prop.nbColumns;

            for(var i = 1; i <  prop.nbMaxCols; i++) {
                for(var j = 1; j <  prop.nbMaxRows; j++) {
                    grid[n] = {
                        w : prop.columnWidth * i,
                        h : prop.columnWidth * j,
                        i : i,
                        j : j
                    };
                    n++;
                }
            }
            prop.grid = grid;
            
            this._resizeDOMGrid();
        },

        /**
        * Resizes pictures containers
        * It's used for resizing the pictures container
        */
        _resizeDOMGrid: function(cb) {
            var that = this, prop = this.packer;

            prop.columnWidth = this.element.width() / prop.nbColumns;

            function setGrid () {
              var elements = [];
              that.element.find(prop.picturesClass).each( 
                  function(i, e) {
                      var $titre = $(e).find('div.titre'),
                          $min = $(e).find('img');

                      //This parts works with entypo icons <i class=""></i> and sets a proper font-size
                      if($min.width() == undefined) {
                          $(e).css({'width': prop.columnWidth*2, 'height': prop.columnWidth*2}).find('i').css({'font-size': prop.columnWidth*2});
                          var newImage = {};

                          newImage.w = prop.columnWidth*2;
                          newImage.h = prop.columnWidth*2;

                      //It's a picture
                      } else {
                          var image = {
                              w : $min.prop('naturalWidth'),
                              h : $min.prop('naturalHeight')
                          };

                          var newImage = that._imageDimensions(image); //see below

                          $(e).css({'width': newImage.w, 'height': newImage.h});

                          if(newImage.square)
                              $(e).find('img').css({'max-width': '100%'});

                          if(image.h > newImage.h + prop.columnWidth || (image.h > newImage.h + prop.columnWidth && image.w > newImage.w + prop.columnWidth))
                              $(e).find('img').css({'max-height': '100%'});

                      }

                      $titre.css({'width': newImage.w});
                      $titre.find('h1').quickfit({'width': newImage.w, 'min': '13', 'max':'18', 'truncate':true});

                  }
              );
            }

            //Set grid only when images has loaded
            that.element.imagesLoaded(function() {
              setGrid();
            });

        },

        
        /*
        * Calculates the grid elements dimensions through pictures widths and heights
        * Works with a grid see set grid
        * @param image : MAP {width, height}
        * @param grid : grid
        * -------------------------------------------------------------------------------------------------------- */

        _imageDimensions: function(image) {
            
            var grid = this.packer.grid;

            var n = grid.length,
            square = image.h / image.w == 1 ? true : false,
            newImage = function(w, h, x, y) {
                return {
                    'w': w,
                    'h' : h,
                    'grid' : {
                        'x' : x,
                        'y' : y
                    },
                    'square':square
                };
            };

            for (var i = 0; i < n; i++) {
                
                //not last
                if(i != n - 1) {
                    
                    if(image.w >= grid[i].w && image.w < grid[i+1].w) {
                        
                        if(square) {
                            var container = newImage(grid[i].w, grid[i].w, grid[i].i, grid[i].i);
                            i = n;
                        } else {

                            for (var j = 0; j < n; j++) {

                                if(j != n - 1) {
                                    
                                    if(image.h >= grid[j].h && image.h < grid[j+1].h) {
                                    var container = newImage(grid[i].w, grid[j].h, grid[i].i, grid[j].j);
                                        i = n; j = n;
                                    }

                                //choice left
                                } else {
                                    var container = newImage(grid[i].w, grid[j].h, grid[i].i, grid[j].j);
                                    i = n;
                                }
                                
                            }
                        }

                    }

                //last width
                } else {
                    if(square) {
                        var container = newImage(grid[i].w, grid[i].w, grid[i].i, grid[i].i);
                        i = n;
                        
                    } else {
                        for (var j = 0; j < n; j++) {

                            if(j != n - 1) {
                                
                                if(image.h >= grid[j].h && image.h < grid[j+1].h) {
                                    
                                    var container = newImage(grid[i].w, grid[j].h, grid[i].i, grid[j].j);
                                    i = n; j = n;
                                    
                                }

                            //choice left
                            } else {

                                var container = newImage(grid[i].w, grid[j].h, grid[i].i, grid[j].j);
                                i = n;
                                
                            }
                        }
                    }
                }
            }

            return container;
        }

    });


})(jQuery);
