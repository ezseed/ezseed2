assert = require "assert"
explorer = require "../"

expected =
  label: "."
  nodes: [
    label: "lib"
    nodes: []
  ,
    label: "src"
    nodes: []
  ,
    label: "test"
    nodes: []
  ]

describe "getDirectoryTree", ->
  it "makes a tree", (next) ->
    explorer.getDirectoryTree ".", {ignoreNodeModules: true, ignoreSourceControl: true}, (err, tree) ->
      assert.deepEqual tree, expected
      next null