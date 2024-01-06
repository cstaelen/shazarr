IMAGE=cstaelen/shazarr
VERSION_AMD=0.0.1-amd64
VERSION_ARM=0.0.1-armv7
DOCKERFILE=./docker/builder.Dockerfile

dev:
	docker compose up --build

build-docker-arm:
	docker build --platform linux/arm64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION_AMD} .

build-docker-amd:
	docker build --platform linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION_ARM} .

run-docker:
	docker run \
		--rm \
		--name shazarr \
		--platform=linux/amd64 \
		-p 12358:12358 \
	${IMAGE}