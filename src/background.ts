import {browser} from 'webextension-polyfill-ts';
import {DEBUG, MESSAGE_TYPE_AUDIO_DATA, MESSAGE_TYPE_MENU_CLICKED, TTS_API_TOKEN, TTS_API_URL} from "~constants";
import type {VoiceModel} from "~type";

if (!DEBUG) {
  console.log = () => {}
}

const MENU_ITEM_ID_SELECTION = 'selection'

function requestSpeech(text: string, voiceModel: VoiceModel, onLoaded: (audioData: ArrayBuffer) => void) {
  return fetch(TTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TTS_API_TOKEN}`
    },
    body: JSON.stringify({
      name: voiceModel.Name,
      text: text,
    })
  })
    .then(response => response.blob())
    .then(blob => {
      console.log('audio data blob', blob)
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('audio data', reader.result)
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
      data: {
        text: info.selectionText,
        playerUrl,
      },
    });
  }
});

browser.runtime.onMessage.addListener(async ({ command, text, voiceModel }) => {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true});
  console.log('[background.js]', 'onMessage', command, text);
  if (command === 'requestSpeech') {
    if (DEBUG) {
      // sleep for 10 seconds to simulate long-running task
      await new Promise(resolve => setTimeout(resolve, 2000));
      await browser.tabs.sendMessage(tab.id, {type: MESSAGE_TYPE_AUDIO_DATA, data: new Uint8Array(1000)});
      return;
    }
    return requestSpeech(text, voiceModel, audioData => {
      const audioArray = Array.from(new Uint8Array(audioData));
      console.log('sending audio data:', voiceModel);
      browser.tabs.sendMessage(tab.id, { type: MESSAGE_TYPE_AUDIO_DATA, data: {audioData: audioArray, name: voiceModel.DisplayName}});
    });
  }
  return Promise.resolve();
});