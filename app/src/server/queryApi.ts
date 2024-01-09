import { ApiReturnType } from "../types";

async function queryExpressJS(url: string, options?: any) {
  try {
    let baseUrl = "http://localhost:12358";
    if (process.env.REACT_APP_HOSTNAME && process.env.REACT_APP_API_PORT) {
      baseUrl = `${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_API_PORT}`;
    }

    console.log(baseUrl);
    // const baseUrl = window.electron.store.get("shazarr_api_url");
    const data = await fetch(`${baseUrl}${url}`, { ...options, cache: "no-cache" })
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

export async function getConfig() {
  return await queryExpressJS(`/config`);
}

export async function queryLidarr(term: string) {
  return await queryExpressJS(`/search_lidarr?term=${term}`);
}

export async function monitorAlbumLidarr(albumData: string) {
  return await queryExpressJS(`/monitor_lidarr?albumData=${albumData}`);
}
