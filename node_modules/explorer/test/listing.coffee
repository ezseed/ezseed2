require("source-map-support").install()
assert = require "assert"
walk = require "walk-extra"

explorer = require ".."

nonExistentDir = "jsgsh;lk"


options = {}
  
describe "getDirectories", ->
  it "gets directories in .", (next) ->
    explorer.getDirectories ".", (err, paths) ->
      walk.getDirectories ".", (err, walkPaths) ->
        assert.deepEqual walkPaths.sort(), paths.sort()
        next null
  it "fails when given non-existent dir", (next) ->
    explorer.getDirectories nonExistentDir, (err, paths) ->
      assert.equal err.toString(), "Error: ENOENT, readdir '#{nonExistentDir}'"
      return next null

describe "getFiles", ->
  it "gets files in .", (next) ->
    explorer.getFiles ".", (err, paths) ->
      walk.getFiles ".", (err, walkPaths) ->
        assert.deepEqual walkPaths.sort(), paths.sort()
        next null
  it "fails when given non-existent dir", (next) ->
    explorer.getFiles nonExistentDir, (err, paths) ->
      assert.equal err.toString(), "Error: ENOENT, readdir '#{nonExistentDir}'"
      return next null