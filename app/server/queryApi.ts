"use server"

import { ApiReturnType, LidarrAlbumRelease } from "../types";

async function queryExpressJS(url: string, options?: any) {
  try {
    const data = await fetch(`http://${process.env.HOSTNAME}:${process.env.API_PORT}${url}`, { ...options, cache: "no-cache" })
      .then(function (response) {
        return response.json();
      }).then(function (data) {
        return data;
      });
    return data;
  } catch (e: any) {
    return { error: true, message: e.message } as ApiReturnType;
  }
}

export async function recognize(base64: string) {
  return await queryExpressJS(`/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({file: base64}),
  });
}

export async function queryLidarr(term: string) {
  return await queryExpressJS(`/search_lidarr?term=${term}`);
}

export async function monitorAlbumLidarr(albumData: string) {
  return await queryExpressJS(`/monitor_lidarr?albumData=${albumData}`);
}
