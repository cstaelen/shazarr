IMAGE=cstaelen/shazarr
IMAGE_API=cstaelen/shazarr-api
VERSION=0.0.1
DOCKERFILE=./docker/builder.Dockerfile
DOCKERFILE_API=./docker/api.Dockerfile

dev:
	docker compose up --build

build-docker:
	docker build --platform linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} .

build-docker-api:
	docker build --platform linux/amd64 -f ${DOCKERFILE_API} -t ${IMAGE_API}:${VERSION} .

run-docker:
	docker run \
		--rm \
		--name shazarr \
		--platform=linux/amd64 \
		-p 12358:12358 \
		-p 35813:35813 \
	${IMAGE}:${VERSION}

run-docker-api:
	docker run \
		--rm \
		--name shazarr \
		--platform=linux/amd64 \
		-p 12358:12358 \
	${IMAGE_API}:${VERSION}