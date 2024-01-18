export const data = {
    EMPTY_RECORDING: "Empty recording.",
    MISSING_PERMISSION: "Access to microphone denied.",
    DEVICE_CANNOT_VOICE_RECORD: "This device does not allow voice recording.",
    NOT_SUPPORTED_OS_VERSION: "A feature seems to not being supported by OS.",
}

export type ErrorCodeType = keyof typeof data;
export default data;