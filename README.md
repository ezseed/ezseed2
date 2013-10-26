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
git checkout rc1-b #passe sur la béta
```

Ensuite exécutez autoInstall, le script se chargera de bouger le site dans /var/www/ezseed2

```
chmod +x ./autoInstall.sh && ./autoInstall.sh #will install dependecies nodejs, nginx
./ezseed install
```

