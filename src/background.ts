import { browser } from 'webextension-polyfill-ts';

const MENU_ITEM_ID_SELECTION = 'selection'

browser.contextMenus?.create({
    id: MENU_ITEM_ID_SELECTION,
    title: 'Read this',
    contexts: ['selection'],
})

browser.contextMenus?.onClicked.addListener(async function (info) {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    console.log('[background.js', 'contextMenus onClicked', info);
    if (info.menuItemId === MENU_ITEM_ID_SELECTION) {
    tab.id &&
    (await browser.tabs.sendMessage(tab.id, {
        type: MESSAGE_TYPE_MENU_CLICKED,
    }));
}
});