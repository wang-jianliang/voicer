import {DEBUG, SAMPLE_TEXT, STORAGE_KEY_VOICE_MODEL, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import {useStorage} from "@plasmohq/storage/dist/hook";
import {
  Avatar,
  Badge,
  Button,
  ComboBox,
  defaultTheme,
  Flex,
  Item,
  ProgressCircle,
  Provider,
  View
} from "@adobe/react-spectrum";
import type {VoiceModel} from "~type";
import AudioPlayerMini from "~components/AudioPlayerMini";
import {requestSpeech} from "~TTSService";
import {useEffect, useMemo, useState} from "react";
import {LoginForm} from "~components/login-form";
import "~global.css"

if (!DEBUG) {
  console.log = () => {
  }
}

function IndexPopup() {
  const [loading, setLoading] = useState(false);

  const [selectedLocaleName, setSelectedLocaleName] = useState('');
  const [localeInput, setLocaleInput] = useState('');
  const [locales, setLocales] = useState<any[]>([]);
  const filteredLocales = useMemo(() => {
    return locales.filter((l) => l.localeName.toLowerCase().includes(localeInput.toLowerCase()));
  }, [localeInput, locales]);

  const [voiceModel, setVoiceModel] = useStorage<VoiceModel>(STORAGE_KEY_VOICE_MODEL);
  const [modelInput, setModelInput] = useState('');
  const [models, setModels] = useState<VoiceModel[]>([]);
  const filteredModels = useMemo(() => {
    return models.filter((m) => m.ShortName.toLowerCase().includes(modelInput.toLowerCase())) &&
      models.filter((m) => m.LocaleName === selectedLocaleName || m.LocaleName === '');
  }, [modelInput, models, selectedLocaleName]);

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
    setLocales(uniqueLocales.map((locale, index) => ({id: index, localeName: locale})));
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

  const handleSelectionChange = async (id) => {
    console.log('selected voice id:', id)
    setAudioUrl(null);
    await setVoiceModel(() => {
      const selectedVoice = models.find((item) => item.Name === id)
      console.log('selected voice:', selectedVoice)
      return selectedVoice;
    })
  }

  return (
    <div>
    <Provider theme={defaultTheme} width={450} height={420}>
      <View padding={20}>
        <Flex direction="column" gap="size-100" alignItems="center">
          <Avatar src={chrome.runtime.getURL("../assets/icon128.png")} alt="Voicer" size='avatar-size-700'
                  marginTop={20}/>
          <h1>Welcome to Voicer</h1>
        </Flex>
        {voiceModel &&
            <Flex direction="column" gap="size-200" alignItems="center" margin={18}>
              {loading ? <ProgressCircle aria-label="Loading…" isIndeterminate/> : audioUrl ?
                <AudioPlayerMini src={audioUrl}/> :
                <Button
                  variant='primary' style='fill' onPress={handleTryVoice}
                >
                  <div style={{fontSize: "15px"}}>try</div>
                </Button>
              }
                <Flex direction="row" gap="size-100" alignItems="center" justifyContent='center'>
                    <Flex direction={'row'} gap="size-100" alignItems="center">
                      {voiceModel.Gender === "Male" ? <Badge variant="indigo">{voiceModel.Gender}</Badge> :
                        <Badge variant="purple">{voiceModel.Gender}</Badge>
                      }
                        <div>{voiceModel.DisplayName} - {voiceModel.LocaleName}</div>
                    </Flex>
                </Flex>
            </Flex>}
        <ComboBox
          width="100%"
          label="Select a locale"
          defaultItems={filteredLocales}
          onSelectionChange={handleLocaleChange}
        >
          {(item) =>
            <Item key={item.id}>
              {`${item.localeName}`}
            </Item>
          }
        </ComboBox>
        <ComboBox
          width="100%"
          label="Select a voice"
          items={filteredModels}
          isDisabled={!selectedLocaleName}
          onSelectionChange={handleSelectionChange}
        >
          {(item) =>
            <Item key={item.Name}>
              {`${item.LocalName} (${item.Gender}) - ${item.LocaleName}`}
            </Item>
          }
        </ComboBox>
      </View>
    </Provider>
      <LoginForm/>
    </div>
  )
}

export default IndexPopup
