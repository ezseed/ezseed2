var fs = require('fs')
    , _ = require('underscore')
    , _s = require('underscore.string')
    , path = require('path')
    , md = require("node-markdown").Markdown;

var plugin = {
	name : "Allocine",
	enabled : true,
	routes : [
		{
			type : 'GET',
			route : '/plugins/allocine/',
			action :  function(req, res) {
				
			}
		},

		{ 
			type : 'POST',
			route : '/plugins/allocine/', 
			action : function(req, res) {
				
			}
		}
	]
};

module.exports.plugin = plugin;

