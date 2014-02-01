
module.exports = function (program) {
	program
	.command('userdel <rutorrent|transmission> <username>')
	.description("Suppression de l'utilisateur /!\\ tous les fichiers seront supprimés")
	.action(function(client, username) {

		require('../client/'+client+'/userdel')(username, function() {
			process.exit(0);
		});
	});

}
