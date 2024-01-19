IMAGE=cstaelen/shazarr
IMAGE_API=cstaelen/shazarr-api
VERSION=0.0.1
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

app/dev:
	npm run android:serve --prefix ./app

android/build:
	npm run android:build --prefix ./app
android/live:
	npm run android:live --prefix ./app

ios/build:
	npm run ios:build --prefix ./app	
ios/live:
	npm run ios:live --prefix ./app	
