
        //TODO make an isotope plugin

        /*
        * Calculates the grid elements dimensions through pictures widths and heights
        * Previous work to generate a perfect masonry presentation
        * @param image : MAP {width, height}
        * @param grid : grid
        */

        var imageDimensions = function(image, grid) {
            var newImage = {}, n = grid.length;

            newImage.square = image.h / image.w == 1 ? true : false;

            for (var i = 0; i < n; i++) {
                
                //not last
                if(i != n - 1) {
                    //image width > grid[i].width
                    if(image.w >= grid[i].w && image.w < grid[i+1].w) {
                        
                        if(newImage.square) {

                                newImage.w = grid[i].w;
                                newImage.h = grid[i].w;
                                newImage.grid = { x: grid[i].i, y: grid[i].i };
                                return newImage;

                            i = n;
                        } else {

                            for (var j = 0; j < n; j++) {

                                if(j != n - 1) {
                                    
                                    if(image.h >= grid[j].h && image.h < grid[j+1].h) {
                                        // console.log('Changing', e, grid[i], grid[j]);

                                        newImage.w = grid[i].w;
                                        newImage.h = grid[j].h;
                                        newImage.grid = { x: grid[i].i, y: grid[j].j };

                                        i = n; j = n;
                                        return newImage;     
                                    }

                                //choice left
                                } else {

                                    newImage.w = grid[i].w;
                                    newImage.h = grid[j].h;
                                    newImage.grid = { x: grid[i].i, y: grid[j].j };

                                    i = n;

                                    return newImage;
                                }
                                
                            }
                        }

                    }

                //last width
                } else {
                    if(newImage.square) {

                        newImage.w = grid[i].w;
                        newImage.h = grid[i].w;
                        newImage.grid = { x: grid[i].i, y: grid[i].i };

                        i = n;
                        return newImage;
                    } else {
                        for (var j = 0; j < n; j++) {

                            if(j != n - 1) {
                                
                                if(image.h >= grid[j].h && image.h < grid[j+1].h) {
                                    
                                    newImage.w = grid[i].w;
                                    newImage.h = grid[j].h;
                                    newImage.grid = { x: grid[i].i, y: grid[j].j };
                                    i = n; j = n;

                                    return newImage;

                                }

                            //choice left
                            } else {

                                newImage.w = grid[i].w;
                                newImage.h = grid[j].h;
                                newImage.grid = { x: grid[i].i, y: grid[j].j };
                                i = n;

                                return newImage;
                            }
                        }
                    }
                }
            }
        } //ends img function