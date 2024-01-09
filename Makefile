IMAGE=cstaelen/shazarr
VERSION=0.0.1
DOCKERFILE=./docker/builder.Dockerfile

dev:
	docker compose up --build

build-docker:
	docker build --platform linux/amd64 -f ${DOCKERFILE} -t ${IMAGE}:${VERSION} .

run-docker:
	docker run \
		--rm \
		--name shazarr \
		--platform=linux/amd64 \
		-p 12358:12358 \
		-p 35813:35813 \
	${IMAGE}:${VERSION}