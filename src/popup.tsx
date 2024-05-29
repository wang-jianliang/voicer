import {useEffect, useState} from "react"
import {DEBUG, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import {useStorage} from "@plasmohq/storage/dist/hook";
import { Storage } from "@plasmohq/storage"
import {ComboBox, defaultTheme, Item, Provider, useAsyncList} from "@adobe/react-spectrum";
import type {VoiceModel} from "~type";

if (!DEBUG) {
  console.log = () => {}
}

function IndexPopup() {
  const [voices, setVoices] = useState([] as any[])
  const [voiceModelName, setVoiceModelName] = useState<any>()
  const [voiceModel, setVoiceModel] = useStorage<VoiceModel>({
    key: "settings-voice-name",
    instance: new Storage({
      area: "local"
    })
  });

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
        items: voicesData.filter((item) => item.Name.toLowerCase().includes(filterText.toLowerCase())),
        cursor: null
      };
    }
  });

  useEffect(() => {
    console.log('fetching voices')
    fetch(TTS_API_URL + "/voices/list", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + TTS_API_TOKEN
      }
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('voices:', data)
        setVoices(data)
      })
      .catch((error) => {
        alert(`Error fetching voices ${error}`)
        console.error('Error:', error)
      });
  }, []);

  return (
    <Provider theme={defaultTheme} width={350}>
      <h1>Welcome to Voicer</h1>
      <div>{voiceModelName}</div>
      <ComboBox
        width="100%"
        label="Select a voice"
        items={list.items}
        inputValue={list.filterText}
        onInputChange={list.setFilterText}
        loadingState={list.loadingState}
        onLoadMore={list.loadMore}
        onSelectionChange={(id) => setVoiceModelName(id)}
      >
        {(item) => <Item key={item.Name}>{item.Name}</Item>}
      </ComboBox>
    </Provider>
  )
}

export default IndexPopup
