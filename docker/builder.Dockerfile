FROM alpine:3.18 AS dependencies

# update and install dependency
RUN apk update && apk upgrade
RUN apk add git build-base npm nodejs

# DEPENDENCIES
WORKDIR /home/app
ENV SHELL bash
ENV API_PORT=12358
ENV REACT_APP_HOSTNAME="http://0.0.0.0"
ENV REACT_APP_API_PORT="$API_PORT"

COPY app/package.json ./app/package.json
COPY api/package.json ./api/package.json
COPY docker/ ./docker

RUN npm add -g npx dotenv
RUN npm install --prefix ./app
RUN npm install --prefix ./api

# BUILDER

FROM alpine:3.18 AS builder
WORKDIR /home/app

ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
ENV SHELL bash
ENV NEXT_TELEMETRY_DISABLED 1
ENV API_PORT=12358
ENV REACT_APP_HOSTNAME="http://0.0.0.0"
ENV REACT_APP_API_PORT="$API_PORT"

COPY ./app /home/app/app
COPY ./api /home/app/api

COPY . .
COPY --from=dependencies /home/app/app/node_modules ./app/node_modules
COPY --from=dependencies /home/app/api/node_modules ./api/node_modules

RUN apk add npm nodejs
RUN npm install -g npx dotenv

RUN npm run build --prefix ./api 
RUN npm run build --prefix ./app 

# RUNNER

FROM alpine:3.18 AS runner
WORKDIR /home/app

ENV NEXT_TELEMETRY_DISABLED 1
ENV SHELL bash
ENV PYTHONUNBUFFERED=1

ENV API_PORT=12358
ENV REACT_APP_HOSTNAME="http://0.0.0.0"
ENV REACT_APP_API_PORT="$API_PORT"

RUN apk add --update --no-cache curl nodejs npm
RUN npm install -g concurrently serve
RUN npm install express dotenv

RUN echo "*** install Shazamio ***"
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools chardet

RUN apk add --update --no-cache ffmpeg
RUN python3 -m pip install --no-cache --upgrade shazamio

COPY --from=builder /home/app/docker /home/app/standalone/docker

COPY --from=builder /home/app/app/build /home/app/standalone/app/build

COPY --from=builder /home/app/api/dist /home/app/standalone/api/dist
COPY --from=builder /home/app/api/scripts /home/app/standalone/api/scripts

WORKDIR /home/app/standalone

EXPOSE 12358
EXPOSE 35813

ENTRYPOINT ["sh", "/home/app/standalone/docker/run-prod.sh"]
