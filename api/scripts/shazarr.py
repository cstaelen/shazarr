import asyncio
import sys
from shazamio import Shazam

if len(sys.argv) != 2:
    raise ValueError('Please provide file url')

file = sys.argv[1]

async def main():
  shazam = Shazam()
  out = await shazam.recognize_song(file)
  print(out)

loop = asyncio.get_event_loop()
loop.run_until_complete(main())