#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
appdir="$(cd $DIR && cd ../ && pwd)"

#Killing running script
pm2 kill

cd $appdir

if [ -d "$appdir/app/scripts" ]
	mv "$appdir/app/scripts" "$appdir/scripts"

echo "Getting changes from github"
# Clean the directory, but don't remove files specified in .gitignore.
git clean -d -f
# Reset the files
git reset --hard HEAD
# Get the changes
git pull -f

echo "Installing dependecies"
npm i pm2@latest -g
npm cache clear -f
npm i
npm link

echo "Deploying app"
ezseed deploy

echo "Ezseed is up to date starting"
pm2 start "$appdir/ezseed.json"