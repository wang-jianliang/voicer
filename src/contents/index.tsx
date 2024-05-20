import type {
  PlasmoCSConfig,
  PlasmoCSUIJSXContainer,
  PlasmoCSUIProps,
  PlasmoRender
} from "plasmo"
import React, { type FC } from "react"
import { createRoot } from "react-dom/client"
import {browser} from "webextension-polyfill-ts";
import {MESSAGE_TYPE_MENU_CLICKED} from "~constants";
import type {BrowserMessage, UserEventType} from "~type";

export const config: PlasmoCSConfig = {
  matches:  ['http://*/*', 'https://*/*', '<all_urls>'],
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
// Function called when a new message is received
  const messagesFromContextMenu = async (msg: BrowserMessage) => {
    console.log('[content.js]. Message received', msg);

    if (msg.type === MESSAGE_TYPE_MENU_CLICKED) {
      console.log(`menu ${msg} is clicked`);
      setShow(!show);
    }
  };

  /**
   * Fired when a message is sent from either an extension process or a content script.
   */
  browser.runtime.onMessage.addListener(messagesFromContextMenu);

  return (show && (
    <span
      style={{
        borderRadius: 4,
        background: "yellow",
        padding: 4,
        position: "absolute",
        top: 0,
        left: 0,
        width: 100,
        height: 100,
      }}>
      CSUI ROOT CONTAINER
    </span>
  ));
}

export const render: PlasmoRender<PlasmoCSUIJSXContainer> = async ({
                                                                     createRootContainer
                                                                   }) => {
  const rootContainer = await createRootContainer()
  console.log("rootContainer", rootContainer)
  const root = createRoot(rootContainer)
  root.render(<PlasmoOverlay />)
}

export default PlasmoOverlay;