import {browser} from 'webextension-polyfill-ts';
import {DEBUG, MESSAGE_TYPE_AUDIO_DATA, MESSAGE_TYPE_MENU_CLICKED} from "~constants";
import {requestSpeech} from "~TTSService";

if (!DEBUG) {
  console.log = () => {}
}

const MENU_ITEM_ID_SELECTION = 'selection'

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
  console.log('[background.js]', 'onMessage', command, text, voiceModel);
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