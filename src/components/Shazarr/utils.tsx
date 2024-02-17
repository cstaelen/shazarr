export const b64toBlob = (
  b64Data: string,
  contentType = "",
  sliceSize = 512,
) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
};

export async function transcodePCM16(base64: string) {
  const blob = b64toBlob(base64);
  const audioCtx = new AudioContext();

  const buffer = await blob.arrayBuffer();
  const source = await audioCtx.decodeAudioData(buffer);

  const TARGET_SAMPLE_RATE = 16000;

  const offlineCtx = new OfflineAudioContext(
    source.numberOfChannels,
    source.duration * TARGET_SAMPLE_RATE,
    TARGET_SAMPLE_RATE,
  );

  const offlineSource = offlineCtx.createBufferSource();
  offlineSource.buffer = source;
  offlineSource.connect(offlineCtx.destination);
  offlineSource.start();
  return offlineCtx.startRendering().then((resampled) => {
    const floats = new Float32Array(resampled.getChannelData(0).length);
    resampled.getChannelData(0).forEach(function (sample, i) {
      floats[i] = sample < 0 ? sample / 0x80 : sample / 0x7f;
    });

    const PCM16iSamples = [];
    for (let i = 0; i < floats.length; i++) {
      let val = Math.floor(32767 * floats[i]);
      val = Math.min(32767, val);
      val = Math.max(-32768, val);

      PCM16iSamples.push(val);
    }

    return PCM16iSamples;
  });
}
