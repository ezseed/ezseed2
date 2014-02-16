var mongoose = require('mongoose')
  ,	model = require('./model')
  , MoviesInformations = mongoose.model('MoviesInformations');

// var allocinePlugin = function(schema, options) {
 
//  	schema.pre('remove', function (next) {

// 	    console.log(this.infos);

// 	    MoviesInformations.findByIdAndRemove(this.infos).exec();

// 	});

//   // if (options && options.index) {
//   //   schema.path('lastMod').index(options.index)
//   // }
// };




// module.exports.plugin = allocinePlugin;
