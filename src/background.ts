import {browser} from 'webextension-polyfill-ts';
import {MESSAGE_TYPE_MENU_CLICKED} from "~constants";

const MENU_ITEM_ID_SELECTION = 'selection'

function requestSpeech(text: string, onLoaded: (audioData: ArrayBuffer) => void) {
  return fetch('https://reader-api.wangjianliang0.workers.dev/api/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer 5c1d3dce69b12976105fa1ef8b513769f1959672ec8759cfb22099f41e5837f3'
    },
    body: JSON.stringify({
      name: 'Microsoft Server Speech Text to Speech Voice (en-US, JennyMultilingualNeural)',
      text: text,
    })
  })
    .then(response => response.blob())
    .then(blob => {
      const reader = new FileReader();
      reader.onloadend = () => {
        onLoaded(reader.result as ArrayBuffer);
      };
      reader.readAsArrayBuffer(blob);
    })
    .catch(error => console.error('Error:', error));
}

browser.contextMenus?.create({
  id: MENU_ITEM_ID_SELECTION,
  title: 'Read this',
  contexts: ['selection'],
})

browser.contextMenus?.onClicked.addListener(async function (info) {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});

  console.log('[background.js', 'contextMenus onClicked', info);
  const playerUrl = browser.runtime.getURL('sandboxes/player.html');
  if (info.menuItemId === MENU_ITEM_ID_SELECTION && tab.id) {
    await browser.tabs.sendMessage(tab.id, {
      type: MESSAGE_TYPE_MENU_CLICKED,
      data: info.selectionText,
      playerUrl,
    });
  }
});

browser.runtime.onMessage.addListener(async ({ command, text }) => {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  console.log('[background.js]', 'onMessage', command, text);
  if (command === 'requestSpeech') {
    return requestSpeech(text, audioData => {
      const audioUrl = URL.createObjectURL(new Blob([audioData], { type: 'audio/mpeg' }));
      if (tab.id) {
        browser.tabs.sendMessage(tab.id, { type: 'audioUrl', audioUrl });
      }
    });
  }
  return Promise.resolve();
});