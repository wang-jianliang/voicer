"use client"

import {useState, useRef, useEffect} from "react"
import { Button } from "~components/ui/button"
import { Slider } from "~components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { History, User, Mic, Play, Pause, Settings } from "lucide-react"
import { cn } from "~components/lib/utils"
import "~global.css"
import {useStorage} from "@plasmohq/storage/dist/hook";
import type {VoiceModel} from "~type";
import {SAMPLE_TEXT, STORAGE_KEY_VOICE_LOCALE, STORAGE_KEY_VOICE_MODEL, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import {requestSpeech} from "~TTSService";
import {Avatar, AvatarImage} from "~components/ui/avatar";
import * as React from "react";

export default function Popup() {
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [locales, setLocales] = useState<any[]>([]);
  const [locale, setLocale] = useStorage<string>(STORAGE_KEY_VOICE_LOCALE)
  const [models, setModels] = useState<VoiceModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<VoiceModel[]>([]);
  const [voiceModel, setVoiceModel] = useStorage<VoiceModel>(STORAGE_KEY_VOICE_MODEL);

  const [audioUrl, setAudioUrl] = useState(null);

  async function loadModels() {
    const voicesData: VoiceModel[] = await fetch(TTS_API_URL + "/voices/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TTS_API_TOKEN
      }
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('voices:', data)
        return data;
      })
      .catch((error) => {
        alert(`Error fetching voices ${error}`)
        console.error('Error:', error)
      });

    // map locales and remove duplicates
    const locales = voicesData.map((voice) => voice.LocaleName);
    const uniqueLocales = [...new Set(locales)];
    setLocales(uniqueLocales);
    setModels(voicesData);
    setFilteredModels(voicesData);
  }

  useEffect(() => {
    setLoading(true);
    loadModels()
      .then(() => setLoading(false));
  }, []);

  const handleTryVoice = async () => {
    console.log('try voice:', voiceModel)
    setLoading(true);
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
        requestSpeech(SAMPLE_TEXT, voiceModel, (audioData) => {
            console.log('audio data:', audioData);
            const dataType = 'audio/mpeg';
            const audioUrl = URL.createObjectURL(new Blob([audioData], {type: dataType}));
            console.log('audio url:', audioUrl);
            setAudioUrl(audioUrl);
            setLoading(false);
        });
    }
  }

  const handleLocaleChange = async (id) => {
    console.log('selected locale id:', id)
    setLocale(id)
    // update voice model list
    await setFilteredModels(() => {
      return models.filter((item) => item.LocaleName === id)
    })
  }

  const handleVoiceChange = async (id) => {
    console.log('selected voice id:', id)
    setAudioUrl(null);
    await setVoiceModel(() => {
      const selectedVoice = filteredModels.find((item) => item.Name === id)
      console.log('selected voice:', selectedVoice)
      return selectedVoice;
    })
  }

  useEffect(() => {
    if (!audioUrl) {
        return;
    }
    audioRef.current = new Audio(audioUrl)
    audioRef.current.addEventListener("loadedmetadata", () => {
      setDuration(audioRef.current?.duration || 0)
      setLoading(false)
    })
    audioRef.current.addEventListener("timeupdate", () => {
      setCurrentTime(audioRef.current?.currentTime || 0)
    })
    audioRef.current.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })
    audioRef.current.play();
    setIsPlaying(true)

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.remove()
      }
    }
  }, [audioUrl])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  return (
    <div className="w-[450px] h-[400px] mx-auto rounded-lg border bg-white py-4 px-6 shadow-sm flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src="../assets/icon128.png"/>
          </Avatar>
          <h1 className="text-xl font-semibold">Voicer</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <History className="h-5 w-5"/>
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5"/>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5"/>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </div>


      <div className="space-y-6 flex-grow flex flex-col justify-between">
        <div className="grid gap-6 md:grid-cols-2 h-32">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select a Locale</label>
            <Select value={locale} onValueChange={handleLocaleChange} disabled={!loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select locale"/>
              </SelectTrigger>
              <SelectContent>
                {locales.map((locale) => (
                  <SelectItem key={locale} value={locale}>{locale}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select a Voice</label>
            <Select value={voiceModel?.Name} onValueChange={handleVoiceChange} disabled={!locale && !loading}>
              <SelectTrigger>
                <SelectValue placeholder="Select voice"/>
              </SelectTrigger>
              <SelectContent>
                {filteredModels.map((v) => (
                  <SelectItem key={v.Name} value={v.Name}>{v.DisplayName} ({v.Gender})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {locale && voiceModel && (
          <div className="h-20">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTryVoice}
                  disabled={loading}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
                </Button>

                <div className="flex w-full items-center gap-2">
                  <span className="w-12 text-sm tabular-nums">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration}
                    step={0.1}
                    onValueChange={handleSliderChange}
                    className={cn("w-full", loading && "animate-pulse opacity-50")}
                  />
                  <span className="w-12 text-sm tabular-nums">{formatTime(duration)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
