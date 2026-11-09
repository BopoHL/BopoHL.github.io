#!/usr/bin/env bash
# Usage: tools/narration/prepare.sh <dir with <locale>-<station>.mp3 downloads>
set -euo pipefail

source_dir=${1:?folder with the downloaded takes}
target=public/audio/narration
lead="silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.04"
tail="silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.12"

for take in "$source_dir"/*.mp3; do
  name=$(basename "$take" .mp3)
  locale=${name%%-*}
  station=${name#*-}
  mkdir -p "$target/$locale"
  ffmpeg -hide_banner -loglevel error -y -i "$take" -ac 1 \
    -af "$lead,areverse,$tail,areverse,loudnorm=I=-18:TP=-2:LRA=7" \
    -ar 44100 -c:a libmp3lame -b:a 96k -map_metadata -1 -id3v2_version 0 \
    "$target/$locale/$station.mp3"
  echo "$target/$locale/$station.mp3"
done
