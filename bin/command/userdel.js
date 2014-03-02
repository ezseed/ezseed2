
module.exports = function (program) {
	program
	.command('userdel <username>')
	.description("/!\\ All files will be deleted")
	.action(function(username) {

		username = username.toLowerCase();

		require('../lib/user').get_client(username, function(err, client) {

			require('../client/'+client+'/userdel')(username, function() {
				
				process.exit(0);
			});
		});
		
	});

}
