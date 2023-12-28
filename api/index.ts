import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { execSync } from "child_process";
import { ROOT_PATH } from "./constants";
const fs = require('fs');

dotenv.config({ path: ".env", override: false });

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

app.post('/recognize', async (req: Request, res: Response) => {
  const buf = Buffer.from(req.body.file, 'base64'); // decode
  const filePath = '/home/app/standalone/data.mp3';
  fs.writeFile(filePath, buf, async function(err: any) {
    if(err) {
      console.log("err", err);
    } else {
      // const command = `python ${ROOT_PATH}/api/scripts/shazarr.py ${filePath}`;
      const command = `python ${ROOT_PATH}/api/scripts/shazarr.py /home/app/standalone/api/scripts/test.m4a`;
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