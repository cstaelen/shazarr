# Shazarr - ShazamIO web UI
This project provides a mobile app to shazam songs with [Lidarr](https://github.com/linuxserver/docker-lidarr) and [Tidarr](https://github.com/cstaelen/tidarr) integration.

<img src="https://github.com/cstaelen/docker-shazarr/blob/1fd8ad85b17ada9726f6119dd1791ed7faef4f56/.github/screenshot.png" width="300"/>

## Features
- Audio microphone capture and song recognition using python [ShazamIO](https://github.com/dotX12/ShazamIO).
- Download queried album to [Lidarr](https://github.com/linuxserver/docker-lidarr)
- Download queried song/album with [Tidarr](https://github.com/cstaelen/tidarr)
- Listen on streaming app Spotify, Apple Music and Deezer
- Show lyrics
- Offline song record and recognize later (if API is not accessible)
- Record history

## Get started

In order to use it you will have to install :
- API: Docker image to query Shazam services
- Client : Android mobile app APK (iOS coming soon)

Proceed:
1. Pull and up docker image `cstaelen/shazarr-api`
2. Go to url on `http://<docker-host>:12358` to see qrcode
3. Download APK by scanning qrcode
4. Fill Shazarr API URL in app

### 1. Docker image
Using `docker-compose.yml`:
```yaml
version: "3"
services:
  shazarr-api:
    image: cstaelen/shazarr-api:latest
    ports:
      - 12358:12358
    environment:
      - LIDARR_API_KEY=123456789abcdef
      - LIDARR_URL=http://<lidarr-web-ui-url>
      - LIDARR_LIBRARY_PATH=/music/
      - TIDARR_URL=http://<tidarr-web-ui-url>
```

Using `docker run`:
```shell
docker run \
    --rm \
    --name shazarr-api \
    --platform=linux/amd64 \
    -p 12358:12358 \
    -e LIDARR_API_KEY=123456789abcdef \
    -e LIDARR_URL=http://<lidarr-web-ui-url> \
    -e LIDARR_LIBRARY_PATH=/music/ \
    -e TIDARR_URL=http://<tidarr-web-ui-url>
```

You will find your lidarr music path in web ui :

<img src="https://github.com/cstaelen/docker-shazarr/blob/c30c348adedabb62e760a344a5347e90cc1b1056/.github/lidarr-path.png" width="500"/>


### 2. Mobile App

#### Android

APK available [here](https://github.com/cstaelen/docker-shazarr/raw/main/outputs/shazarr-app.apk)

#### iOS (coming soon)

## Roadmap
- [x] API using docker image
- [x] Android app
- [x] Record history: access last shazamed songs
- [x] Offline record: record without API access, recognize song later 
- [ ] iOS app

## Development
- Docker image for API services (ExpressJS + python)
- Android mobile app (ReactJS + Ionic/Capacitor)

### Watch mode
Start api in watch mode :
```
make api/dev
```
Start android front in watch mode :
```
make android/dev
```
UI available on port 8100 http://localhost:8100/

### Build
Build for android studio:
```
make android/build
```
Build API docker image:
```
make api/build
```

## Credits
- Big thanks to the [ShazamIO](https://github.com/dotX12/ShazamIO) team for the awesome works 👏💪🙏
- UI inspiration : https://github.com/codrops/ShazamButtonEffect
- See Lidarr project: https://github.com/linuxserver/docker-lidarr 
- See Tidarr project: https://github.com/cstaelen/tidarr

