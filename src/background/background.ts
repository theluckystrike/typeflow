import { getData, postData } from "../api/api";
import { Shortcut } from "../types/types";
import SecurityUtils, { secureFetch } from "../utils/security";

const baseAPIURI = "https://backend.belikenative.com";

let isSidePanelOpen = false;
let canSendRequest = true;

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    if (details.reason === 'install') {
      chrome.tabs.create({ url: "welcome.html" });
    }

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.scripting.executeScript({
          // @ts-ignore
          target: { tabId: tab.id },
          files: ["js/content_script.js", "js/vendor.js", "js/indicator.js"],
        }).catch((error) => {
          console.log(`Failed to inject content script into ${tab.url}: ${error.message}`);
        });
      });
    });
  }
});

// @ts-ignore
chrome.sidePanel
.setPanelBehavior({ openPanelOnActionClick: true })
.catch((error: any) => console.error(error));


async function handleOpenSidePanel(
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    const windowId = sender.tab?.windowId;

    if (windowId !== undefined) {
      // @ts-ignore
      chrome.sidePanel.open({ windowId });
    } else {
      chrome.windows.getCurrent((window) => {
        if (window?.id !== undefined) {
          // @ts-ignore
          chrome.sidePanel.open({ windowId: window.id });
        } else {
          console.error("Failed to retrieve a valid window ID.");
        }
      });
    }
  } catch (error: any) {
    console.log(error);
  } finally {
    isSidePanelOpen = true;
  }
}


async function handleCloseSidePanel(
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    chrome.runtime.sendMessage(
      { type: "closeSidePanel" }
    );
  } catch (error: any) {
    console.log(error);
  } finally {
    isSidePanelOpen = false;
  }
}

async function handleToggleSidePanel(
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    if (isSidePanelOpen) {
      handleCloseSidePanel(message, sender, sendResponse);
    } else {
      handleOpenSidePanel(message, sender, sendResponse);
    }
  } catch (error: any) {
    console.log(error);
  }
}

async function handleTextSelectedMessage(
  message: { type: string; shortcut_id: string; text: string; },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    if (!canSendRequest) return;
    canSendRequest = false;
    chrome.tabs.sendMessage(sender.tab?.id ?? NaN, {
      type: "textProcessing",
    });
    const response: any = await postData("openAI/useShortcut", {
      shortcut_id: message.shortcut_id,
      data: message.text
    }).catch((err) => {
      throw { err: err.message };
    });

    chrome.tabs.sendMessage(sender.tab?.id ?? NaN, {
      type: "textSelectedResponse",
      text: response.result,
    });
  } catch (error: any) {
    chrome.tabs.sendMessage(sender.tab?.id ?? NaN, {
      type: "textProcessingError",
      errorMessage: error.err || "Failed to processes the text."
    });
  } finally {
    canSendRequest = true;
  }
}

async function handleFetchShortcutsMessage(
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    const { fixedShortcuts, customShortcuts } = await fetchShortcuts();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "fetchShortcutsResponse",
        fixedShortcuts,
        customShortcuts,
      });
    });
  } catch (error) {
    console.log(error);
  }
}

async function isLoggedIn(
  message: { type: string },
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
) {
  try {
    const response: any = await getData("auth/detail")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "isLoggedInResponse",
        isLoggedIn: response.user !== undefined,
      });
    });
  } catch (error) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0 || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "isLoggedInResponse",
        isLoggedIn: false,
      });
    });
  }
}

async function fetchShortcuts() {
  try {
    const customShortcutsResponse: any = await getData('shortcut/getAllShortcut')
    const customShortcuts: Shortcut[] = customShortcutsResponse.shortcut;

    const fixedShortcutsResponse: any = await getData('shortcut/fixedShortcuts')
    let fixedShortcuts: Shortcut[] = fixedShortcutsResponse.shorcuts;

    return { fixedShortcuts, customShortcuts };
  } catch (error) {
    console.log(error);
    return { fixedShortcuts: [], customShortcuts: [] };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "textSelected") {
    handleTextSelectedMessage(message, sender, sendResponse);
  } else if (message.type === "fetchShortcuts") {
    handleFetchShortcutsMessage(message, sender, sendResponse);
  } else if (message.type === "isLoggedIn"){
    isLoggedIn(message, sender, sendResponse);
  } else if (message.type === "openSidePanel"){
    handleOpenSidePanel(message, sender, sendResponse);
  } else if (message.type === "closeSidePanel"){
    handleCloseSidePanel(message, sender, sendResponse);
  } else if (message.type === "toggleSidePanel"){
    handleToggleSidePanel(message, sender, sendResponse);
  } else {
    chrome.tabs.sendMessage(sender.tab?.id ?? NaN, message);
  }

  return true;
});
