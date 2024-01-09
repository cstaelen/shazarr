#!/usr/bin/env sh

concurrently -n front,api "PORT=35813 serve -s ./app/build" "API_PORT=12358 node ./api/dist/index.js"