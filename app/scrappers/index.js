

module.exports = global.config.scrapper !== undefined ? require('./'+ global.config.scrapper + '/search') : require('./allocine/search');