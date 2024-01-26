import { createWorker } from "@ffmpeg/ffmpeg";

export const b64toBlob = (
  b64Data: string,
  contentType = "",
  sliceSize = 512
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

export async function ffmpegTranscode(
  data: ArrayBuffer,
  inputFormat: string,
  outputParameters: string
) {
  const debug = false;
  let ffmpegProcess = createWorker(
    debug
      ? {
          logger: (payload: any) => {
            console.log(payload.action, payload.message);
          },
        }
      : undefined
  );
  await ffmpegProcess.load();

  await ffmpegProcess.write(`audio.${inputFormat}`, data);
  try {
    await ffmpegProcess.transcode(
      `audio.${inputFormat}`,
      `raw`,
      outputParameters
    );
  } catch (er) {
    console.log(er);
  }
  const output = (await ffmpegProcess.read(`raw`)).data;
  await ffmpegProcess.worker.terminate();
  return output;
}
