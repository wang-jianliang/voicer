"use client"

import {useState, useRef, useEffect, useMemo} from "react"
import { Button } from "~components/ui/button"
import { Slider } from "~components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~components/ui/select"
import { History, User, Mic, Play, Pause, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "~components/lib/utils"
import "~global.css"
import {useStorage} from "@plasmohq/storage/dist/hook";
import type {VoiceModel} from "~type";
import {SAMPLE_TEXT, STORAGE_KEY_VOICE_MODEL, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import {requestSpeech} from "~TTSService";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "~/components/ui/command"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "~/components/ui/popover"

export default function TextToSpeech() {
  const [voice, setVoice] = useState<string>("")
  const [locale, setLocale] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [loading, setLoading] = useState(false);

  const [selectedLocaleName, setSelectedLocaleName] = useState('');
  const [localeInput, setLocaleInput] = useState('');
  const [locales, setLocales] = useState<any[]>([]);
  const filteredLocales = useMemo(() => {
    if (!locales) return [];
    return locales.filter((l) => l.toLowerCase().includes(localeInput.toLowerCase()));
  }, [localeInput, locales]);

  const [voiceModel, setVoiceModel] = useStorage<VoiceModel>(STORAGE_KEY_VOICE_MODEL);
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState<VoiceModel[]>([]);
  const filteredModels = useMemo(() => {
    if (!models || !selectedLocaleName) return [];
    
    return models.filter((m) => {
      const matchesSearch = m.ShortName.toLowerCase().includes(modelInput.toLowerCase());
      const matchesLocale = m.LocaleName === selectedLocaleName || m.LocaleName === '';
      return matchesSearch && matchesLocale;
    });
  }, [modelInput, models, selectedLocaleName]);

  const [audioUrl, setAudioUrl] = useState(null);

  const [openLocale, setOpenLocale] = useState(false)
  const [openVoice, setOpenVoice] = useState(false)

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
        data.push({
          Name: 'ChatTTS',
          ShortName: 'ChatTTS',
          DisplayName: 'ChatTTS',
          Gender: 'Famale',
          LocalName: 'ChatTTS',
          Locale: 'zh-CN',
          LocaleName: 'Chinese (ChatTTS)'
        });

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
    setSelectedLocaleName(voiceModel?.LocaleName || '');
  }

  useEffect(() => {
    setLoading(true);
    loadModels()
      .then(() => setLoading(false));
  }, []);

  const handleTryVoice = async () => {
    console.log('try voice:', voiceModel)
    setLoading(true);
    requestSpeech(SAMPLE_TEXT, voiceModel, (audioData) => {
      console.log('audio data:', audioData);
      const dataType = voiceModel.Name === 'ChatTTS' ? 'audio/wav' : 'audio/mpeg';
      const audioUrl = URL.createObjectURL(new Blob([audioData], {type: dataType}));
      console.log('audio url:', audioUrl);
      setAudioUrl(audioUrl);
      setLoading(false);
    });
  }

  const handleLocaleChange = async (localeKey) => {
    console.log('selected locale key:', localeKey)
    const name = locales[localeKey].localeName;
    console.log('selected locale:', name)
    setSelectedLocaleName(name);
  }

  const handleVoiceChange = async (id) => {
    console.log('selected voice id:', id)
    setVoice(id)
    setAudioUrl(null);
    await setVoiceModel(() => {
      const selectedVoice = models.find((item) => item.Name === id)
      console.log('selected voice:', selectedVoice)
      return selectedVoice;
    })
  }

  useEffect(() => {
    if (!audioUrl) return;

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

  const handleTry = async () => {
    if (!audioRef.current) return

    setLoading(true)
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error("Error playing audio:", error)
    }
    setLoading(false)
  }

  const handleSliderChange = (value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  return (
    <div className="w-[350px] h-[400px] mx-auto rounded-lg border bg-white p-6 shadow-sm flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          <h1 className="text-xl font-semibold">Voicer</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon">
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="space-y-6 flex-grow flex flex-col justify-between">
        <div className="grid gap-6 md:grid-cols-2 h-32">
          <div className="space-y-2">
            <label className="text-sm font-medium">选择语言</label>
            <Popover open={openLocale} onOpenChange={setOpenLocale}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openLocale}
                  className="w-full justify-between"
                >
                  {selectedLocaleName
                    ? locales.find((l) => l === selectedLocaleName)
                    : "选择语言..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="搜索语言..." className="h-9" 
                    value={localeInput}
                    onValueChange={setLocaleInput}
                  />
                  <CommandEmpty>未找到语言</CommandEmpty>
                  <CommandGroup>
                    {filteredLocales?.map((locale) => (
                      <CommandItem
                        key={locale}
                        value={locale}
                        onSelect={() => {
                          setSelectedLocaleName(locale)
                          setOpenLocale(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedLocaleName === locale ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {locale}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">选择声音</label>
            <Popover open={openVoice} onOpenChange={setOpenVoice}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openVoice}
                  className="w-full justify-between"
                  disabled={!selectedLocaleName}
                >
                  {voiceModel
                    ? models.find((m) => m.Name === voiceModel.Name)?.DisplayName
                    : "选择声音..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="搜索声音..." className="h-9"
                    value={modelInput}
                    onValueChange={setModelInput}
                  />
                  <CommandEmpty>未找到声音</CommandEmpty>
                  <CommandGroup>
                    {filteredModels?.map((model) => (
                      <CommandItem
                        key={model.Name}
                        value={model.Name}
                        onSelect={() => {
                          handleVoiceChange(model.Name)
                          setOpenVoice(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            voiceModel?.Name === model.Name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {model.DisplayName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {voiceModel && audioUrl && (
          <div className="h-20">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleTry}
                  disabled={loading}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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

