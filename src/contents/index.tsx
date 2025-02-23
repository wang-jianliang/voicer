import type {PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoCSUIProps, PlasmoRender} from "plasmo"
import React, {useEffect, type FC, useState} from "react"
import {createRoot} from "react-dom/client"
import {browser} from "webextension-polyfill-ts";
import {
  MESSAGE_TYPE_AUDIO_DATA,
  MESSAGE_TYPE_UPDATE_AUDIO_DATA,
  MESSAGE_TYPE_MENU_CLICKED,
  DEBUG,
  STORAGE_KEY_VOICE_MODEL, MESSAGE_TYPE_PLAYER_CLOSE, EVENT_SOURCE_PLAYER, MESSAGE_TYPE_DOWNLOAD_AUDIO, DEMO_AUDIO_URL
} from "~constants";
import type {BrowserMessage, UserEventType, VoiceModel} from "~type";
import {getClientX, getClientY} from "~utils";
import * as process from "process";
import {useStorage} from "@plasmohq/storage/dist/hook";

if (!DEBUG) {
  console.log = () => {}
}

const defaultVoiceModel = {
  Name: 'Microsoft Server Speech Text to Speech Voice (en-US, JennyMultilingualNeural)',
  DisplayName: 'Jenny'
};

export const config: PlasmoCSConfig = {
  matches: ["http://*/*", "https://*/*"]
}

let lastMouseEvent: UserEventType | undefined;

const mouseUpHandler = async (event: UserEventType) => {
  console.log('[content.js]. mouse up event:', event);
  lastMouseEvent = event;
};

const mouseDownHandler = async (event: UserEventType) => {
  console.log('[content.js]. mouse down event:', event);
  lastMouseEvent = event;
};

document.addEventListener('mouseup', mouseUpHandler);
document.addEventListener('touchend', mouseUpHandler);
document.addEventListener('mousedown', mouseDownHandler);

export const getRootContainer = () =>
  new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      clearInterval(checkInterval)
      const rootContainer = document.createElement("div")
      document.body.appendChild(rootContainer)
      resolve(rootContainer)
    }, 137)
  })

const PlasmoOverlay: FC<PlasmoCSUIProps> = () => {

  const [playerUrl, setPlayerUrl] = React.useState(null);
  const [audioData, setAudioData] = useState(null);
  const iframeRef = React.useRef(null);

  const [voiceModel] = useStorage<VoiceModel>(STORAGE_KEY_VOICE_MODEL);


  const requestSpeech = (text: string, model: VoiceModel) => {
    if (!text) {
      console.error('No text to read');
      return;
    }
    console.log('voiceModel:', model);
    browser.runtime.sendMessage({command: 'requestSpeech', text: text, voiceModel: model});
  }

// Function called when a new message is received
  const messagesFromContextMenu = async (msg: BrowserMessage) => {
    console.log('[content.js]. Message received', msg);

    if (msg.type === MESSAGE_TYPE_MENU_CLICKED) {
      console.log(`menu ${msg} is clicked`);
      setPlayerUrl(msg.data.playerUrl);
      iframeRef.current?.contentWindow.postMessage({command: MESSAGE_TYPE_UPDATE_AUDIO_DATA, data: null}, '*');
      requestSpeech(msg.data.text, voiceModel || defaultVoiceModel);
    } else if (msg.type === MESSAGE_TYPE_AUDIO_DATA && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({command: MESSAGE_TYPE_UPDATE_AUDIO_DATA, data: msg.data}, '*');
      setAudioData(msg.data);
    }
  };

  /**
   * Fired when a message is sent from either an extension process or a content script.
   */
  useEffect(() => {
    browser.runtime.onMessage.addListener(messagesFromContextMenu);
    return () => {
      browser.runtime.onMessage.removeListener(messagesFromContextMenu);
    }
  }, [messagesFromContextMenu]);

  const handleEventFromPlayer = (event: { source: any; data: { command: string; source: string }; }) => {
    if (event.data && event.data.source == EVENT_SOURCE_PLAYER) {
      if (event.data.command === MESSAGE_TYPE_PLAYER_CLOSE) {
        console.log('close event from player:', event.data, event.source)
        setPlayerUrl(null);
      } else if (event.data.command === MESSAGE_TYPE_DOWNLOAD_AUDIO) {
        console.log("download event from player:", event.source)
        const audioUrl = !DEBUG ? URL.createObjectURL(
          new Blob([audioData], {type: 'audio/mpeg'})
        ) : DEMO_AUDIO_URL;
        const link = document.createElement("a")
        link.href = audioUrl
        link.target = '__blank'
        link.download = "audio.mp3"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }
  }

  useEffect(() => {
    // listen for messages from the player
    window.addEventListener('message', handleEventFromPlayer);
    return () => {
      window.removeEventListener('message', handleEventFromPlayer);
    }
  }, [handleEventFromPlayer]);

  const x = lastMouseEvent ? getClientX(lastMouseEvent) : 0;
  const y = lastMouseEvent ? getClientY(lastMouseEvent) : 0;

  return (playerUrl && (
    <div
      style={{
      }}>
      <iframe src={playerUrl} ref={iframeRef} style={{
        width: 'calc(100vw - 17px)', border: 'none', margin: 0, padding: 0, height: 200, position: 'fixed', bottom: 0, left: 0,
        zIndex: 100000,
      }}/>
    </div>
  ));
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
                                                                     createRootContainer
                                                                   }) => {
  const rootContainer = await createRootContainer()
  console.log("rootContainer", rootContainer)
  console.log("env all:", process.env)
  console.log("node env:", process.env.DEBUG)
  const root = createRoot(rootContainer)
  root.render(<PlasmoOverlay/>)
}

export default PlasmoOverlay;
