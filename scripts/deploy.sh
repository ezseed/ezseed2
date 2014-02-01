DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../app && pwd)"

cd $appdir
echo $(pwd)

if [ ! -e "$appdir/public/views" -a ! -h "$appdir/public/views" ]
then
	ln -sf "$appdir/themes/$1/public/views" "$appdir/public/views"
fi

if [ ! -e "$appdir/public/js" -a ! -h "$appdir/public/js" ]
then
	ln -sf "$appdir/themes/$1/public/js" "$appdir/public/js"
fi


cd public/javascripts
node ../r.js -o app.build.js

cp require-jquery.js ../js/

exit 0