

module.exports = global.conf.scrapper !== undefined ? require('./'+ global.conf.scrapper + '/search') : require('./allocine/search');