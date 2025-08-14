import React from 'react';
import { createRoot } from 'react-dom/client';
import './welcome.css';
import { CheckCircle } from 'lucide-react';
import { isMac } from '../../utils/os';
import { processEventCode } from '../../../src/utils/keys';

type Props = {}

const Welcome = (props: Props) => {
    let value: string[] = []

    const handleKeyboardShortcutb = (event: KeyboardEvent) => {
        const key = processEventCode(event.code);
        if (value.includes(key)) return;
        value.push(key);

        if ((isMac() && value.join('+') === 'meta+e') || (!isMac() && value.join('+') === 'alt+e')) {
            event.preventDefault();
            event.stopImmediatePropagation();

            chrome.runtime.sendMessage({
                type: 'toggleSidePanel',
            })
        }
    }

    function handleKeyUp(event: KeyboardEvent) {
        value = [];
    }

    React.useEffect(() => {
        document.addEventListener('keydown', handleKeyboardShortcutb);
        document.addEventListener('keyup', handleKeyUp);
        return () => {
            document.removeEventListener('keydown', handleKeyboardShortcutb);
            document.removeEventListener('keyup', handleKeyUp);
        }
    }, [])
    
    return (
        <div className="container">
            <div className="left-section">
                <img src="/owl-welcome.svg" alt="logo" />
            </div>
            <div className="right-section">
                <div className="title">Thanks for using BeLikeNative</div>

                <div className='description'>
                    <h2>How to use the extension</h2>
                    <div>
                        <CheckCircle size="15px" /> <span>Select a text</span>
                    </div>
                    <div>
                        <CheckCircle size="15px" /> <span>Press a shortcut of your choice</span>
                    </div>
                    <div>
                        <CheckCircle size="15px" /> <span>Wait for the text to be processed, and it will automatically be copied to your clipboard</span>
                    </div>
                    <div>
                        <CheckCircle size="15px" /> <span>Paste the processed result where needed</span>
                    </div>
                </div>

                <div className='description'>
                    <div>Adjust the settings through the BeLikeNative extension side panel</div>
                    <div>
                        <span>For easier access, please</span>
                        <a
                            className='link'
                            onClick={() => {
                                chrome.tabs.create({
                                    url: "chrome://extensions/?id=gchojmpfpbpmpfgdppfdkpchikbcgabp#:~:text=Pin%20to%20toolbar"
                                });
                            }}
                        >
                            pin
                        </a>
                        <span>the extension to your browser</span>
                    </div>
                    <div>Join the discussion in the BeLikeNative <a target="_blank" href="https://belikenative.com/community/">community</a></div>
                </div>

                <div className="sidepanel">
                    <button id="toggleButton" className="button" onClick={() => chrome.runtime.sendMessage({ type: 'toggleSidePanel' })}>Toggle Side Panel</button>
                    <p>or press</p>
                    <span className="shortcut-key">{isMac() ? '⌘' : 'ALT'} + E</span>
                </div>
            </div>
        </div>
    );
}

const root = createRoot(document.getElementById("root")!);

root.render(
    <React.StrictMode>
        <Welcome />
    </React.StrictMode>
);