import React, {useEffect, useState} from 'react';
import AudioPlayer, {
  type ActiveUI,
  type InterfaceGridTemplateArea,
  type PlayerPlacement,
  type PlayListPlacement,
  type ProgressUI,
  type VolumeSliderPlacement
} from "react-modern-audio-player";

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
  const [activeUI, setActiveUI] = useState<ActiveUI>({all: true});

  window.addEventListener("message", (event) => {
    if (event.data) {
      console.log("event.data", event)
      const audioData = new Uint8Array(event.data).buffer;
      const audioUrl = URL.createObjectURL(new Blob([audioData], {type: 'audio/mpeg'}));
      setPlayList([
        {
          name: 'name',
          writer: 'writer',
          img: 'image.jpg',
          src: audioUrl,
          id: 1,
        }
      ]);

      console.log("audioUrl", audioUrl);

      // setPlayList([
      //   {
      //     name: 'name',
      //     writer: 'writer',
      //     img: 'image.jpg',
      //     src: 'https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3',
      //     id: 1,
      //   },
      // ]);
    }
  });

  // const [audioSrc, setAudioSrc] = useState<string>("");
  // const [loading, setLoading] = useState<boolean>(true);

  // useEffect(() => {
  //   fetch('https://reader-api.wangjianliang0.workers.dev/api/v1', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'Authorization': 'Bearer 5c1d3dce69b12976105fa1ef8b513769f1959672ec8759cfb22099f41e5837f3',
  //     },
  //     body: JSON.stringify({
  //       name: 'Microsoft Server Speech Text to Speech Voice (en-US, JennyMultilingualNeural)',
  //       text: "Hello, world!",
  //     })
  //   })
  //     .then(response => response.blob())
  //     .then(blob => {
  //       console.log("audo data", blob);
  //       const reader = new FileReader();
  //       reader.onloadend = () => {
  //         setLoading(false);
  //         setAudioSrc(URL.createObjectURL(new Blob([reader.result as ArrayBuffer], {type: 'audio/mp3'})));
  //       };
  //       reader.readAsArrayBuffer(blob);
  //     })
  //     .catch(error => console.error('Error:', error));
  // }, []);


  return (
    <div className="App">
      {playList.length > 0 ? (
        <div style={{display: 'flex', width: '99%', alignItems: 'center', justifyContent: 'center'}}>
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
        </div>
      ) : "Loading..."}
    </div>
  );
}

export default Player;
