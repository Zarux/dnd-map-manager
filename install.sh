#!/bin/bash
cd "${0%/*}"
mkdir images/full
mkdir images/thumbs
yarn
if gm > /dev/null 2>&1  ; then
    echo "You have GraphicksMagick installed (i think)"
else
    echo "You need to install GraphicksMagick, or add it to PATH"
fi