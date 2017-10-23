#!/bin/bash
if ! hash electron-packager 2>/dev/null; then
  RED='\033[0;31m'
  NC='\033[0m'
  echo "${RED}Error${NC}: you need to npm install electron-packager. Aborting."
  exit 1
fi

if [ "$#" -ne 3 ]; then
  echo -e "Usage: ./script/build.sh <platform> <arch> <version>"
  echo -e "	platform:	darwin, linux, win32"
  echo -e "	arch:		ia32, x64"
  echo -e " version: x.x.x"
  exit 1
fi

PLATFORM=$1
ARCH=$2
VERSION=$3

echo "Start packaging for $PLATFORM $ARCH."

APP_NAME="新生大学"

ignore_list="\.idea|.*\.md|.*\.yml|.*\.dll|node_modules"

electron-packager ./app "${APP_NAME}" \
                  --platform=$PLATFORM --arch=$ARCH \
                  --version=1.3.3 --app-version=${VERSION} \
                  --icon=resources/icon.icns --overwrite \
                  --out=./dist-osx --ignore=${ignore_list}

if [ $? -eq 0 ]; then
  echo -e "$(tput setaf 2)Packaging for $PLATFORM $ARCH succeeded.$(tput sgr0)\n"
  appdmg scripts/dmg.json dist-osx/"${APP_NAME}-${PLATFORM}-${ARCH}-v${VERSION}".dmg
  if [ $? -eq 0 ]; then
    echo -e "$(tput setaf 2)Packaging for ${APP_NAME}-${PLATFORM}-${ARCH}-v${VERSION}.dmg succeeded.$(tput sgr0)\n"
    rm -rf dist-osx/"${APP_NAME}-${PLATFORM}-${ARCH}"
  fi
fi
