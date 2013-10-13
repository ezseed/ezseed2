require("source-map-support").install()
assert = require "assert"
walk = require "walk-extra"

explorer = require ".."

options = {}
  
describe "countDirectories", ->
  it "counts directories in .", (next) ->
    explorer.countDirectories ".", (err, count) ->
      walk.countDirectories ".", (err, walkCount) ->
        assert.equal walkCount, count
        next null

describe "countFiles", ->
  it "counts files in .", (next) ->
    explorer.countFiles ".", (err, count) ->
      walk.countFiles ".", (err, walkCount) ->
        assert.equal walkCount, count
        next null
        