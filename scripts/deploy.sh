#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../app && pwd)"

cd $appdir
echo "Optimizing javascripts"

if [ ! -f "$appdir/public/views" ]
then
	ln -sf "$appdir/themes/$1/public/views" "$appdir/public/views"
fi

if [ ! -f "$appdir/public/js" ]
then
	ln -sf "$appdir/themes/$1/public/js" "$appdir/public/js"
fi


cd public/javascripts
node ../r.js -o app.build.js

cp require-jquery.js ../js/

echo "Optimizing css"

cd "$appdir/themes/$1/public/css"
node ../../../../public/r.js -o build.js

exit 0