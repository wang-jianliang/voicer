import React, {useState} from 'react';
import AudioPlayer, {
  type ActiveUI,
  type InterfaceGridTemplateArea,
  type PlayerPlacement,
  type PlayListPlacement,
  type ProgressUI,
  type VolumeSliderPlacement
} from "react-modern-audio-player";
import {DEBUG, MESSAGE_TYPE_UPDATE_AUDIO_DATA} from "~constants";
import {LoopingRhombusesSpinner} from "react-epic-spinners";

function Player() {
  const [playList, setPlayList] = useState([]);
  const [progressType, setProgressType] = useState<ProgressUI>("waveform");
  const [playerPlacement, setPlayerPlacement] = useState<PlayerPlacement>(
    "bottom-left"
  );
  const [interfacePlacement, setInterfacePlacement] = useState<
    InterfaceGridTemplateArea<any>
  >();
  const [playListPlacement, setPlayListPlacement] = useState<PlayListPlacement>(
    "bottom"
  );
  const [volumeSliderPlacement, setVolumeSliderPlacement] = useState<
    VolumeSliderPlacement
  >();
  const [theme, setTheme] = useState<"dark" | "light" | undefined>();
  const [width, setWidth] = useState("100%");
  const [activeUI, setActiveUI] = useState<ActiveUI>({
    all: true,
    playList: false,
  });

  window.addEventListener("message", (event) => {
    if (event.data && event.data.command === MESSAGE_TYPE_UPDATE_AUDIO_DATA) {
      console.log("event.data", event)
      if (!event.data.data) {
        setPlayList([]);
        return;
      }

      const data = event.data.data;
      const audioData = new Uint8Array(data.audioData).buffer;
      const audioUrl = !DEBUG ? URL.createObjectURL(new Blob([audioData], {type: 'audio/mpeg'})) :
        'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3';
      setPlayList([
        {
          name: 'Voicer',
          writer: data.name,
          img: '../assets/icon512.png',
          src: audioUrl,
          id: 1,
        }
      ]);

      console.log("audioUrl", audioUrl);
    }
  });

  return (
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100}}>
        {playList.length > 0 ? (
          <AudioPlayer
            playList={playList}
            activeUI={{
              ...activeUI,
              progress: progressType
            }}
            placement={{
              player: playerPlacement,
              interface: {
                templateArea: interfacePlacement
              },
              playList: playListPlacement,
              volumeSlider: volumeSliderPlacement
            }}
            rootContainerProps={{
              colorScheme: theme,
              width
            }}
          />
        ) : <LoopingRhombusesSpinner color='orange' size={32} />}
      </div>
  );
}

export default Player;
