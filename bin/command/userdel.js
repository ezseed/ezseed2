
module.exports = function (program) {
	program
	.command('userdel <username>')
	.description("Suppression de l'utilisateur /!\\ tous les fichiers seront supprimés")
	.action(function(username) {

		require('../lib/user').get_client(username, function(err, client) {

			require('../client/'+client+'/userdel')(username, function() {
				
				process.exit(0);
			});
		});
		
	});

}
