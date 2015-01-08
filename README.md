# Please check http://github.com/ezseed/ezseed

----------
 - **[Installation](#installation)**
 - **[Mis à jour](#mise-a-jour)**
 - **[CLI](#cli)**
 - **[Misc (licence, credits, liens)](#misc)**

## Installation

```
apt-get install git-core
git clone https://github.com/soyuka/ezseed2/
cd ezseed2
```

### Automatique

Ensuite exécutez autoInstall (installation de Nodejs et mongodb Debian Wheezy/Ubuntu 13 uniquement !), le script se chargera de bouger le site dans /var/www/ezseed2.

```
chmod +x ./autoInstall.sh && ./autoInstall.sh
# puis configurez le tout :
ezseed install
```

### Manuelle

 - Installation de [nodejs et mongodb](https://github.com/soyuka/ezseed2/wiki/Installation-manuelle-des-d%C3%A9pendances-sous-Debian)
 - Les paquets suivants : `whois nginx zip sudo` sont requis
 - `npm install pm2 -g`
 - `npm install && npm link`
 - `ezseed install`
   /!\ peut effacer votre configuration nginx par [nginx.conf](https://github.com/soyuka/ezseed2/blob/master/scripts/nginx.conf), voir `ezseed install -h`

### Configuration rutorrent
Pour rutorrent, il faut configurer autotools pour qu'il déplace les torrents une fois terminés :

![Autotools configuration](http://www.zupmage.eu/i/hpRER83cvG.png)

#### [Configuration Chroot SSH](https://github.com/soyuka/ezseed2/wiki/Chroot-utilisateurs)

### Erreurs

Sur les kimsufi, si vous avez une erreur du genre `Error : failed to connect to [localhost:27017]`, [voir ici](https://github.com/soyuka/ezseed2/wiki/Erreur-MongoDB-chez-OVH-%28&Kimsufi%29).

`can't start transmission unknow job` - ubuntu [#77](https://github.com/soyuka/ezseed2/issues/77)

### Lancement
```
ezseed start
```

## Mise a jour
```
ezseed update
```

Pour une mise à jour d'une version antérieure à la stable [voir ici](https://github.com/soyuka/ezseed2/wiki/Mise-%C3%A0-jour-depuis-une-version-ant%C3%A9rieure)

## CLI

Cet outil accessible en ssh vous permet d'installer rutorrent, transmission ou encore d'ajouter, de supprimer un utilisateur.

Pour plus d'informations sur le script :
`ezseed -h`
```
Usage: ezseed [options] [command]

  Commands:

    start
    stop
    restart
    install         [options] [client]                                    Install ezseed or the specified client
    update          [options]                                             Update ezseed
    useradd         [options] <rutorrent|transmission|aucun> <username>   Ajout d'un utilisateur au client spécifié
    userdel         <username>                                            Suppression de l'utilisateur /!\ tous les fichiers seront supprimés
    password        [options] <username>                                  Change username password
    rtorrent        [options] <start|stop|restart>                        stop rtorrent daemon(s)
    transmission    [options] <start|stop|restart>                        start|stop|restart transmission daemon(s)
    reboot                                                                Restart all daemons
    backup                                                                Backup
    restore         [options]                                             Restore backup config
    deploy                                                                Deploy ezseed
    configure       [options]                                             Configure
    credits                                                               Credits
    *

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

## Misc


### Licence

[![Licence Creative Commons](http://i.creativecommons.org/l/by-nc-sa/3.0/80x15.png)](https://github.com/soyuka/ezseed2/blob/develop/LICENCE.md) 

### Credits

![Credits ezseed2](http://www.zupmage.eu/i/KgO87SJzpu.png)

### Liens

* [Wiki](https://github.com/soyuka/ezseed2/wiki)
* [Bugs](https://github.com/soyuka/ezseed2/issues)
* [FAQ](https://github.com/soyuka/ezseed2/wiki/FAQ)
* [Themes](https://github.com/soyuka/ezseed2/wiki/Themes)
* [Donate](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=S3VC2G57H9776)

