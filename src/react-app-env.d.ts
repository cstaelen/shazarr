/// <reference types="react-scripts" />
/// <reference types="ordova-plugin-chrome-apps-audiocapture" />

declare module '@ffmpeg/ffmpeg';

interface Navigator {
    mediaDevices: {
        webkitGetUserMedia: any,
        mozGetUserMedia: any,
    }
}