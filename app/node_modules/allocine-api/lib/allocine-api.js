/*
    ------------------------------------------------------------------
    Allocine API module for Node.js
    ------------------------------------------------------------------

    Author :        Leeroy Brun (leeroy.brun@gmail.com)
    Github repo :   https://github.com/leeroybrun/node-allocine-api
    Version :       0.1.4
    Release date :  23.05.2013
*/


var crypto = require('crypto'),
    http = require('http');

var allocine = function() {

    // Configuration
    this.config = {
        apiHostName:  'api.allocine.fr',
        apiBasePath:  '/rest/v3/',
        apiPartner:   'V2luZG93czg',
        apiSecretKey: 'e2b7fd293906435aa5dac4be670e7982',
        imgBaseUrl:   'http://images.allocine.fr',
        userAgent:    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0; MSAppHost/1.0)'
    };

    // Presets for the API calls
    this.presets = {
        global: {
            partner: this.config.apiPartner,
            format: 'json'
        },
        movielist: { profile: 'large' },
        movie: { profile: 'large' },
        tvserieslist: { filter: 'top', order: 'viewcount' },
        tvseries: { profile: 'large' },
        tvseriesbroadcastlist: { profile: 'large' },
        season: { profile: 'large' },
        seasonlist: { profile: 'small' },
        news: { profile: 'large' },
        newslist: { profile: 'large' },
        media: { mediafmt: 'mp4' },
        feature: { profile: 'large' },
        featurelist: { profile: 'large' },
        picturelist: { profile: 'large' },
        videolist: { mediafmt: 'mp4' },
        search: { filter: 'movie,tvseries,theater,news,video' }
    }

    // Extend an object with other objects
    this.extend = function (dst) {
        for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== dst) {
                for(var key in arguments[i]) {
                    dst[key] = arguments[i][key];
                };
            }
        };

        return dst;
    }

    // Build path for accessing Allocine API
    this.buildPath = function(route, params) {
        var path = this.config.apiBasePath + route;

        // Extend params with route presets
        params = this.extend({}, this.presets.global, this.presets[route], params);

        if(params) {
            var tokens = [];

            // Fill the tokens array and sort it
            for(var param in params) {
                tokens.push(param +'='+ encodeURIComponent(params[param]));
            }
            tokens.sort();

            path += '?'+ tokens.join('&');

            // Build and encode path
            var date = new Date();
            var sed = date.getFullYear() +''+ ('0'+ (date.getMonth()+1)).slice(-2) +''+ ('0'+ (date.getDate()+1)).slice(-2);
            var sig = this.config.apiSecretKey + tokens.join('&') +'&sed='+ sed;

            // Hash "sig" parameter
            var shasum = crypto.createHash('sha1')
            sig = encodeURIComponent(shasum.update(sig, 'utf-8').digest('base64'));

            return path +'&sed='+ sed +'&sig='+ sig;
        }
        
        return path;
    }

    // Request the API with the given path
    this.request = function(path, callback) {
        var options = {
            hostname: this.config.apiHostName,
            path: path, 
            headers: {
                'User-Agent': this.config.userAgent
            }
        };

        // Call the API, fetch returned data and pass it to the callback
        http.get(options, function(res) {
            if(res.statusCode == 200) {
                var data = '';

                res.on('data', function(chunk) {
                    data += chunk;
                });

                res.on('end', function() {
                    // Success
                    callback(null, JSON.parse(data));
                });
            } else {
                // Error
                callback(res.statusCode, {});
            }
        }).on('error', function(e) {
            // Error
            callback(e.message, {});
        });;
    }

    // Main method, used to call the API
    this.api = function(method, options, callback) {
        var path = this.buildPath(method, options);

        this.request(path, callback);
    }

    return this;
}

module.exports = new allocine();