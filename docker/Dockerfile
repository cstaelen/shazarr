FROM ghcr.io/linuxserver/baseimage-alpine:3.18
WORKDIR /home/app/standalone

ENV SHELL bash
ENV PATH "$PATH:/tmp/.pnpm-store"
ENV PNPM_HOME /tmp/.pnpm-store
ARG NODE_ENV
ENV NODE_ENV="${NODE_ENV}"
ENV PYTHONUNBUFFERED=1

RUN apk update && apk upgrade

# https://github.com/pnpm/pnpm/issues/7024
RUN touch "$HOME/.npmrc"
RUN echo "package-import-method=clone-or-copy" > "$HOME/.npmrc"

RUN apk add git build-base curl npm nodejs
RUN npm install -g pnpm
RUN pnpm setup
RUN pnpm config set store-dir /tmp/.pnpm-store
RUN pnpm add -g npx dotenv

RUN echo "*** install Shazamio ***"
RUN apk add --update --no-cache python3 py3-pip && ln -sf python3 /usr/bin/python
RUN python3 -m pip install --no-cache --upgrade pip wheel setuptools chardet

RUN apk add --update --no-cache ffmpeg
RUN python3 -m pip install --no-cache --upgrade shazamio

EXPOSE 12358
EXPOSE 8585

ENTRYPOINT ["sh", "/home/app/standalone/docker/run-dev.sh"]
