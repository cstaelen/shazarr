"use server";

import { ApiReturnType } from "../types";
import { Storage as Store } from "@ionic/storage";

async function queryExpressJS(url: string, options?: any) {
  try {
    const storage = new Store();
    await storage.create();
    const storeUrl = await storage.get("shazarr_api_url");

    let baseUrl = "http://127.0.0.1:12358";
    if (storeUrl) {
      baseUrl = storeUrl;
    }

    const data = await fetch(`${baseUrl}${url}`, {
      ...options,
      cache: "no-cache",
    })
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
