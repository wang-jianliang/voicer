import {DEBUG, STORAGE_KEY_VOICE_MODEL, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import {useStorage} from "@plasmohq/storage/dist/hook";
import {
  Avatar, Badge,
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

if (!DEBUG) {
  console.log = () => {}
}

function IndexPopup() {
  const [voiceModel, setVoiceModel] = useStorage<VoiceModel>(STORAGE_KEY_VOICE_MODEL);

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

  return (
    <Provider theme={defaultTheme} width={350} height={300}>
      <Flex direction="column" gap="size-100" alignItems="center">
        <Avatar src={chrome.runtime.getURL("../assets/icon128.png")} alt="Voicer" size='avatar-size-700' marginTop={20}/>
        <h1>Welcome to Voicer</h1>
      </Flex>
      { voiceModel && <Flex direction="column" gap="size-200" alignItems="center">
          <AudioPlayerMini src="https://cdn.pixabay.com/audio/2022/08/23/audio_d16737dc28.mp3"/>
          <div>{voiceModel.Name}</div>
          <Badge alignSelf="flex-start" variant="indigo">{voiceModel.Gender}</Badge>
      </Flex>}
      <ComboBox
        width="100%"
        label="Select a voice"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={list.setFilterText}
        loadingState={list.loadingState}
        onLoadMore={list.loadMore}
        onSelectionChange={(id) => setVoiceModel(() => {
          const selectedVoice = list.items.find((item) => item.Name === id)
          console.log('selected voice:', selectedVoice)
          return selectedVoice;
        })}
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
