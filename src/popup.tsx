import {DEBUG, STORAGE_KEY_VOICE_MODEL, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import {useStorage} from "@plasmohq/storage/dist/hook";
import {
  Avatar, Badge, Button,
  ComboBox,
  defaultTheme,
  Flex,
  Image,
  Item,
  Provider, Text, Tooltip,
  TooltipTrigger,
  useAsyncList
} from "@adobe/react-spectrum";
import type {VoiceModel} from "~type";
import AudioPlayerMini from "~components/AudioPlayerMini";
import {requestSpeech} from "~TTSService";
import {useState} from "react";

if (!DEBUG) {
  console.log = () => {}
}

function IndexPopup() {
  const [voiceModel, setVoiceModel] = useStorage<VoiceModel>(STORAGE_KEY_VOICE_MODEL);
  const [audioUrl, setAudioUrl] = useState(null);

  let list = useAsyncList<VoiceModel>({
    async load({ signal, cursor, filterText }) {
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

      return {
        items: voicesData, // voicesData.filter((item) => item.Name.toLowerCase().includes(filterText.toLowerCase())),
        cursor: null
      };
    }
  });

  const handleTryVoice = async () => {
    console.log('try voice:', voiceModel)
    requestSpeech('Hello, world!', voiceModel, (audioData) => {
      console.log('audio data:', audioData);
      const audioUrl = URL.createObjectURL(new Blob([audioData], {type: 'audio/mpeg'}));
      console.log('audio url:', audioUrl);
      setAudioUrl(audioUrl);
    });
  }

  const handleSelectionChange = async (id) => {
    console.log('selected voice id:', id)
    setAudioUrl(null);
    await setVoiceModel(() => {
      const selectedVoice = list.items.find((item) => item.Name === id)
      console.log('selected voice:', selectedVoice)
      return selectedVoice;
    })
  }

  return (
    <Provider theme={defaultTheme} width={450} height={300}>
      <Flex direction="column" gap="size-100" alignItems="center">
        <Avatar src={chrome.runtime.getURL("../assets/icon128.png")} alt="Voicer" size='avatar-size-700' marginTop={20}/>
        <h1>Welcome to Voicer</h1>
      </Flex>
      { voiceModel &&
          <Flex direction="column" gap="size-200" alignItems="center">
            { audioUrl && <AudioPlayerMini src={audioUrl}/> }
            <Flex direction="row" gap="size-100" alignItems="center" justifyContent='center'>
              <Flex direction={'row'} gap="size-100" alignItems="center">
                <Badge variant="indigo">{voiceModel.Gender}</Badge>
                <div>{voiceModel.Name}</div>
              </Flex>
              <Button variant='primary' onPress={handleTryVoice} >try</Button>
            </Flex>
          </Flex>}
      <ComboBox
        width="100%"
        label="Select a voice"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={list.setFilterText}
        loadingState={list.loadingState}
        onLoadMore={list.loadMore}
        onSelectionChange={handleSelectionChange}
      >
        {(item) =>
          <Item key={item.Name}>
            {`${item.ShortName} (${item.Gender})`}
          </Item>
        }
      </ComboBox>
    </Provider>
  )
}

export default IndexPopup
