## Installation
```
apt-get install git-core
git clone https://user@github.com/soyuka/ezseed2/
cd ezseed2
```

Ensuite exécutez autoInstall, le script se chargera de bouger le site dans /var/www/ezseed2.

```
chmod +x ./autoInstall.sh && ./autoInstall.sh
# puis configurez le tout :
cd /var/www/ezseed2
./ezseed install
```
Sur les kimsufi, si vous avez une erreur du genre `Unable to connect to localhost:27127`, [voyez ici](https://github.com/soyuka/ezseed2/wiki/Kimsufi-Mongodb-erreur).

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

### EzSeed (shell)
![Ezseed shell](http://www.zupmage.eu/i/bYfDM1Ur0y.png)

Ce shell vous permet d'installer rutorrent, transmission ou encore d'ajouter, de supprimer un utilisateur. Pour connaître la syntaxe il suffit de taper `./ezseed -h` pour avoir liste des commandes et ses options.

### Rutorrent
Pour rutorrent, il faut configurer autotools pour qu'il déplace les torrents une fois terminés :

![Autotools configuration](http://www.zupmage.eu/i/hpRER83cvG.png)

## Liens
[Wiki](https://github.com/soyuka/ezseed2/wiki)
[Bugs](https://github.com/soyuka/ezseed2/issues)
