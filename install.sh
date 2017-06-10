#!/bin/bash
cd "$(dirname "$0")"
mkdir server/images/full && echo "Made full image directory"
mkdir server/images/thumbs && echo "Made thumbnail directory"
printf "module.exports = {\nredisPassword: '',\nredisHost: '',\nserverPort: 9001\n};\n" > server/config.js && echo "Made server/config.js"
yarn
if gm > /dev/null 2>&1  ; then
    echo "You have GraphicksMagick installed (i think)"
else
    echo "You need to install GraphicksMagick and add it to PATH"
fi