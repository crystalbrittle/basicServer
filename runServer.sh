#!/bin/bash

# custom server
## echo "== == == == == == == == =="
## echo "basicServer on port 8765 ..."
cd $(dirname $BASH_SOURCE)
node basicServer.js 44440
##node expressServer.js

# npm http-server
## echo "http-server on port 8765"
## cd $(dirname $BASH_SOURCE)
## http-server -p 8765 &
## ##python -m SimpleHTTPServer 8765 &


#
# run as https
# requires a cert made by:
# > openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
#
#http-server -p 8766 -S -C cert.pem &