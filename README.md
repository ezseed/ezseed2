```
 ___  ___  ___  ___  ___  ___     _  _  ___ 
(  _)(_  )/ __)(  _)(  _)(   \   ( )( )(__ \
 ) _) / / \__ \ ) _) ) _) ) ) )   \\// / __/
(___)(___)(___/(___)(___)(___/    (__) \___)

```

#Installation
```
apt-get install git-core
git clone https://user@github.com/soyuka/ezseed2/
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

