
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Shortcut } from '../types/types';
import { processEventCode } from '../utils/keys';
import { isMac } from '../utils/os';
import { sendMessage } from '../utils/messaging';

type Props = {};
let value: string[] = [];

const ContentScript = (props: Props) => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [customShortcuts, setCustomShortcuts] = useState<Shortcut[]>([]);
    const [fixedShortcuts, setFixedShortcuts] = useState<Shortcut[]>([]);
    const googleDocDocument = document.querySelector(".docs-texteventtarget-iframe");

    async function initialize() {
        try {
            const loginStatus = await sendMessage<{ isLoggedIn: boolean }>({ type: 'isLoggedIn' });
            if (loginStatus && typeof loginStatus.isLoggedIn !== 'undefined') {
                setIsLoggedIn(loginStatus.isLoggedIn);
            } else {
                setIsLoggedIn(false);
            }

            const shortcuts = await sendMessage<{ customShortcuts: Shortcut[], fixedShortcuts: Shortcut[] }>({ type: 'fetchShortcuts' });
            if (shortcuts) {
                setCustomShortcuts(shortcuts.customShortcuts || []);
                setFixedShortcuts(shortcuts.fixedShortcuts || []);
            }
        } catch (error) {
            console.error('BoldTake Error: Failed to initialize content script.', error);
            setIsLoggedIn(false);
            setCustomShortcuts([]);
            setFixedShortcuts([]);
        }
    }

    useEffect(() => {
        initialize();
    }, []);

    async function handleKeyboardShortcut(event: KeyboardEvent) {
        try {
            const key = processEventCode(event.code);
            if (value.includes(key) || !isLoggedIn) return;
            value.push(key);

            if ((isMac() && value.join('+') === 'meta+e') || (!isMac() && value.join('+') === 'alt+e')) {
                event.preventDefault();
                event.stopImmediatePropagation();
                await sendMessage({ type: 'toggleSidePanel' });
            }
            
            const fixedShortcutdata = fixedShortcuts.find(z => z.shortcut_keys == value.join('+'));
            const customShortcutData = customShortcuts.find(z => z.shortcut_keys == value.join('+'));

            if (fixedShortcutdata === undefined && customShortcutData === undefined) return;

            let selectedText = window.getSelection()?.toString().trim();

            if (googleDocDocument) {
                // @ts-ignore
                googleDocDocument.contentDocument.execCommand("copy");
                // @ts-ignore
                const selectedTextGoogleDoc = googleDocDocument.contentDocument.body.innerText;
                if (!selectedText) {
                    selectedText = selectedTextGoogleDoc;
                }
            }

            if (!selectedText) {
                return;
            }

            await sendMessage({
                type: 'textSelected',
                shortcut_id: customShortcutData?.shortcut_id ?? fixedShortcutdata?.shortcut_id,
                text: selectedText,
            });

            event.preventDefault();
            event.stopImmediatePropagation();
        } catch (error) {
            console.error('BoldTake Error: Failed to handle keyboard shortcut.', error);
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

    async function handleSelectionChange() {
        try {
            const selectedText = window.getSelection()?.toString();
            if (selectedText) {
                await sendMessage({ type: 'tempTextSelected' });
            } else {
                await sendMessage({ type: 'tempTextDeselected' });
            }
        } catch (error) {
            console.error('BoldTake Error: Failed to handle selection change.', error);
        }
    }

    function addEventListeners() {
        document.addEventListener('keydown', handleKeyboardShortcut, true);
        document.addEventListener('keyup', handleKeyUp, true);
        document.addEventListener('selectionchange', handleSelectionChange);

        chrome.runtime.onMessage.addListener(messageListener);

        if (googleDocDocument) {
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
            // @ts-ignore
            const googleDocContentDocument = googleDocDocument.contentDocument;
            if (googleDocContentDocument) {
                googleDocContentDocument.removeEventListener('keydown', handleKeyboardShortcut, true);
                googleDocContentDocument.removeEventListener('keyup', handleKeyUp, true);
            }
        }
    }

    useEffect(() => {
        addEventListeners();
        return () => {
            removeEventListeners();
        };
    }, []);

    return <div id="belikenative"></div>;
};

const rootElement = document.createElement('div');
document.body.appendChild(rootElement);
const root = ReactDOM.createRoot(rootElement);
root.render(<ContentScript />);