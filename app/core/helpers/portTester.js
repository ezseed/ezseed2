var net = require('net');

/**
 * Usage

	require('localPortTester').findOpen(3001, function(err, port) {
		if(err)
			console.error(err);

	    console.log(port)
	});

 */

var localPortTester = {
	default_range: 1000,
	//https://gist.github.com/timoxley/1689041
	isPortTaken: function(port, fn) {
	  var tester = net.createServer()
	  .once('error', function (err) {
	    if (err.code != 'EADDRINUSE') return fn(err)
	    fn(null, true)
	  })
	  .once('listening', function() {
	    tester.once('close', function() { fn(null, false) })
	    .close()
	  })
	  .listen(port)
	},
	//Asynchronous parse an array of ports
	//Callback when status is founded
	parse: function(arr, status, cb) {

		if(arr.length == 0)
			cb(null, false);

		var port = arr.shift();

		this.isPortTaken(port, function(err, taken) {
			if(taken === status)
				return cb(null, port); //It's open
			else
				setImmediate(function() {
					this.parse(arr, status, cb);
				});
		});
	},
	/*
	 * Find first opened port
	 * Stop is not required and could be callback
	 */
	findOpen: function(start, stop, cb) {

		cb = typeof stop == 'function' ? stop : cb;

		stop = typeof stop == 'function' ? start + this.default_range : stop;

		var ports = [];

		for(var i = start; i < stop; i++)
			ports.push(i);

		return this.parse(ports, false, cb);
	},
	//Same as before, founds a closed port
	findClose: function(start, stop, cb) {
		cb = typeof stop == 'function' ? stop : cb;

		stop = typeof stop == 'function' ? start + default_range : stop;

		var ports = [];

		for(var i = start; i < stop; i++)
			ports.push(i);

		return this.parse(ports, true, cb);
	}

}

module.exports = localPortTester;

