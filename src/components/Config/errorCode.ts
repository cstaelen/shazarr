export const data = {
    EMPTY_RECORDING: "Empty recording.",
    MISSING_PERMISSION: "Access to microphone denied.",
    DEVICE_CANNOT_VOICE_RECORD: "This device does not allow voice recording.",
    NOT_SUPPORTED_OS_VERSION: "A feature seems to not being supported by OS.",
    SHAZAM_API_ERROR: "An error occured while connecting to shazam service. Try later.",
    LIDARR_SEARCH_ERROR: "Lidarr error : Unable to monitor album.",
    LIDARR_MONITOR_ERROR: "Lidarr error : Unable to monitor album.",
}

export type ErrorCodeType = keyof typeof data;
export default data;