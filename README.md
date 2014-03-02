 - **[Installation][1]**
 - **[Mise à jour][2]**
 - **[CLI][3]**

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
 - Les paquets suivants : `whois nginx zip` sont requis
 - `npm install pm2 -g`
 - `npm install && npm link`
 - `ezseed install` 
       /!\ peut effacer votre configuration nginx par [nginx.conf](https://github.com/soyuka/ezseed2/blob/master/app/scripts/nginx.conf), voir `ezseed install -h`

### Configuration rutorrent
Pour rutorrent, il faut configurer autotools pour qu'il déplace les torrents une fois terminés :

![Autotools configuration](http://www.zupmage.eu/i/hpRER83cvG.png)

### Erreurs

Sur les kimsufi, si vous avez une erreur du genre `Error : failed to connect to [localhost:27017]`, [voyez ici](https://github.com/soyuka/ezseed2/wiki/Erreur-MongoDB-chez-OVH-%28&Kimsufi%29).

Sur ubuntu #77, `Ubuntu can't start transmission unknow job`

### Lancement
```
ezseed start
```

Les logs de l'application sont dans `/var/log/ezseed/`

## Mise à jour
```
ezseed update
```

### Mise à jour depuis < v2.1.11-beta

Je commence par créer une nouvelle version d'ezseed et je remet les fichiers de configuration dedans :
```
cd /var/www
mv ezseed2 ezseed2.bak
git clone https://github.com/soyuka/ezseed2
cd ezseed2
cp ../ezseed2.bak/app/scripts/transmission/config/* scripts/transmission/config
cp ../ezseed2.bak/app/config.json app/config.json

#mise à jour de pm2
pm2 kill
npm install pm2 -g

#Ensuite, je vais supprimer les médias de la base de données :
mongo
use ezseed
db.movies.drop()
db.albums.drop()
db.others.drop()

#ctrl+c pour quitter mongo
Enfin, je configure le nouveau ezseed
npm install
npm link

#la commande de config
ezseed install -sun

ezseed start
```

### Mise à jour depuis < v2.1.10-beta

Pour configurer le reboot :

`ezseed config -uns` 
`Ctrl+C` pour annuler une fois l'étape terminée

### Mise à jour depuis develop-stable > v2.1.11

 `ezseed update`
 `ezseed configure`

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
    install [options] [client] Install ezseed or the specified client
    update [options]       Update ezseed
    useradd [options] <rutorrent|transmission|aucun> <username> Ajout d'un utilisateur au client spécifié
    userdel <username>     Suppression de l'utilisateur /!\ tous les fichiers seront supprimés
    password [options] <username> Change username password
    rtorrent [options] <start|stop|restart> stop rtorrent daemon(s)
    transmission [options] <start|stop|restart> start|stop|restart transmission daemon(s)
    reboot                 Restart all daemons
    deploy                 Deploy ezseed
    configure [options]    Configure
    credits                Credits
    *

  Options:

    -h, --help     output usage information
    -V, --version  output the version number
```

## Misc

### Licence

[![Licence Creative Commons](http://i.creativecommons.org/l/by-nc-sa/3.0/80x15.png)](http://creativecommons.org/licenses/by-nc-sa/3.0/deed.fr)

### Credits

![Credits ezseed2][4]

### Liens

* [Wiki](https://github.com/soyuka/ezseed2/wiki)
* [Bugs](https://github.com/soyuka/ezseed2/issues)


  [1]: #Installation
  [2]: #Mise à jour
  [3]: #CLI
  [4]: http://www.zupmage.eu/i/KgO87SJzpu.png
