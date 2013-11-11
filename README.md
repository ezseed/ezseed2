```
                                ___  ___  ___  ___  ___  ___     _  _  ___ 
                               (  _)(_  )/ __)(  _)(  _)(   \   ( )( )(__ \
                                ) _) / / \__ \ ) _) ) _) ) ) )   \\// / __/
                               (___)(___)(___/(___)(___)(___/    (__) \___)
```

#Installation
```
apt-get install git-core
```

Remplacez "user" par votre nom d'utilisateur sur Github !
```
git clone https://user@github.com/soyuka/ezseed2/
```
```
cd ezseed2
#passe sur la béta
git checkout rc1-b
```

Ensuite exécutez autoInstall, le script se chargera de bouger le site dans /var/www/ezseed2

```
#installation de node.js et mongodb
chmod +x ./autoInstall.sh && ./autoInstall.sh
cd /var/www/ezseed2
./ezseed install -f
#l'option -f fais en sorte qu'il ne s'arrête pas sur une erreur
```

Pour les options de pm2 voir sur le repo : https://github.com/Unitech/pm2
```
pm2 start ezseed.json
pm2 list
pm2 logs
```

Les logs de l'application sont dans `/var/log/ezseed/`

#Mise à jour
```
git pull && pm2 restart ezseed
```

#Divers

Attention, MongoDB n'arrive pas se lancer sur un noyau OVH, veuillez installer le noyau natif ou changer de noyau.
