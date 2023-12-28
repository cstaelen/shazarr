import asyncio
import sys
import json
from shazamio import Shazam

if len(sys.argv) != 2:
    raise ValueError('Please provide file url')

file = sys.argv[1]

async def main():
  shazam = Shazam()
  out = await shazam.recognize_song(file)
  info = json.dumps(out)
  print(info)

loop = asyncio.get_event_loop()
loop.run_until_complete(main())