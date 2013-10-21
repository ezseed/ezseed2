forEachDirectory = require "./forEachDirectory"

module.exports = (root, options, cb) ->
  [options, cb] = [{}, options] if typeof options is 'function'
  count = 0
  forEachDirectory root, (-> count++), options, (err) ->
    return cb err if err
    return cb null, count