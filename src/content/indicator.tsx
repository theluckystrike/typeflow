import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { CheckCircle, XCircleIcon } from 'lucide-react';
import { getCache, setCache } from '../utils/cache';

const Indicator = () => {
    const [tooltipStatus, setTooltipStatus] = useState<"tempSelected" | "selected" | "response" | "error" | undefined>();
    const [isDeselected, setIsDeselected] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isHovered, setIsHovered] = useState<boolean>(false);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined);
    const [isVisibile, setIsVisible] = useState<boolean>(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => setIsHovered(true), 1000);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
        }
        setIsHovered(false);
    };


    async function copyToClipboard(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text copied to clipboard');
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    async function handleHideClick() {
        try {
            const hidden = await getCache("isHidden");
            if (isLoggedIn) {
                const oneMonth = 30 * 24 * 60 * 60 * 1000;
                const expirationDate = new Date(Date.now() + oneMonth);
                setCache("isHidden", hidden === "true" ? "false" : "true");
                setCache("isHiddenExpiration", expirationDate.toISOString());
            }
            setIsVisible(hidden === "true");
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        async function checkVisibility() {
            const hidden = await getCache("isHidden");
            const expiration = await getCache("isHiddenExpiration");
            if (hidden === "true" && expiration) {
                const expirationDate = new Date(expiration);
                setIsVisible(expirationDate < new Date());
            } else {
                setIsVisible(true);
            }
        }
        checkVisibility();
    }, []);

    useEffect(() => {
        if (isLoggedIn === undefined) {
            chrome.runtime.sendMessage({ type: "isLoggedIn" });
            chrome.runtime.onMessage.addListener(
                (message) => {
                    if (message.type === "isLoggedInResponse") {
                        setIsLoggedIn(message.isLoggedIn);
                    }
                }
            );
        }
      }, [isHovered, isLoggedIn, tooltipStatus]);

    useEffect(() => {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === 'textProcessing') {
                setTooltipStatus('selected');
            }

            if (message.type === 'textSelectedResponse' && message.text) {
                setTooltipStatus('response');
                copyToClipboard(message.text);
                setTimeout(() => {
                    setTooltipStatus(undefined);
                }, 3000);
            }

            if (message.type === 'textProcessingError') {
                setTooltipStatus('error');
                setErrorMessage(message.errorMessage);
                setTimeout(() => {
                    setTooltipStatus(undefined);
                    setErrorMessage(undefined);
                }, 5000);
            }

            if (message.type === "tempTextSelected") {
                setTooltipStatus("tempSelected");
                setIsDeselected(false);
            }
            if (message.type === "tempTextDeselected") {
                setIsDeselected(true);
            }
        });
    }, []);

    useEffect(() => {
        if (isDeselected && tooltipStatus === "tempSelected") {
            setTooltipStatus(undefined);
        }
    }, [isDeselected, tooltipStatus]);

    return (
        <div className='bln-main'>
            <div className='text-container'>
                {isLoggedIn !== undefined && tooltipStatus !== undefined && (isVisibile || tooltipStatus !== "tempSelected") && (
                    <div className='text'>
                        {!isLoggedIn ? "Please login" : tooltipStatus === "tempSelected" ? "Press a shortcut" : tooltipStatus === "selected" ? "Processing..." : tooltipStatus === "response" ? "Text copied" : errorMessage}
                    </div>
                )}

                {(isVisibile || (tooltipStatus !== undefined && tooltipStatus !== "tempSelected")) && (
                    <div
                        className='logo-container'
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => chrome.runtime.sendMessage({ type: "toggleSidePanel" })}
                    >
                        {isHovered && isVisibile && (
                            <div className="hide">
                                <XCircleIcon fill="white" color="black" width={10} onClick={() => handleHideClick()} />
                            </div>
                        )}
                        <div className='logo'>
                            <svg viewBox="0 0 89 181" width={7} fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M65.02 52.62C62.51 54.23 59.1699 56.48 54.7899 57.79C54.7899 57.79 58.94 57.52 63.99 56.28C60.6 68.69 57.62 83.28 55.74 100.09C47.15 110.28 34.38 113.5 34.38 113.5C43.29 115.93 54.82 111.08 54.82 111.08C49.94 117.49 33.76 124.34 24.13 127.99C18.82 130 15.18 134.9 14.7 140.56C14.23 146.04 14.74 152.92 18.5 158.84C18.5 158.84 7.44998 169.2 3.44998 180.42C3.56998 178.86 10.3999 91.22 60.9699 28.97L60.44 29.5C18.04 75.4 6.11997 146.69 6.11997 146.69C5.77996 146.1 5.55996 145.44 5.48996 144.77C5.43996 144.3 5.45 143.82 5.53 143.36C5.98 140.74 6.35996 138.57 6.98996 135.76C7.83996 131.83 7.47998 127.72 5.94998 123.99C2.02998 114.44 0.83997 104.73 0.99997 99.03C1.02997 98.14 1.19998 97.27 1.50998 96.44C1.50998 96.43 1.51999 96.43 1.51999 96.43C2.11999 99.25 3.89999 104.3 9.07999 107.68C9.07999 107.68 4.33994 100.37 4.15994 89.47C4.15994 89.46 4.15994 89.46 4.15994 89.46C14.5599 63.93 30.42 44.8 45.5 31.1C46.13 32.9 47.07 34.85 48.4 36.32C48.4 36.32 47.61 33.17 47.57 29.25C68.03 11.23 86.49 3.24999 87.03 2.85999C86.61 3.32999 74.53 19.73 65.02 52.62Z" fill={`${tooltipStatus === "response" ? "#50BB7A" : tooltipStatus === "error" ? "red" : "#b2b2b2"}`} />
                                <path d="M16.75 124.46C16.75 124.46 33.09 53.04 89 0.190002C89 0.190002 74.9 21.62 70.13 46.52C70.13 46.52 58.64 55.69 47.98 59.8C47.98 59.8 63.59 55.02 68.61 52.6C68.61 52.6 59.47 78.52 58.33 95.33C58.33 95.33 48.81 106.45 30.57 111.09C30.57 111.09 40.46 112.71 56.49 108.07C56.49 108.07 46.05 119.02 25.03 125.71C16.95 128.28 14.67 133.63 14.67 133.63L16.75 124.46Z" fill={`${tooltipStatus === "response" ? "url(#paint0_linear_1_36)" : tooltipStatus === "error" ? "red" : "#b2b2b2"}`} />
                                <path d="M48.32 119.1C42.37 123.94 30.98 126.94 25.56 129.19C20.66 131.22 18.27 134.68 17.21 136.82C16.49 137.87 16.45 138.72 16.45 138.72C20.94 134.51 34.22 132.54 34.22 132.54C29.78 131.98 26.54 132.32 24.35 132.84C25.73 132.16 27.35 131.47 29.31 130.72C46.25 124.23 48.32 119.1 48.32 119.1Z" fill={`${tooltipStatus === "response" ? "#50BB7A" : tooltipStatus === "error" ? "red" : "#b2b2b2"}`} />
                                <path d="M56.62 43.32C56.62 43.32 63.69 42.61 68.79 38.59C68.79 38.59 63.7 47.36 51.07 52.59C51.56 52.49 59.57 50.67 64.7 47.7C64.7 47.7 56.86 55.06 46.35 59.48C46.35 59.48 38.2 72.49 32.75 89.26C32.75 89.26 45.69 87.22 54.97 81.55C54.74 81.92 47.02 93.9 30.12 100.24C30.12 100.24 40.7 99.44 46.72 96.52C46.26 96.83 38.62 101.12 27.54 104.63C27.54 104.63 24.09 114.02 22.23 122.04C22.23 122.04 24.48 123.17 33 120.16C47.84 114.91 56.03 108.37 56.48 108.07C56.08 108.49 45.63 119.14 25.03 125.7C17.2 128.19 14.82 133.28 14.68 133.61L16.75 124.46C16.75 124.46 33.09 53.06 88.98 0.200012C88.45 0.780012 72.22 16.67 56.62 43.32Z" fill={`${tooltipStatus === "response" ? "#50BB7A" : tooltipStatus === "error" ? "red" : "#b2b2b2"}`} />
                                <defs>
                                    <linearGradient id="paint0_linear_1_36" x1="30.4499" y1="132.914" x2="65.4261" y2="32.5765" gradientUnits="userSpaceOnUse">
                                        <stop stop-color={`${tooltipStatus === "response" ? "#50BB7A" : tooltipStatus === "error" ? "red" : "#b2b2b2"}`} />
                                        <stop offset="1" stop-color={`${tooltipStatus === "response" ? "#9BD2A9" : tooltipStatus === "error" ? "red" : "#b2b2b2"}`} />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                )}

                {isHovered && isLoggedIn !== undefined && (
                    <div className='description-container'
                        onMouseOver={() => setIsHovered(true)}
                        onMouseOut={() => setIsHovered(false)}
                    >
                        <div className='description'>
                            <div className='title'>
                                BeLikeNative
                            </div>
                            {isLoggedIn && 
                                <div className="usage">
                                    <div>
                                        <CheckCircle size="7px" stroke={tooltipStatus === "tempSelected" ? "green" : "black"} /> <span style={{ color: tooltipStatus === "tempSelected" ? "green" : "black" }}>Select a text</span>
                                    </div>
                                    <div>
                                        <CheckCircle size="7px" /> <span>Press a shortcut of your choice</span>
                                    </div>
                                    <div>
                                        <CheckCircle size="7px" /> <span>Wait for the text to be processed</span>
                                    </div>
                                    <div>
                                        <CheckCircle size="7px" /> <span>Paste the result</span>
                                    </div>
                                </div>
                            }
                            {!isLoggedIn && 
                                <div className="login">
                                    <button onClick={() => { window.open("https://belikenative.com/login", "_blank")}}>Login</button>
                                    <div>Please login to use BeLikeNative</div>
                                </div>
                            }
                            {isLoggedIn && 
                                <div className="footer">
                                    <span>Click to adjust settings in the side panel</span>
                                </div>
                            }
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


const shadowHost = document.createElement('div');
document.body.appendChild(shadowHost);
const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

const style = document.createElement('style');
style.textContent = `
  .bln-main {
      position: fixed;
      bottom: 10px;
      right: 10px;
      rotate: 30;
      z-index: 99999999999999999999999999999999999999;
      user-select: none;
  }

  .text-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 5px;
  }

  .text {
      font-size: 10px;
      color: #fff;
      background-color: #000;
      padding: 5px 5px;
      border-radius: 5px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      transition: all 0.5s;
  }

  .logo {
      width: 25px;
      height: 25px;
      background-color: #fff;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;
  }

  .logo-container {
      position: relative;
      cursor: pointer;
      margin-left: 3px;
  }

  .logo-container:hover {
      transform: scale(1.1);
  }

  .description-container {
      position: absolute;
      bottom: 30px;
      right: 0;
      min-width: 190px !important;
      padding: 7px 10px;
      background-color: #fff;
      border: 1px solid #000;
      box-shadow: 0 0 50px rgba(0, 0, 0, 0.1);
      border-radius: 5px;
  }

  .description {
      color: #000;
      padding: 5px 10px;
      font-weight: thin;
      font-size: 10px;
      border-radius: 5px;
      width: 100%;
      position: relative;
      all: initial;
      font-family: 'Roboto', sans-serif !important;
      display: flex;
      flex-direction: column;
      gap: 3px;
  }

  .description .usage {
      display: flex;
      flex-direction: column;
      gap: 3px;
  }

  .description .usage div {
      display: flex;
      align-items: center;
      gap: 1px;
      font-size: 8px;
      color: #000;
  }

  .description .title {
      font-weight: bold;
      color: #4BBB79;
      font-size: 10px;
      margin: auto;
      width: fit-content;
  }

  .description .footer {
      margin-top: 3px;
      font-weight: bold;
      font-size: 9px;
      color: #000;
  }

  .login {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
  }

  .login button {
      font-size: 10px;
      margin: 3px 0;
      padding: 5px 10px;
      border: none;
      background-color: #4BBB79;
      color: #fff;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
  }

  .login button:hover {
      background-color: #082031;
  }

  .login div {
      font-size: 9px;
      color: #000;
      margin-top: 0;
      width: fit-content;
      margin: auto;
  }

  .hide {
      height: fit-content;
      position: absolute;
      top: -15px;
      left: -10px;
      padding: 5px;
      cursor: pointer;
  }

  .hide svg:hover {
      scale: 1.1;
  }

  .hide-description {
      top: -20px;
      left: -15px;
  }
`;
shadowRoot.appendChild(style);

const root = ReactDOM.createRoot(shadowRoot);
root.render(<Indicator />);
