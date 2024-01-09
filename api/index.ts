import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { ROOT_PATH, replaceAll } from "./constants";
const fs = require('fs');

dotenv.config({ path: ".env", override: true });

const port = process.env.API_PORT;
const hostname = process.env.HOSTNAME;

const app: Express = express();
app.use(express.json({ limit: "50mb" }));

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server !');
});

app.get('/config', (req: Request, res: Response) => {
  const config = {
    LIDARR_ENABLED: !!(process.env.LIDARR_API_KEY && process.env.LIDARR_URL && process.env.LIDARR_LIBRARY_PATH),
    TIDARR_URL: process.env.TIDARR_URL,
  }
  res.send(config);
});

app.get('/search_lidarr', async (req: Request, res: Response) => {
  if (!req.query.term) {
    res.send("error");
    return;
  }

  const command = `curl "${process.env.LIDARR_URL}/api/v1/album/lookup?term=${encodeURIComponent(req.query.term as string)}&apikey=${process.env.LIDARR_API_KEY}"`;
  const response = await execSync(
    command,
    { encoding: "utf-8" }
  );
  res.send(response);
});

app.get('/monitor_lidarr', async (req: Request, res: Response) => {
  if (!req.query.albumData) {
    res.send("error");
    return;
  }

  const jsonReqData = JSON.parse(req.query.albumData as string);

  const data = {
    ...jsonReqData,
    "overview": "",
    "artist": {
      ...jsonReqData.artist,
      "overview": "",
      "qualityProfileId": 3,
      "rootFolderPath": process.env.LIDARR_LIBRARY_PATH,
      "addOptions": {
        "monitor": "none",
        "albumsToMonitor": [
          jsonReqData.releases[0].foreignReleaseId
        ],
        "monitored": false,
        "searchForMissingAlbums": false,
      }
    },
    "addOptions": {
      "addType": "automatic",
      "searchForNewAlbum": false,
    },
  }; 
  
  const command = `curl -0 -v ${process.env.LIDARR_URL}/api/v1/album?apikey=${process.env.LIDARR_API_KEY} \
  -H 'Content-Type: application/json' \
  -d '${JSON.stringify(data)}'`;

  try {
    const response = await execSync(
      command,
    );
    res.send(response);
  } catch (e) {
    console.log(e);
  }
});

app.post('/recognize', async (req: Request, res: Response) => {
  const buf = Buffer.from(req.body.file, 'base64'); // decode
  const filePath = `/tmp/data-${Date.now()}.mp3`;
  fs.writeFile(filePath, buf, async function(err: any) {
    if(err) {
      console.log("err", err);
    } else {
      const command = `python ${ROOT_PATH}/scripts/shazarr.py ${filePath}`;
      // const command = `python ${ROOT_PATH}/scripts/shazarr.py /home/app/standalone/api/scripts/test.m4a`;
      console.log(`Executing: ${command}`);

      const response = await execSync(
        command,
        { encoding: "utf-8" }
      );

      const data = JSON.stringify(response);

      await execSync(
        `rm ${filePath}`,
        { encoding: "utf-8" }
      );
      res.send(data);
    }
  }); 
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://${hostname}:${port}`);
});