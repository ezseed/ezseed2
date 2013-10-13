fs = require "fs"
async = require "async"
EventEmitter = require("events").EventEmitter

scDirs = [".git",".svn",".hg"]

module.exports = (root, options = {}) ->
  emitter = new EventEmitter
  fixOptions options
  setImmediate -> 
    emitter.emit "start"
    explore root, emitter, options, (err) ->
      emitter.emit "end", err
      emitter.emit "succces", err unless err
  emitter
  
fixOptions = (options) ->
  options.runner = if options.sort or options.wait then async.forEachSeries else async.forEach
  options.waitOn = {} unless options.waitOn
  options.ignoreDirectories = [] unless options.ignoreDirectories
  options.ignoreDirectories = options.ignoreDirectories.concat scDirs if options.ignoreSourceControl
  options.ignoreDirectories.push "node_modules" if options.ignoreNodeModules
  options

explore = (root, emitter, options, next) ->
  handleEntry = (name, next) ->
    handleGlobalEntry root, name, emitter, options, next
  fs.readdir root, (err, names) ->
    return next err if err
    names.sort() if options.sort
    options.runner names, handleEntry, (err) ->
      return next err if err
      return next null

handleGlobalEntry = (root, name, emitter, options, next) ->
  entryPath = "#{root}/#{name}"
  emitter.emit "entry", root, name
  fs.lstat entryPath, (err, stat) ->
    return next err if err
    if stat.isDirectory()
      if name in options.ignoreDirectories
        nextStep = next
      else  
        type = "directory"
        nextStep = ->
          emitter.emit "enter", root, name
          explore entryPath, emitter, options, (err) ->
            emitter.emit "leave", root, name
            return next err if err
            return next null
    else 
      if stat.isSymbolicLink()
        type = "symlink"
      else if stat.isFile()
        type = "file"
      nextStep = next
    if type and options.waitOn[type]
      emitter.emit type, root, name, stat, nextStep
    else if type
      emitter.emit type, root, name, stat
      nextStep()
    else
      nextStep()