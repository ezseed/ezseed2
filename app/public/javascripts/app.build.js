({
    appDir: "../",
    baseUrl: "./",
    // dir: "../js",
    keepBuildDir: true,
    //Comment out the optimize line if you want
    //the code minified by UglifyJS
    optimize: "uglify",
    paths : {
        // //jquery
       jquery : 'require-jquery',
        // //helpers
        // async: 'helpers/async',
        // underscore : 'helpers/underscore',
        // //jquery modules
        // notify : '/modules/desktop-notify',
        // ejs : '/modules/jquery.ejs',
        // cookie : '/modules/jquery.cookie',
        // quickfit : '/modules/quickfit',
        // //admin modules
        // collapse : 'modules/jquery.collapse',
        // collapse_storage : 'modules/jquery.collapse_storage',
        // customselect: 'modules/customselect',
        // packery : 'vendor/packery'
    },

    mainConfigFile: 'main.js',
    // shim: {
    //     'notify': ['jquery'],
    //     'ejs': ['jquery'],
    //     'cookie' : ['jquery'],
    //     'quickfit' : ['jquery'],
    //     'collapse' : ['jquery'],
    //     'collapse_storage' : ['collapse', 'jquery'],
    //     'customselect' : ['jquery']
    // }
    modules: [
        //Optimize the application files. jQuery is not 
        //included since it is already in require-jquery.js
        {
            name: "main"
        }
    ]
})
