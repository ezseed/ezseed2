# Still BETA ! Still a lot [TODO](https://github.com/soyuka/ezseed2/wiki/TODO-LIST)

## Installation
```
apt-get install git-core
git clone https://github.com/soyuka/ezseed2/
cd ezseed2
```

Ensuite exécutez autoInstall (installation de Nodejs et mongodb Debian Wheezy uniquement !), le script se chargera de bouger le site dans /var/www/ezseed2.

```
chmod +x ./autoInstall.sh && ./autoInstall.sh
# puis configurez le tout :
cd /var/www/ezseed2
./ezseed config
```
Sur les kimsufi, si vous avez une erreur du genre `Error : failed to connect to [localhost:27017]`, [voyez ici](https://github.com/soyuka/ezseed2/wiki/Erreur-MongoDB-chez-OVH-%28&Kimsufi%29).

## Lancement
```
pm2 start ezseed.json
```

Les logs de l'application sont dans `/var/log/ezseed/`

## Mise à jour
```
git pull && pm2 restart all
```

## Détails

### Licence

[![Licence Creative Commons](http://i.creativecommons.org/l/by-nc-sa/3.0/80x15.png)](http://creativecommons.org/licenses/by-nc-sa/3.0/deed.fr)

### EzSeed (shell)
![Ezseed shell](http://www.zupmage.eu/i/SoDnyJbizD.png)

Ce shell vous permet d'installer rutorrent, transmission ou encore d'ajouter, de supprimer un utilisateur. Pour connaître la syntaxe il suffit de taper `./ezseed -h` pour avoir liste des commandes et ses options.

### Rutorrent
Pour rutorrent, il faut configurer autotools pour qu'il déplace les torrents une fois terminés :

![Autotools configuration](http://www.zupmage.eu/i/hpRER83cvG.png)

## Liens

* [Wiki](https://github.com/soyuka/ezseed2/wiki)
* [Bugs](https://github.com/soyuka/ezseed2/issues)
