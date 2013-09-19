explore = require "./explore"

module.exports = (root, options, cb) ->
  [options, cb] = [{}, options] if typeof options is 'function'
  current =
    label: root
    nodes: []
  options.sort = true
  job = explore root, options
  job.on "enter", (root, name) -> 
    child = 
      parent: current
      label: name
      nodes: []
    current.nodes.push child
    current = child
  job.on "leave", (root, name) -> current = current.parent
  job.on "end", (error) -> 
    return cb error if error
    removeBackReferences current
    cb null, current

removeBackReferences = (dir) ->
  delete dir.parent
  removeBackReferences subdir for subdir in dir.nodes