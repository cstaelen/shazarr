"use server";

import { ApiReturnType } from "../types";
import { Preferences } from "@capacitor/preferences";

import { Shazam, s16LEToSamplesArray } from "shazam-api";

async function queryExpressJS(url: string, options?: any) {
  try {
    const { value: storeUrl } = await Preferences.get({
      key: "shazarr_api_url",
    });

    let baseUrl = "http://0.0.0.0:12358";
    if (storeUrl) {
      baseUrl = storeUrl;
    }

    const opts = {
      ...options,
      cache: "no-cache",
    };

    const data = await fetch(`${baseUrl}${url}`, opts)
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        return data;
      });
    return data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

function base64ToUint8Array(base64: string) {
  // const binaryString = atob(base64);
  // const uint8Array = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
  // return uint8Array;

  // var base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  // var base64 = dataURI.substring(base64Index);
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

export async function recognize(base64: string, signal: any) {
  try {
    const shazam = new Shazam();
    const bytes = base64ToUint8Array(base64);
    console.log("bytes", bytes)
    const samples = s16LEToSamplesArray(bytes);
    console.log("samples", samples)

    const songData = await shazam.recognizeSong(samples, (state: string) => {
      console.log("callback", state);
    });
    console.log("songData", songData);

    return JSON.stringify(songData);
  } catch (e: any) {
    console.log(e);
    return { error: true, message: e.message } as ApiReturnType;
  }
}

export async function queryLidarr(term: string) {
  return await queryExpressJS(`/search_lidarr?term=${term}`);
}

export async function monitorAlbumLidarr(albumData: string) {
  return await queryExpressJS(`/monitor_lidarr?albumData=${albumData}`);
}
