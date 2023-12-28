"use server"

import { ApiReturnType } from "../types";

async function queryExpressJS(url: string, options?: any) {
  try {
    const data = await fetch(url, { ...options, cache: "no-cache" })
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

export const getApiUrl = async () => `http://${process.env.HOSTNAME}:${process.env.API_PORT}`;

export async function recognize(base64: string) {
  return await queryExpressJS(`http://${process.env.HOSTNAME}:${process.env.API_PORT}/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({file: base64}),
  });
}


