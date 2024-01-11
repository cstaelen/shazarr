"use server";
import { CapacitorHttp } from "@capacitor/core";

import { ApiReturnType } from "../types";
import { Preferences } from "@capacitor/preferences";

async function queryExpressJS(url: string, options?: any) {
  try {
    const { value: storeUrl } = await Preferences.get({
      key: "shazarr_api_url",
    });

    let baseUrl = "http://0.0.0.1:12358";
    if (storeUrl) {
      baseUrl = storeUrl;
    }

    const data = await CapacitorHttp.get({
      ...options,
      url: `${baseUrl}${url}`,
      cache: "no-cache",
    });
    return data.data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

export async function recognize(base64: string) {
  return await queryExpressJS(`/recognize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: base64 }),
  });
}

export async function getConfig() {
  return await queryExpressJS(`/config`);
}

export async function queryLidarr(term: string) {
  return await queryExpressJS(`/search_lidarr?term=${term}`);
}

export async function monitorAlbumLidarr(albumData: string) {
  return await queryExpressJS(`/monitor_lidarr?albumData=${albumData}`);
}
