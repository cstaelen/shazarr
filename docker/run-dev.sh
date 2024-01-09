#!/usr/bin/env sh

npm install --prefix ./api
npm install --prefix ./app
concurrently -n api,api,front "API_PORT=12358 npx tsc --project api/tsconfig.json --watch" "nodemon -q api/dist/index.js" "PORT=35813 npm run start --prefix ./app"