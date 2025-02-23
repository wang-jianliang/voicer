import React, {useState} from 'react';
import {
  DEBUG,
  EVENT_SOURCE_PLAYER,
  MESSAGE_TYPE_DOWNLOAD_AUDIO,
  MESSAGE_TYPE_PLAYER_CLOSE,
  MESSAGE_TYPE_UPDATE_AUDIO_DATA
} from "~constants";
import {LoopingRhombusesSpinner} from "react-epic-spinners";
import AudioPlayer from "~components/audio-player";

import "~global.css"
import type {AudioInfo} from "~type";
import LoadingAnimation from "~components/loading-animation";

if (!DEBUG) {
  console.log = () => {
  }
}

function Player() {
  const [audio, setAudio] = useState<AudioInfo | null>(null)

  window.addEventListener("message", (event) => {
    if (event.data && event.data.command === MESSAGE_TYPE_UPDATE_AUDIO_DATA) {
      console.log("event.data", event)
      if (!event.data.data) {
        return;
      }

      const data = event.data.data;
      const audioData = new Uint8Array(data.audioData).buffer;
      const audioUrl = !DEBUG ? URL.createObjectURL(new Blob([audioData], {type: 'audio/mpeg'})) :
        'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3';
      setAudio({
        name: 'Voicer',
        url: audioUrl,
        voice: data.name
      })

      console.log("audioUrl", audioUrl);
    }
  });

  const sendDownloadEvent = () => {
    window.parent.postMessage({
      command: MESSAGE_TYPE_DOWNLOAD_AUDIO,
      source: EVENT_SOURCE_PLAYER
    }, "*")
  }

  return (
    <div>
    {audio ? (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: "fixed",
        width: "100vw",
        bottom: 10,
        left: 0
      }}>
        <AudioPlayer
          audio={audio}
          onDownload={sendDownloadEvent}
          onClose={() => {
            setAudio(null);
            window.parent.postMessage({command: MESSAGE_TYPE_PLAYER_CLOSE, source: EVENT_SOURCE_PLAYER}, '*');
          }}
        />
      </div>) :
      <div style={{ marginTop: 120 }}>
        <LoadingAnimation/>
      </div>}
    </div>
  );
}

export default Player;
