#!/bin/bash

mkdir -p siteJS

echo "bundling:"
npx esbuild js/game.js --bundle --platform=browser --outfile=siteJS/temp_bundle.js

echo "obfuscating:"
npx javascript-obfuscator siteJS/temp_bundle.js \
    --output siteJS/game.js \
    --compact true \
    --control-flow-flattening true \
    --control-flow-flattening-threshold 1 \
    --string-array true \
    --string-array-encoding 'base64' \
    --string-array-threshold 1 \
    --string-array-rotate true \
    --string-array-shuffle true \
    --transform-object-keys true \
    --unicode-escape-sequence true \
    --debug-protection true

rm siteJS/temp_bundle.js

echo "Done"
