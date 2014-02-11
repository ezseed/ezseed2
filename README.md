Les noms utilisateurs doivent être en minuscule ! <strike>UserName</strike> => username

## Installation

```
apt-get install git-core
git clone https://github.com/soyuka/ezseed2/
cd ezseed2
```

### Automatique

Ensuite exécutez autoInstall (installation de Nodejs et mongodb Debian Wheezy uniquement !), le script se chargera de bouger le site dans /var/www/ezseed2.

```
chmod +x ./autoInstall.sh && ./autoInstall.sh
# puis configurez le tout :
ezseed install
```
Sur les kimsufi, si vous avez une erreur du genre `Error : failed to connect to [localhost:27017]`, [voyez ici](https://github.com/soyuka/ezseed2/wiki/Erreur-MongoDB-chez-OVH-%28&Kimsufi%29).

### Manuelle

 - Installation de [nodejs et mongodb](https://github.com/soyuka/ezseed2/wiki/Installation-manuelle-des-d%C3%A9pendances-sous-Debian)
 - Les paquets suivants : whois nginx php5-fpm unzip zip
 - `mkdir -p /var/log/ezseed`
 - `npm install pm2 -g`
 - `npm install && npm link`
 - `ezseed install` /!\ peut effacer votre configuration nginx par [nginx.conf](https://github.com/soyuka/ezseed2/blob/master/app/scripts/nginx.conf)

## Lancement
```
ezseed start
```

Les logs de l'application sont dans `/var/log/ezseed/`

## Mise à jour
```
ezseed update
```

## Mise à jour depuis < v2.1.11-beta
TODO

## Mise à jour depuis < v2.1.10-beta

Pour configurer le reboot :

`ezseed config -uns` 
`Ctrl+C` pour annuler une fois l'étape terminée


## Détails
Pour plus d'informations sur le script :
`ezseed -h`

### Licence

[![Licence Creative Commons](http://i.creativecommons.org/l/by-nc-sa/3.0/80x15.png)](http://creativecommons.org/licenses/by-nc-sa/3.0/deed.fr)

### EzSeed (shell)
![Ezseed shell](http://www.zupmage.eu/i/SoDnyJbizD.png)

Ce shell vous permet d'installer rutorrent, transmission ou encore d'ajouter, de supprimer un utilisateur. Pour connaître la syntaxe il suffit de taper `./ezseed -h` pour avoir liste des commandes et ses options.

### Rutorrent
Pour rutorrent, il faut configurer autotools pour qu'il déplace les torrents une fois terminés :

![Autotools configuration](http://www.zupmage.eu/i/hpRER83cvG.png)

## Liens

* [Todo](https://github.com/soyuka/ezseed2/wiki/TODO-LIST)
* [Wiki](https://github.com/soyuka/ezseed2/wiki)
* [Bugs](https://github.com/soyuka/ezseed2/issues)
