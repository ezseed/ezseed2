forEach = require "./forEachFile"

module.exports = (root, options, cb) ->
  [options, cb] = [{}, options] if typeof options is 'function'
  count = 0
  forEach root, (-> count++), options, (err) ->
    return cb err if err
    return cb null, count