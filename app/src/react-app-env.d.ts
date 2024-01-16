/// <reference types="react-scripts" />
/// <reference types="ordova-plugin-chrome-apps-audiocapture" />

interface Navigator {
    mediaDevices: {
        webkitGetUserMedia: any,
        mozGetUserMedia: any,
    }
}