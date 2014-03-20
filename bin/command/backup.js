var s = require('shelljs')

var path = require('path')
  , backup
  , scripts = 'scripts/transmission/config/';

s.cd(app_path)

module.exports = function (program) {
	program
	.command('backup')
	.description("Backup")
	.action(function() {

		backup = path.join(app_path, '../ezseed'+Date.now()+'.bak')

		logger.info('Backup is done in ', backup)

		//Creating folders
		s.mkdir('-p', path.join(backup, 'app'), path.join(backup, scripts))
		//Copy config.json
		s.cp('app/config.json', path.join(backup, 'app'))
		//Copy transmission user configuration files
		s.cp(scripts + 'settings.*.json', path.join(backup, scripts))
		s.exit()
	})

	program
	.command('restore')
	.description('Restore backup config')
	.option('--from <path>', 'Backup from specified path instead of parent directory')
	.action(function(options) {

		var from = options.from || '../'

		//most recent first
		var backup = s.ls(from).sort(function(a, b) {
			return a < b ? 1 : -1;
		})

		for(var i in backup) {
			if(backup[i].match('ezseed[0-9]{2,}.bak')) {
				backup = backup[i]
				break;
			}
		}

		if(backup.length > 0 && backup[0] !== "") {
			backup =  path.join(app_path, '../', backup)
			s.cp('-f', path.join(backup, 'app', 'config.json'), 'app/config.json')
			s.cp('-f', path.join(backup, scripts, 'settings.*.json'), scripts)

			logger.info('Backup restored from ' + backup)

			s.exit()
		} else {
			throw new Error('No backup folder founded')
		}

	})

}
