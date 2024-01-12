IMAGE=cstaelen/shazarr
IMAGE_API=cstaelen/shazarr-api
VERSION=0.0.1
DOCKERFILE=./docker/builder.Dockerfile
DOCKERFILE_API=./docker/api.Dockerfile

api/dev:
	docker compose up --build

api/build:
	docker build --platform linux/amd64 -f ${DOCKERFILE_API} -t ${IMAGE_API}:${VERSION} -t ${IMAGE_API}:latest .

api/run:
	docker run \
		--rm \
		--name shazarr \
		--platform=linux/amd64 \
		-p 12358:12358 \
	${IMAGE_API}:${VERSION}

android/dev:
	npm run android:serve --prefix ./app

android/build:
	npm run android:build --prefix ./app

build-docker-legacy:
	docker build --platform linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} .

run-docker-legacy:
	docker run \
		--rm \
		--name shazarr \
		--platform=linux/amd64 \
		-p 12358:12358 \
		-p 35813:35813 \
	${IMAGE}:${VERSION}