var level   = process.argv.indexOf('-d') === -1 ? 6 : 7;
var logger  = require('caterpillar').createLogger({level:level});
var filter  = require('caterpillar-filter').createFilter();
var human   = require('caterpillar-human').createHuman();

logger.pipe(filter).pipe(human).pipe(process.stdout);

module.exports = logger.log;