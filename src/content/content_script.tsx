
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Shortcut } from '../types/types';
import { processEventCode } from '../utils/keys';
import { isMac } from '../utils/os';

type Props = {};
let value: string[] = [];

const ContentScript = (props: Props) => {
    let wasTextSelected = false;
    const [customShortcuts, setCustomShortcuts] = useState<Shortcut[]>([]);
    const [fixedShortcuts, setFixedShortcuts] = useState<Shortcut[]>([]);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const googleDocDocument = document.querySelector(".docs-texteventtarget-iframe");

    useEffect(() => {
        chrome.runtime.sendMessage({ type: 'isLoggedIn' }, (response) => {
            setIsLoggedIn(response.isLoggedIn);
        });
        chrome.runtime.sendMessage({ type: 'fetchShortcuts' }, (response) => {
            if (response.customShortcuts) setCustomShortcuts(response.customShortcuts);
            if (response.fixedShortcuts) setFixedShortcuts(response.fixedShortcuts);
        });
    }, []);

    async function handleKeyboardShortcut(event: KeyboardEvent) {
        try {
            const key = processEventCode(event.code);
            if (value.includes(key) || !isLoggedIn) return;
            value.push(key);

            if ((isMac() && value.join('+') === 'meta+e') || (!isMac() && value.join('+') === 'alt+e')) {
                event.preventDefault();
                event.stopImmediatePropagation();

                chrome.runtime.sendMessage({
                    type: 'toggleSidePanel',
                })
            }
            
            if (fixedShortcuts.length === 0) {
                chrome.runtime.sendMessage({ type: 'fetchShortcuts' }, (response) => {
                    if (response.customShortcuts) setCustomShortcuts(response.customShortcuts);
                    if (response.fixedShortcuts) setFixedShortcuts(response.fixedShortcuts);
                });
            }

            const fixedShortcutdata = fixedShortcuts.find(z => z.shortcut_keys == value.join('+'));
            const customShortcutData = customShortcuts.find(z => z.shortcut_keys == value.join('+'));

            if (fixedShortcutdata === undefined && customShortcutData === undefined) return

            let selectedText = window.getSelection()?.toString().trim();

            // for google docs
            if (googleDocDocument) {
                // @ts-ignore
                googleDocDocument.contentDocument.execCommand("copy");
                // @ts-ignore
                const selectedTextGoogleDoc = googleDocDocument.contentDocument.body.innerText

                if (!selectedText) {
                    selectedText = selectedTextGoogleDoc
                }
            }

            if (!selectedText) {
                return;
            }

            chrome.runtime.sendMessage({
                type: 'textSelected',
                shortcut_id: customShortcutData?.shortcut_id ?? fixedShortcutdata?.shortcut_id,
                text: selectedText,
            });

            // stop other listeners from being executed
            event.preventDefault();
            event.stopImmediatePropagation();

        } catch (error) {
            console.error('Failed to handle keyboard shortcut: ', error);
        }
    }

    function handleKeyUp(event: KeyboardEvent) {
        value = [];
    }

    const messageListener = (message: any, sender: any, sendResponse: any) => {
        if (message.type === 'fetchShortcutsResponse') {
            removeEventListeners();
            addEventListeners();
            if (message.customShortcuts) setCustomShortcuts(message.customShortcuts);
            if (message.fixedShortcuts) setFixedShortcuts(message.fixedShortcuts);
        } else if (message.type === "isLoggedInResponse") {
            setIsLoggedIn(message.isLoggedIn);
        }
    };

    function handleSelectionChange() {
        const selectedText = window.getSelection()?.toString();

        if (selectedText && !wasTextSelected) {
            if (customShortcuts.length > 0 && fixedShortcuts.length > 0) {
                return;
            }
            chrome.runtime.sendMessage({ type: 'fetchShortcuts' }, (response) => {
                if (response.customShortcuts) setCustomShortcuts(response.customShortcuts);
                if (response.fixedShortcuts) setFixedShortcuts(response.fixedShortcuts);
            });
            chrome.runtime.sendMessage({
                type: 'tempTextSelected',
            });
            wasTextSelected = true;
        }

        if (!selectedText) {
            onSelectionCleared();
            wasTextSelected = false;
        }
    }

    function addEventListeners(){
        document.addEventListener('keydown', handleKeyboardShortcut, true);
        document.addEventListener('keyup', handleKeyUp, true);
        document.addEventListener('selectionchange', handleSelectionChange);


        chrome.runtime.onMessage.addListener(messageListener);

        if (googleDocDocument) {
            // for google docs
            // @ts-ignore
            const googleDocContentDocument = googleDocDocument.contentDocument;
            if (googleDocContentDocument) {
                googleDocContentDocument.addEventListener('keydown', handleKeyboardShortcut, true);
                googleDocContentDocument.addEventListener('keyup', handleKeyUp, true);
            }
        }
    }

    function removeEventListeners() {
        document.removeEventListener('keydown', handleKeyboardShortcut, true);
        document.removeEventListener('keyup', handleKeyUp, true);
        document.removeEventListener('selectionchange', handleSelectionChange);

        chrome.runtime.onMessage.removeListener(messageListener);

        if (googleDocDocument) {
            // for google docs
            // @ts-ignore
            const googleDocContentDocument = googleDocDocument.contentDocument;
            if (googleDocContentDocument) {
                googleDocContentDocument.removeEventListener('keydown', handleKeyboardShortcut, true);
                googleDocContentDocument.removeEventListener('keyup', handleKeyUp, true);
            }
        }
    }

    function onSelectionCleared() {
        chrome.runtime.sendMessage({
            type: 'tempTextDeselected',
        });
    }

    useEffect(() => {
        addEventListeners();
        return () => {
            removeEventListeners();
        };
    })

    return <div id="belikenative"></div>;
};

const rootElement = document.createElement('div');
document.body.appendChild(rootElement);
const root = ReactDOM.createRoot(rootElement);
root.render(<ContentScript />);