explore = require "./explore"

module.exports = (root, iterator, options, cb) ->
  [options, cb] = [{}, options] if typeof options is 'function'
  job = explore root, options
  job.on "file", iterator
  job.on "end", (error) -> cb error