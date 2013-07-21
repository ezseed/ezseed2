
                    var columnWidth = $section.width() / 12
                            ,nbMaxWidth = 4 //nb of column max
                            ,nbMaxHeight = 5 //nb of height max
                            ,grid = []
                            ,n = 0;


                    for(var i = 1; i < nbMaxWidth; i++) {
                        for(var j = 1; j < nbMaxHeight; j++) {
                            grid[n] = {
                                w : columnWidth * i,
                                h : columnWidth * j,
                                i : i,
                                j : j
                            };
                            n++;
                        }
                    }
                    
                    var elements = [],
                        element = {};

                    //console.log(grid);
                    $('.element.miniature').each( 
                        function(i, e) {
                            var $titre = $(e).find('div.titre'),
                                $min = $(e).find('img');

                            if($min.width() == undefined) {
                                $(e).css({'width': columnWidth*2, 'height': columnWidth*2}).find('i').css({'font-size': columnWidth*2});
                                $(e).attr('data-x', 2).attr('data-y', 2);

                                $titre.css({'width': columnWidth*2});
                                $titre.find('h1').quickfit({'width': columnWidth*2, 'min': '13', 'max':'20', 'truncate':true});

                            } else {
                                var image = {
                                    w : $min.width(),
                                    h : $min.height()
                                };

                                var newImage = imageDimensions(image, grid);
                                $(e).css({'width': newImage.w, 'height': newImage.h});
                                $(e).attr('data-x', newImage.grid.x).attr('data-y', newImage.grid.y);

                                if(newImage.square)
                                    $(e).find('img').css({'max-width': '100%'});

                                if(image.h > newImage.h + columnWidth || (image.h > newImage.h + columnWidth && image.w > newImage.w + columnWidth))
                                    $(e).find('img').css({'max-height': '100%'});

                                $titre.css({'width': newImage.w});
                                $titre.find('h1').quickfit({'width': newImage.w, 'min': '13', 'max':'20', 'truncate':true});

                            }

                            element.$el = $(e),
                            element.id = $(e).attr('data-id'),
                            element.x = $(e).attr('data-x'),
                            element.y = $(e).attr('data-y');

                            elements.push({ el : $(e), id : $(e).attr('data-id'), x :$(e).attr('data-x'), y: $(e).attr('data-y') });

                        }
                    );

                    var nbColumns = 12;

                    var orderedElements = new Array(),
                    nbElements = elements.length, yMax = 0;
                    
                    for (var i = 0; i < nbElements; i++) {
                        yMax += parseInt(elements[i].y);
                    }

                    //Setting the matrix by the number of elements
                    var matrix = new Array(nbColumns);
                    for (var i = 0; i < nbColumns; i++) {
                        matrix[i] = new Array(yMax);
                        for(var j = 0; j < yMax; j++) {
                            matrix[i][j] = false;
                        }
                    }

                    