import type {PlasmoCSConfig, PlasmoCSUIJSXContainer, PlasmoCSUIProps, PlasmoRender} from "plasmo"
import React, {type FC} from "react"
import {createRoot} from "react-dom/client"
import {browser} from "webextension-polyfill-ts";
import {MESSAGE_TYPE_MENU_CLICKED} from "~constants";
import type {BrowserMessage, UserEventType} from "~type";
import {getClientX, getClientY} from "~utils";

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

  const [show, setShow] = React.useState(false);
  const [playerUrl, setPlayerUrl] = React.useState(null);
  const [text, setText] = React.useState(null);
// Function called when a new message is received
  const messagesFromContextMenu = async (msg: BrowserMessage) => {
    console.log('[content.js]. Message received', msg);

    if (msg.type === MESSAGE_TYPE_MENU_CLICKED) {
      console.log(`menu ${msg} is clicked`);
      setPlayerUrl(msg.playerUrl);
      setText(msg.data);
    }
  };

  /**
   * Fired when a message is sent from either an extension process or a content script.
   */
  browser.runtime.onMessage.addListener(messagesFromContextMenu);

  browser.runtime.onMessage.addListener(({audioUrl}) => {
    if (audioUrl) {
      let iframe = document.createElement('iframe');
      iframe.src = playerUrl;
      // Style the iframe to make it more obvious when we inject it
      iframe.style = `
    top: 0;
    left: 0;
    width: 250px;
    height: 141px;
  `;
      iframe.frameBorder = 0;
      iframe.scrolling = 'no';

      iframe.addEventListener('load', () => {
        iframe.contentWindow.postMessage(audioUrl, '*');
      });

      document.body.appendChild(iframe);
    }
  });

  const requestSpeech = () => {
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
        // borderRadius: 4,
        // background: "yellow",
        // padding: 4,
        position: "fixed",
        // top: y,
        // left: x,
        // width: 100,
        // height: 100,
        bottom: 0,
        left: 0,
        zIndex: 100000,
      }}>
      <iframe src={playerUrl} onLoad={requestSpeech} style={{
        width: '100vw',
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