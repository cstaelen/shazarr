[![GitHub Stars](https://img.shields.io/github/stars/cstaelen/shazarr-app.svg?color=013b51&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/shazarr-app)
[![GitHub Release](https://img.shields.io/github/release-date/cstaelen/shazarr-app?color=013b51&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/shazarr-app/releases)
[![GitHub Release](https://img.shields.io/github/release/cstaelen/shazarr-app?color=013b51&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)](https://github.com/cstaelen/shazarr-app/releases)
![Playwright CI](https://img.shields.io/github/actions/workflow/status/cstaelen/shazarr-app/playwright.yml?label=Playwright%20CI&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=github)
[![Download APK](https://img.shields.io/github/downloads/cstaelen/shazarr-app/latest/shazarr-signed.apk?color=a2c438&labelColor=555555&logoColor=ffffff&style=for-the-badge&logo=android)](https://github.com/cstaelen/shazarr/releases/latest/download/shazarr-signed.apk)
<a href="https://www.buymeacoffee.com/clst" target="_blank" title="Buy Me A Coffee"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 28px !important;width: 110px !important;" ></a>

# Shazarr - Unofficial Shazam mobile app web UI

Shazarr is a mobile app (Android, iOS) providing Shazam song recognition with deep integration to music automation services. The app allows you to identify songs and automatically add them to your media library through various services.

<img src="https://github.com/cstaelen/docker-shazarr/blob/b436440b628ff5c8a0925a57e63e6659b1bf273e/.github/screenshot.jpg" />

## Features

### Core
- Audio microphone capture and song recognition using reverse Shazam API with [node-shazam-api](https://github.com/asivery/node-shazam-api)
- Listen on streaming apps: Spotify, Apple Music and Deezer
- Show lyrics for recognized tracks
- Records history: access your last recognized songs
- Offline mode: record without API access, recognize later when network is restored
- Privacy: No login, no tracking, no mandatory API key

### Music Services Integration
- **Lidarr**: Auto-search and download discovered albums via API
- **Tidarr**: Search Tidal content in-app, queue tracks or full album downloads, add to Tidal favorites
- **SoulSync**: Add to wishlist to trigger automatic download via API
- **Custom services**: Add any external search service with custom URL patterns

## Get started

- **Android**: ✅ Download APK [here](https://github.com/cstaelen/shazarr/releases/latest/download/shazarr-signed.apk)
- **iOS**: ⚠️ Build from Xcode only (requires Xcode and paired device)

Get last release  :

[<img src="https://github.com/cstaelen/shazarr-app/blob/4465b4d6532a4ade3a970be2b9ade3705706e50f/.github/qr-release.png" width="100" />](https://github.com/cstaelen/shazarr-app/releases/latest)

## Configuration

Configure Shazarr to connect with your music automation services:

### Services
- **Lidarr URL**: `http://<lidarr-web-ui-url>` (optional API key for auto-search, falls back to browser)
- **Tidarr URL**: `http://<tidarr-web-ui-url>` (optional API key for auto-search)

### SoulSync
- **SoulSync URL**: `http://<soulsync-ip>:8008`
- **SoulSync API Key**: `your-api-key` (generated from SoulSync settings: Settings > API)
- **SoulSync Profile ID**: `1` (optional, defaults to profile 1)

> **Note**: When configured with API key, Shazarr will automatically search and add tracks/albums to your SoulSync wishlist, triggering automatic downloads based on your SoulSync configuration.

### Custom Service
- **Custom service URL**: `http://<service-url>?query=` (e.g., `http://my-service.local/search?q=`)
- **Custom service name**: Display name for the button (e.g., "My Music Service")

---

## iOS (Build from source only)

> ⚠️ iOS app must be built from Xcode. There is currently no pre-built binary distribution.

**Requirements**: `pnpm`, Xcode, paired iOS device

1. Clone the project
2. In project folder, run:
   ```sh
   pnpm run ios:build
   ```
3. Xcode will open the project
4. [Pair your iOS device](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device/#Connect-real-devices-to-your-Mac)
5. Build the app
6. After a few seconds, the app will be installed on your iPad/iPhone

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
pnpm run start # Listening on http://localhost:3000/
pnpm run android:live # Listening on http://localhost:8100/ + emulate
pnpm run ios:live # Listening on http://localhost:8100/ + emulate
```

### Build
Build APK with Android studio:
```
pnpm run android:build
```
Build ios app with Xcode:
```
make ios/build
```

## Support

If you like this project you can support here:

<a href="https://www.buymeacoffee.com/clst" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40" width="160"></a>

## Credits
- Big thanks to the [node-shazam-api](https://github.com/asivery/node-shazam-api) team for the awesome works and reactivness 👏💪🙏
- UI inspiration : https://github.com/codrops/ShazamButtonEffect
- See Lidarr project: https://github.com/linuxserver/docker-lidarr 
- See Tidarr project: https://github.com/cstaelen/tidarr
- See SoulSync project: https://github.com/Nezreka/SoulSync

