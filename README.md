[![GitHub Stars](https://img.shields.io/github/stars/cstaelen/shazarr-app.svg?color=013b51&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/shazarr-app)
[![GitHub Release](https://img.shields.io/github/release-date/cstaelen/shazarr-app?color=013b51&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/shazarr-app/releases)
[![GitHub Release](https://img.shields.io/github/release/cstaelen/shazarr-app?color=013b51&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/shazarr-app/releases)
![Playwright CI](https://img.shields.io/github/actions/workflow/status/cstaelen/shazarr-app/playwright.yml?label=Playwright%20CI&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
[![Download APK](https://img.shields.io/github/downloads/cstaelen/shazarr-app/latest/shazarr-signed.apk?color=a2c438&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=android)](https://github.com/cstaelen/shazarr/releases/latest/download/shazarr-signed.apk)

# Shazarr - Unofficial Shazam mobile app web UI
Shazarr project is a mobile app (android, ios) providing Shazam song recognition service with [Lidarr](https://github.com/linuxserver/docker-lidarr) and [Tidarr](https://github.com/cstaelen/tidarr) integration.


## Features
- Audio microphone capture and song recognition using reverse Shazam API with [node-shazam-api](https://github.com/asivery/node-shazam-api).
- Download discovered album with [Lidarr](https://github.com/linuxserver/docker-lidarr)
- Download discovered song/album with [Tidarr](https://github.com/cstaelen/tidarr)
- Add custom search service
- Listen on streaming app Spotify, Apple Music and Deezer
- Show lyrics
- Offline mode : record and recognize later (if network down)
- Records history
- Privacy: No login, no tracking, no API key

## Screenshots

<img src="https://github.com/cstaelen/docker-shazarr/blob/b436440b628ff5c8a0925a57e63e6659b1bf273e/.github/screenshot.jpg" />

## Get started

- **Android**: ✅ APK Download APK [here](https://github.com/cstaelen/shazarr/releases/latest/download/shazarr-signed.apk)
- **iOS**: ⚠️ build app from Xcode ONLY (needs xcode and paired device)

Get last release  :

[<img src="https://github.com/cstaelen/shazarr-app/blob/4465b4d6532a4ade3a970be2b9ade3705706e50f/.github/qr-release.png" width="100" />](https://github.com/cstaelen/shazarr-app/releases/latest)

### App options (fit with your data)

- **Lidarr URL** : `http://<lidarr-web-ui-url>`
- **Tidarr URL**: `http://<tidarr-web-ui-url>`
- **Custom service URL**: `http://<service-url>?query=`
- **Custom service name**: `My custom music service`

#### iOS ( /!\ source build only )
Requirements: `npm`, `xcode`.

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
- [x] Android app
- [x] Record history: access last shazamed songs
- [x] Offline record: record without API access, recognize song later
- [x] Update notifications 
- [ ] iOS app: find a way to distribute packaged app without using app store and without have to clone and build it

## Development
- Android + iOS mobile app (ReactJS + Ionic/Capacitor)

### Watch mode
Start app in watch mode :
```sh
npm run start # Listening on http://localhost:3000/
npm run android:live # Listening on http://localhost:8100/ + emulate
npm run ios:live # Listening on http://localhost:8100/ + emulate
```

### Build
Build APK with Android studio:
```
npm run android:build
```
Build ios app with Xcode:
```
make ios/build
```

## Credits
- Big thanks to the [node-shazam-api](https://github.com/asivery/node-shazam-api) team for the awesome works and reactivness 👏💪🙏
- UI inspiration : https://github.com/codrops/ShazamButtonEffect
- See Lidarr project: https://github.com/linuxserver/docker-lidarr 
- See Tidarr project: https://github.com/cstaelen/tidarr

