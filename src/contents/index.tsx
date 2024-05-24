import type {PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoCSUIProps, PlasmoRender} from "plasmo"
import React, {type FC} from "react"
import {createRoot} from "react-dom/client"
import {browser} from "webextension-polyfill-ts";
import {MESSAGE_TYPE_AUDIO_DATA, MESSAGE_TYPE_UPDATE_AUDIO_DATA, MESSAGE_TYPE_MENU_CLICKED} from "~constants";
import type {BrowserMessage, UserEventType} from "~type";
import {getClientX, getClientY} from "~utils";
import {LoopingRhombusesSpinner} from "react-epic-spinners";

export const config: PlasmoCSConfig = {
  matches: ['http://*/*', 'https://*/*', '<all_urls>'],
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
  const iframeRef = React.useRef(null);
// Function called when a new message is received
  const messagesFromContextMenu = async (msg: BrowserMessage) => {
    console.log('[content.js]. Message received', msg);

    if (msg.type === MESSAGE_TYPE_MENU_CLICKED) {
      console.log(`menu ${msg} is clicked`);
      setPlayerUrl(msg.data.playerUrl);
      iframeRef.current?.contentWindow.postMessage({command: MESSAGE_TYPE_UPDATE_AUDIO_DATA, data: null}, '*');
      requestSpeech(msg.data.text);
    } else if (msg.type === MESSAGE_TYPE_AUDIO_DATA && iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({command: MESSAGE_TYPE_UPDATE_AUDIO_DATA, data: msg.data}, '*');
    }
  };

  /**
   * Fired when a message is sent from either an extension process or a content script.
   */
  browser.runtime.onMessage.addListener(messagesFromContextMenu);

  const requestSpeech = (text: string) => {
    if (!text) {
      console.error('No text to read');
      return;
    }
    browser.runtime.sendMessage({command: 'requestSpeech', text: text});
  }

  const x = lastMouseEvent ? getClientX(lastMouseEvent) : 0;
  const y = lastMouseEvent ? getClientY(lastMouseEvent) : 0;

  return (playerUrl && (
    <div
      style={{
        position: "fixed",
        width: '100vw',
        bottom: 0,
        left: 0,
        zIndex: 100000,
      }}>
      <iframe src={playerUrl} ref={iframeRef} style={{
        width: '100vw', border: 'none', margin: 0, padding: 0
      }}/>
    </div>
  ));
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
                                                                     createRootContainer
                                                                   }) => {
  const rootContainer = await createRootContainer()
  console.log("rootContainer", rootContainer)
  const root = createRoot(rootContainer)
  root.render(<PlasmoOverlay/>)
}

export default PlasmoOverlay;