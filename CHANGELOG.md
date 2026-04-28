# Changelog
Shazarr notable changes.

[Keep a Changelog](http://keepachangelog.com/en/1.0.0/) format.

## 📦 0.2.1
### 🐛 Fixed
* Fix Tidarr network error

## 📦 0.2.0
### 🚀 Added
* Lidarr button now auto seearch if API key is set #241
* Tidarr search is now integrated in the app if API key is set
### 🖍 Changed
* Gradle version is synched with the github tag in ci #227
### 🧹 Renovate
* Dependencies update

## 📦 0.1.6
### 🐛 Changed
* Use github tag as project version

## 📦 0.1.5
### 🐛 Fixed
* Fix issue with android navigation button overlap in history

## 📦 0.1.4
### 🐛 Fixed
* Fix issue with android navigation button overlap
### 🧹 Renovate
* Update other node dependencies

## 📦 0.1.3
### 🐛 Fixed
* Update tidarr search url according version 0.3.0
### 🧹 Renovate
* Update `Android SDK` from version 34 to 35
* Move from `npm`to `pnpm`
* Update other node dependencies

## 📦 0.1.2
### 🧹 Renovate
* Update `capacitor` from version 6 to 7
* Update `react` from version 18 to 19
* Update other node dependencies
* Move from `react-scripts`to `vite`

## 📦 0.1.1
### 🐛 Fixed
* Fix application crash when track result does not have album information
### 🧹 Renovate
* Add Matomo cookie free and anonimyzed data


## 📦 0.1.0
### 🖍 Changed
* Change notification message to specify prerelease ou release update status
### 🐛 Fixed
* Fix issue with track image not updating when picking an history item
* Fix readme apk download link
### 🧹 Renovate
* Update node deps
* Migrate capacitor from v5 to v6
* Typescript 5
* Eslint 9

## 📦 0.0.9
### 🚀 Added
* Playwright testing
* Github CI Eslint + testing
### 🐛 Fixed
* Fix history order issue on delete / recognize offline record

## 📦 0.0.8
### 🐛 Fixed
* Fix missing "not found" message

## 📦 0.0.7
### 🖍 Changed
* Update `shazam-api` node package to 0.2.0
* Remove git patch package and clean code
### 🐛 Fixed
* Fix datetime issue on android

## 📦 0.0.6
### 🖍 Changed
* Use Lidarr in lazy mode to avoid API issue

Clean code - code style

## 📦 0.0.5
### 🐛 Fixed
* Fix Audio player keeps playing issue
### 🚀 Added
* Add error handling on Shazam and Lidarr queries.

## 📦 0.0.4
### 🖍 Changed
* Remove FFmpeg
* Use JS Audio API (make song identification much faster)
### 🐛 Fixed
* Fix offline record

## 📦 0.0.3
### 🚀 Added
* Add app update notifications
### 🖍 Changed
* Refacto transcoding
### 🐛 Fixed
* Fix Lidarr API fetches

## 📦 0.0.2
### 🚀 Added
* Add github page
### 🖍 Changed
* Improve ffmpeg
### 🐛 Fixed
* Fix "not found" response

## 📦 0.0.1
### 🚀 Added
* Initial project package