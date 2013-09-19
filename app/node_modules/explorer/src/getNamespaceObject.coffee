explore = require "./explore"

module.exports = (root, options, cb) ->
  [options, cb] = [{}, options] if typeof options is 'function'
  current = {}
  options.sort = true
  job = explore root, options
  job.on "directory", (root, name) -> current[name] = "..": current
  job.on "enter", (root, name) -> current = current[name]
  job.on "leave", (root, name) -> current = current[".."]
  job.on "end", (error) ->
    return cb error if error
    removeBackReferences current
    cb null, current

removeBackReferences = (dir) ->
  delete dir['..']
  removeBackReferences subdir for name, subdir of dir