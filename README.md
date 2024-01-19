# Shazarr - ShazamIO web UI
This project provides a mobile app to shazam songs with [Lidarr](https://github.com/linuxserver/docker-lidarr) and [Tidarr](https://github.com/cstaelen/tidarr) integration.

<img src="https://github.com/cstaelen/docker-shazarr/blob/b436440b628ff5c8a0925a57e63e6659b1bf273e/.github/screenshot.jpg" />

## Features
- Audio microphone capture and song recognition using python [ShazamIO](https://github.com/dotX12/ShazamIO).
- Download discovered album to [Lidarr](https://github.com/linuxserver/docker-lidarr)
- Download discovered song/album with [Tidarr](https://github.com/cstaelen/tidarr)
- Listen on streaming app Spotify, Apple Music and Deezer
- Show lyrics
- Offline song record and recognize later (if API is not accessible)
- Record history

## Get started

In order to use it you will have to install:
- **API** : Docker image to query Shazam services
- **Client apps**:
  - **android**: ✅ APK download
  - **ios**: ⚠️ build app from Xcode ONLY (needs xcode and paired device)

Summary:
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


API should be reachable at `http://<docker_machine_ip>:12358`.

### 2. Mobile App

#### Android
Downloads:
- by scanning QR code displayed on `http://<docker_shazarr>:12358`
- APK available [here](https://github.com/cstaelen/docker-shazarr/raw/main/outputs/shazarr-app.apk)

#### iOS (source build)
Requirements: `npm`, `ionic`, `xcode`.

1. Git clone project first
2. in project folder run:
```
cd docker-shazarr
npm run ios:build
```
XCode should open project.

3. [Pair your iOS device](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device/#Connect-real-devices-to-your-Mac)
4. build the app.
5. After few secs, it should be installed on your ipad/iphone.

## Roadmap
- [x] API using docker image
- [x] Android app
- [x] Record history: access last shazamed songs
- [x] Offline record: record without API access, recognize song later 
- [-] iOS app: find a way to distribute packaged app without using app store and without have to build it

## Development
- Docker image for API services (ExpressJS + python)
- Android mobile app (ReactJS + Ionic/Capacitor)

### Watch mode
Start api in watch mode :
```
make api/dev
```
UI available on port 8100 http://localhost:12358/

Start app in watch mode :
```
make app/dev
```
UI available on port 8100 http://localhost:8100/

### Build
Build APK with Android studio:
```
make android/build
```
Build ios app with Xcode:
```
make ios/build
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

