FROM alpine:3.18
WORKDIR /home/app/standalone

ENV SHELL bash
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
ENV PYTHONUNBUFFERED=1

RUN apk update && apk upgrade
RUN apk add git build-base curl npm nodejs

RUN echo "*** install Shazamio ***"
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools chardet

RUN apk add --update --no-cache ffmpeg
RUN python3 -m pip install --no-cache --upgrade shazamio

RUN npm install -g concurrently nodemon npx typescript

ENV API_PORT=12358
ENV REACT_APP_HOSTNAME="http://0.0.0.0"
ENV REACT_APP_API_PORT="$API_PORT"

EXPOSE 12358
EXPOSE 35813

ENTRYPOINT ["sh", "/home/app/standalone/docker/run-dev.sh"]
