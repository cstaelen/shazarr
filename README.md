# Shazarr - ShazamIO web UI
Use mobile app to shazam songs
This prototype app is a Shazam companion with Lidarr and Tidarr 

## Features
- Docker image for ShazamIO services (ExpressJS)
- Android mobile app (ReactJS+Ionic)
- 5sec audio capture and song recognition using python ShazamIO.
- Download result with Lidarr or Tidarr
- Listen on streaming app like Spotify
- Show lyrics

## Install
This is a two steps install :
1. Pull and up docker image `cstaelen/shazarr-api`
2. Go to url on `http://<docker-host>:12358`
3. Download APK by scanning qrcode
4. Fill Shazarr API URL in app

### 1. Docker image


### 2. Mobile App

#### Android

#### iOS (coming soon)

## Roadmap
- [x] API usgin docker image
- [x] Android app
- [ ] iOS app
- [ ] Offline record and sync later
- [ ] Shazam history 

## Dev

## Credits
- ShazamIO