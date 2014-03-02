#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../app && pwd)"

cd $appdir
echo "Optimizing javascripts"

if [ -d "$appdir/public/views" ]
then
	rm -r "$appdir/public/js"

fi

ln -sf "$appdir/themes/$1/public/views" "$appdir/public/views"

if [ -d "$appdir/public/js" ]
then
	rm -r "$appdir/public/js"
fi

ln -sf "$appdir/themes/$1/public/js" "$appdir/public/js"

cd public/javascripts
node ../r.js -o app.build.js

cp require-jquery.js ../js/

echo "Optimizing css"

cd "$appdir/themes/$1/public/css"
node ../../../../public/r.js -o build.js

exit 0