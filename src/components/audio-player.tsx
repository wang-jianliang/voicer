import * as React from "react"
import { Mic, Download, Volume2, Play, Pause, X, Gauge } from "lucide-react"
import { Button } from "~components/ui/button"
import { Separator } from "~components/ui/separator"
import { Slider } from "~components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "~components/ui/popover"
import {Avatar, AvatarImage} from "~components/ui/avatar";
import type {AudioInfo} from "~type";

export default function AudioPlayer({ audio: {name, url, voice} }: { audio: AudioInfo }) {
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)
  const [volume, setVolume] = React.useState(1)
  const [prevVolume, setPrevVolume] = React.useState(1)
  const [waveformData, setWaveformData] = React.useState<number[]>([])
  const [playbackRate, setPlaybackRate] = React.useState(1)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
    if (newVolume > 0) {
      setPrevVolume(newVolume)
    }
  }

  const toggleMute = () => {
    if (volume > 0) {
      handleVolumeChange([0])
    } else {
      handleVolumeChange([prevVolume])
    }
  }

  const handleDownload = () => {
    if (audioRef.current) {
      const link = document.createElement("a")
      link.href = audioRef.current.src
      link.download = "audio.mp3"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  const generateWaveformData = async (audioBuffer: AudioBuffer) => {
    const channelData = audioBuffer.getChannelData(0)
    const samples = 100
    const blockSize = Math.floor(channelData.length / samples)
    const waveform = []

    for (let i = 0; i < samples; i++) {
      const start = i * blockSize
      let sum = 0
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(channelData[start + j])
      }
      waveform.push(sum / blockSize)
    }

    const multiplier = Math.pow(Math.max(...waveform), -1)
    return waveform.map((n) => n * multiplier)
  }

  React.useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current
      const updateTime = () => setCurrentTime(audio.currentTime)
      const handleEnded = () => setIsPlaying(false)

      audio.addEventListener("timeupdate", updateTime)
      audio.addEventListener("loadedmetadata", () => setDuration(audio.duration))
      audio.addEventListener("ended", handleEnded)

      // Generate waveform data
      fetch(audio.src)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          const audioContext = new (window.AudioContext)()
          return audioContext.decodeAudioData(arrayBuffer)
        })
        .then((audioBuffer) => generateWaveformData(audioBuffer))
        .then((data) => setWaveformData(data))

      return () => {
        audio.removeEventListener("timeupdate", updateTime)
        audio.removeEventListener("loadedmetadata", () => setDuration(audio.duration))
        audio.removeEventListener("ended", handleEnded)
      }
    }
  }, []) // Removed audioRef.current as a dependency

  const waveformPath = React.useMemo(() => {
    if (waveformData.length === 0) return ""
    const width = 100
    const height = 20
    let path = `M 0 ${height / 2} `
    const barWidth = width / waveformData.length
    waveformData.forEach((point, i) => {
      const x = i * barWidth
      const y = ((1 - point) * height) / 2
      path += `L ${x} ${y} `
    })
    path += `V ${height} L 0 ${height} Z`
    return path
  }, [waveformData])

  return (
    <div className="flex items-center w-full max-w-3xl bg-white rounded-lg shadow-sm border p-2 gap-4">
      <audio ref={audioRef} src={url} className="hidden" />

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          {/*<Mic className="w-4 h-4 text-blue-500" />*/}
          <Avatar className="w-6 h-6">
            <AvatarImage src="../assets/icon128.png"/>
          </Avatar>
        </div>
        <span className="text-sm font-medium">{name} ({voice})</span>
      </div>

      <Separator orientation="vertical" className="h-8" />

      <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-[80px]">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div className="flex-1 h-8 bg-slate-100 rounded relative overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveformGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(59 130 246)" />
              <stop offset={`${(currentTime / duration) * 100}%`} stopColor="rgb(59 130 246)" />
              <stop offset={`${(currentTime / duration) * 100}%`} stopColor="rgb(203 213 225)" />
              <stop offset="100%" stopColor="rgb(203 213 225)" />
            </linearGradient>
          </defs>
          <path d={waveformPath} fill="url(#waveformGradient)" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Volume2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[120px] p-3">
            <Slider
              defaultValue={[1]}
              max={1}
              step={0.1}
              value={[volume]}
              onValueChange={handleVolumeChange}
              className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Gauge className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[80px] p-3">
            <div className="flex flex-col gap-1.5">
              {[0.5, 1, 1.5, 2].map((speed) => (
                <Button
                  key={speed}
                  variant={playbackRate === speed ? "default" : "outline"}
                  size="xs"
                  onClick={() => handleSpeedChange(speed)}
                >
                  {speed}x
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={togglePlay}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

