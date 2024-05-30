import React, {useEffect, useRef, useState} from 'react';
import PlayCircle from '@spectrum-icons/workflow/PlayCircle';
import PauseCircle from '@spectrum-icons/workflow/PauseCircle';

function AudioPlayerMini({src}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    if (playing) {
      audio.play();
    } else {
      audio.pause();
    }

    audio.addEventListener('timeupdate', updateProgress);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
    };
  }, [playing]);

  const togglePlay = () => {
    setPlaying(!playing);
  };
  console.log("playing", playing)

  return (
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <div onClick={togglePlay} style={{ height: "25px" }}>
        {playing ? <PauseCircle size="M"/> : <PlayCircle size="M"/>}
      </div>
      <progress value={progress} max="100" style={{flex: 1, marginLeft: '5px'}}/>
      <audio src={src} ref={audioRef} style={{display: 'none'}}/>
    </div>
  );
}

export default AudioPlayerMini;