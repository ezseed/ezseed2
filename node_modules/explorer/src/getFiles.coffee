forEachFile = require "./forEachFile"

module.exports = (root, options, cb) ->
  [options, cb] = [{}, options] if typeof options is 'function'
  paths = []
  forEachFile root, ((root, name) -> paths.push root + "/" + name), options, (err) ->
    return cb err if err
    return cb null, paths