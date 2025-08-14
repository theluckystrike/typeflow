const sleep = (ms) => new Promise(r => setTimeout(r, ms));
async function waitMs(ms) {
  const step = 150;
  let elapsed = 0;
  while (elapsed < ms) {
    if (BOLDTAKE_STOP) break;
    await sleep(step);
    elapsed += step;
  }
}
function isMac() { return navigator.platform.toLowerCase().includes('mac'); }
let BOLDTAKE_RUNNING = false;
let BOLDTAKE_STOP = false;
let overlayRoot = null;
let overlayDebug = null;
let lastDebugInfo = {};
let NARRATE = true;
function ensureOverlay() {
  if (overlayRoot) return;
  overlayRoot = document.createElement('div');
  overlayRoot.style.cssText = 'position:fixed;top:10px;right:10px;z-index:2147483647;background:#000;color:#fff;padding:8px 10px;border-radius:8px;font:12px system-ui;display:flex;gap:8px;align-items:center;opacity:0.92;box-shadow:0 2px 12px rgba(0,0,0,.4)';
  const text = document.createElement('span');
  text.id = 'boldtake-status-text';
  const btn = document.createElement('button');
  btn.textContent = 'Stop';
  btn.style.cssText = 'background:#ff4d4f;border:none;color:#fff;padding:4px 8px;border-radius:6px;cursor:pointer;';
  btn.onclick = () => { BOLDTAKE_STOP = true; setStatus('Stopping…'); };
  const dbg = document.createElement('button');
  dbg.textContent = 'Debug';
  dbg.style.cssText = 'background:#555;border:none;color:#fff;padding:4px 8px;border-radius:6px;cursor:pointer;';
  dbg.onclick = () => {
    if (!overlayDebug) return;
    overlayDebug.style.display = overlayDebug.style.display === 'none' ? 'block' : 'none';
    if (overlayDebug.style.display === 'block') updateDebugPanel();
  };
  overlayRoot.appendChild(text);
  overlayRoot.appendChild(dbg);
  overlayRoot.appendChild(btn);
  document.body.appendChild(overlayRoot);

  overlayDebug = document.createElement('div');
  overlayDebug.style.cssText = 'position:fixed;top:54px;right:10px;z-index:2147483647;background:rgba(0,0,0,.92);color:#0f0;padding:8px 10px;border-radius:8px;font:11px monospace;max-width:380px;max-height:40vh;overflow:auto;display:none;white-space:pre-wrap;';
  overlayDebug.id = 'boldtake-debug';
  document.body.appendChild(overlayDebug);

  // Toast container (bottom-left)
  if (!document.getElementById('boldtake-toasts')) {
    const tc = document.createElement('div');
    tc.id = 'boldtake-toasts';
    tc.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(tc);
  }
}
function setStatus(message) {
  const el = document.getElementById('boldtake-status-text');
  if (el) el.textContent = message;
}

function updateDebug(info) {
  lastDebugInfo = { ...(lastDebugInfo||{}), ...(info||{}) };
}

function updateDebugPanel() {
  if (!overlayDebug) return;
  const dbg = {
    status: document.getElementById('boldtake-status-text')?.textContent || '',
    ...lastDebugInfo
  };
  const pretty = JSON.stringify(dbg, (k, v) => typeof v === 'string' && v.length > 600 ? v.slice(0, 600) + '…' : v, 2);
  overlayDebug.textContent = pretty;
}

function toast(message) {
  if (!NARRATE) return;
  const host = document.getElementById('boldtake-toasts');
  if (!host) return;
  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = 'background:#0f1419;color:#fff;padding:8px 10px;border-radius:10px;font:12px system-ui;box-shadow:0 2px 12px rgba(0,0,0,.35);opacity:0.96;max-width:320px;';
  host.appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .25s ease, transform .25s ease'; el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; }, 2200);
  setTimeout(() => { el.remove(); }, 2600);
}

function isOnX() {
  return location.hostname.includes('twitter.com') || location.hostname.includes('x.com');
}

async function ensureOnSearch(query) {
  console.log(`🔍 ensureOnSearch called with query: "${query}"`);
  
  if (!query || query.trim() === '') {
    console.error('❌ No search query provided, using default');
    query = 'min_faves:500 lang:en';
  }
  
  const url = new URL(location.href);
  const isSearch = url.pathname.startsWith('/search');
  const q = `q=${encodeURIComponent(query.trim())}`;
  const targetUrl = `https://${location.hostname}/search?${q}&src=typed_query&f=live`;
  
  console.log(`📍 Current URL: ${location.href}`);
  console.log(`🎯 Target URL: ${targetUrl}`);
  console.log(`🔍 Is on search page: ${isSearch}`);
  console.log(`🔍 URL contains query: ${url.search.includes(q)}`);
  
  if (!isSearch || !url.search.includes(q)) {
    console.log('🚀 Need to navigate to search page...');
    console.log('💾 Storing automation state before navigation...');
    
    // Store the fact that we want to continue automation after navigation
    await chrome.storage.local.set({
      'xengager_continue_after_nav': true,
      'xengager_nav_timestamp': Date.now()
    });
    
    toast(`Navigating to search: ${query}`);
    
    // Navigate to search page
    location.href = targetUrl;
    
    // The page will reload, so execution stops here
    // The continuation will be handled by the message listener
    return;
  } else {
    console.log('✅ Already on correct search page');
  }
}

async function ensureOnHome() {
  if (!/^\/(home|)$/.test(location.pathname)) {
    location.href = `https://${location.hostname}/home`;
    await new Promise(resolve => {
      const i = setInterval(() => {
        if (document.readyState === 'complete') { clearInterval(i); resolve(); }
      }, 300);
    });
  }
}

function getTweetNodes() {
  // Enhanced selectors for tweets across different X.com pages
  const selectors = [
    'article[data-testid="tweet"]',           // Standard tweets
    'article[role="article"]',                // Alternative article selector
    'div[data-testid="tweet"]',               // Sometimes tweets use div
    '[data-testid="tweetText"]',              // Tweet text containers
  ];
  
  let tweets = [];
  for (const selector of selectors) {
    const elements = Array.from(document.querySelectorAll(selector));
    if (elements.length > 0) {
      // For tweet text containers, find parent articles
      if (selector.includes('tweetText')) {
        tweets = elements.map(el => el.closest('article')).filter(Boolean);
      } else {
        tweets = elements;
      }
      break; // Use first selector that finds tweets
    }
  }
  
  // Filter out duplicate tweets and ensure they have content
  const uniqueTweets = tweets.filter((tweet, index, arr) => {
    if (!tweet || !tweet.isConnected) return false;
    
    // Check for duplicate by position or content
    const rect = tweet.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    
    // Ensure tweet has text content
    const hasText = tweet.querySelector('div[lang], [data-testid="tweetText"]');
    if (!hasText) return false;
    
    // Remove duplicates by checking if same position
    const isDuplicate = arr.slice(0, index).some(prevTweet => {
      const prevRect = prevTweet.getBoundingClientRect();
      return Math.abs(rect.top - prevRect.top) < 10 && Math.abs(rect.left - prevRect.left) < 10;
    });
    
    return !isDuplicate;
  });
  
  console.log(`🔍 getTweetNodes found ${uniqueTweets.length} unique tweets (from ${tweets.length} raw elements)`);
  return uniqueTweets;
}

function extractTextFromTweet(article) {
  // Ignore media-only tweets: must have meaningful text
  const textEl = article.querySelector('div[lang]');
  const text = textEl?.innerText?.trim() || '';
  return text.length >= 10 ? text : '';
}

function queryComposer() {
  // Prefer dialog-scoped composer
  const dialog = document.querySelector('div[role="dialog"]') || document;
  return (
    dialog.querySelector('div[aria-label="Tweet text"] div[contenteditable="true"]') ||
    dialog.querySelector('div[aria-label="Post text"] div[contenteditable="true"]') ||
    dialog.querySelector('div[data-testid="tweetTextarea_0"] div[contenteditable="true"]') ||
    dialog.querySelector('div[role="textbox"][data-testid="tweetTextarea_0"]') ||
    dialog.querySelector('div[role="textbox"][contenteditable="true"]') ||
    document.querySelector('div[data-testid="tweetTextarea_0"] div[contenteditable="true"]') ||
    document.querySelector('div[aria-label="Post text"] div[contenteditable="true"]') ||
    document.querySelector('div[role="textbox"][contenteditable="true"]')
  );
}

function queryReplyButton(article) {
  return (
    article.querySelector('button[data-testid="reply"]') ||
    article.querySelector('div[data-testid="reply"]') ||
    article.querySelector('button[aria-label^="Reply"]')
  );
}

async function openReplyComposer(article) {
  const replyBtn = queryReplyButton(article);
  if (!replyBtn) return null;
  replyBtn.click();
  // Try to find an inline composer under this article first
  for (let i = 0; i < 80; i++) {
    const inline = article.parentElement?.querySelector('div[data-testid="tweetTextarea_0"] div[contenteditable="true"]');
    if (inline) return inline;
    const composer = queryComposer();
    if (composer) return composer;
    await waitMs(150);
  }
  return null;
}

function setComposerText(composer, text) {
  console.log('🎯 setComposerText called with text:', `"${text}"`);
  console.log('📏 Text length:', text.length);
  
  // Check if composer already has the exact same content (prevent exact duplicates only)
  const existingContent = (composer.textContent || composer.innerText || '').trim();
  if (existingContent === text.trim() && existingContent.length > 10) {
    console.log('✅ Exact same text already present, skipping duplicate typing');
    return;
  }
  
  console.log('🎯 Proceeding to type text into composer...');
  
  // Enforce 280 character limit for X
  if (text.length > 280) {
    text = text.substring(0, 277) + '...';
    console.log('⚠️ Text truncated to 280 characters for X limit');
    console.log('✂️ Truncated text:', `"${text}"`);
  }
  
  // CRITICAL: X.com requires very specific sequence to activate React state
  composer.focus();
  
  // Method 1: Simulate real user typing to trigger React properly - ONCE ONLY
  console.log('🎯 Starting ONE confident response typing...');
  simulateRealUserInput(composer, text);
}

async function simulateRealUserInput(composer, text) {
  console.log('⌨️ simulateRealUserInput called with text:', `"${text}"`);
  console.log('📝 About to type:', text.length, 'characters');
  
  // CRITICAL: Try to activate the composer first with multiple strategies
  console.log('🎯 AGGRESSIVE COMPOSER ACTIVATION...');
  
  // Strategy 1: Multiple focus and click attempts
  for (let i = 0; i < 3; i++) {
    composer.focus();
    composer.click();
    await waitMs(50);
  }
  
  // Strategy 2: Try to find and click the reply button first to ensure composer is active
  const parentElement = composer.closest('article, [data-testid="tweet"]');
  if (parentElement) {
    const replyButton = findReplyButton(parentElement);
    if (replyButton && !replyButton.disabled) {
      console.log('🔄 Clicking reply button to ensure composer is active...');
      replyButton.click();
      await waitMs(200);
    }
  }
  
  // Strategy 3: Look for any form elements and try to activate them
  const form = composer.closest('form');
  if (form) {
    console.log('📝 Found form element, triggering form events...');
    const formEvent = new Event('focusin', { bubbles: true });
    form.dispatchEvent(formEvent);
  }
  
  // Step 1: Ensure composer is focused and ready
  composer.focus();
  await waitMs(100);
  
  // Step 2: Clear any existing content more aggressively
  console.log('🧹 Clearing existing content...');
  
  // Method 1: Select all and delete using keyboard events
  composer.focus();
  await waitMs(100);
  
  // Select all content
  const selectAllEvent = new KeyboardEvent('keydown', {
    key: 'a',
    code: 'KeyA',
    ctrlKey: !navigator.platform.includes('Mac'),
    metaKey: navigator.platform.includes('Mac'),
    bubbles: true,
    cancelable: true
  });
  composer.dispatchEvent(selectAllEvent);
  await waitMs(50);
  
  // Delete selected content
  const deleteEvent = new KeyboardEvent('keydown', {
    key: 'Backspace',
    code: 'Backspace',
    bubbles: true,
    cancelable: true
  });
  composer.dispatchEvent(deleteEvent);
  await waitMs(50);
  
  // Method 2: Direct content clearing as backup
  if (composer.textContent || composer.innerText) {
    composer.textContent = '';
    composer.innerText = '';
    composer.innerHTML = '<div><br></div>'; // X.com format
  }
  
  // Verify composer is empty
  const existingContent = composer.textContent || composer.innerText || '';
  console.log('🔍 Content after clearing:', `"${existingContent}"`);
  
  // Step 3: Type each character using REAL keyboard events
  // This is what X.com actually listens for!
  console.log(`⌨️ Starting to type ${text.length} characters...`);
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    console.log(`⌨️ Typing character ${i + 1}/${text.length}: "${char}"`);
    
    // Focus before each character to ensure events are captured
    composer.focus();
    await waitMs(10);
    
    await typeCharacterWithKeyboard(composer, char);
    
    // Reduce event frequency to avoid React conflicts
    if (i % 5 === 0) { // Only every 5th character
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      composer.dispatchEvent(inputEvent);
    }
    
    // Verify character was inserted
    const currentContent = composer.textContent || composer.innerText || '';
    console.log(`📝 Composer content after char ${i + 1}: "${currentContent}"`);
    
    // If content isn't updating after first few characters, try gentle fallback
    if (i < 5 && currentContent.length === 0) {
      console.log('⚠️ Gentle fallback - ensuring composer has content');
      composer.textContent = text.substring(0, i + 1);
      
      // Single gentle update
      const inputEvent2 = new Event('input', { bubbles: true });
      composer.dispatchEvent(inputEvent2);
    }
    
    // Slightly faster human typing speed with realistic pauses
    let delay = 60 + Math.random() * 80; // Base: 60-140ms per character (faster)
    
    // Longer pauses after punctuation (like humans do)
    if (char.match(/[.!?]/)) {
      delay += 150 + Math.random() * 250; // Extra 150-400ms after sentences
    } else if (char === ' ') {
      delay += 30 + Math.random() * 70; // Extra 30-100ms between words
    } else if (char === ',') {
      delay += 80 + Math.random() * 120; // Extra 80-200ms after commas
    }
    
    await waitMs(delay);
    
    // CRITICAL: Force button activation after every few characters
    if (i % 3 === 0 || i < 5) { // Check every 3rd character and first 5
      console.log(`🔍 Checking if button activated after character ${i + 1}...`);
      const btn = getReplyButtonFromComposer(composer);
      const isActive = isReplyButtonEnabled(btn);
      
      if (isActive) {
        console.log(`✅ Button activated after character ${i + 1}! Reply button is now active.`);
      } else {
        console.log(`⚠️ Button still not activated after character ${i + 1}, forcing activation...`);
        
        // NUCLEAR OPTION: Multiple aggressive activation strategies
        composer.focus();
        composer.click();
        
        // Strategy 1: Force text content update
        const textLength = currentContent.length;
        if (textLength > 0) {
          // Simulate backspace and retype to trigger React
          const backspaceEvent = new KeyboardEvent('keydown', {
            key: 'Backspace',
            code: 'Backspace',
            bubbles: true
          });
          composer.dispatchEvent(backspaceEvent);
          
          // Retype the last character
          const lastChar = currentContent[textLength - 1];
          await typeCharacterWithKeyboard(composer, lastChar);
        }
        
        // Strategy 2: Composition events
        const compositionEvent = new CompositionEvent('compositionupdate', {
          data: currentContent,
          bubbles: true
        });
        composer.dispatchEvent(compositionEvent);
        
        // Strategy 3: Selection and cursor events
        const selectionEvent = new Event('selectionchange', { bubbles: true });
        document.dispatchEvent(selectionEvent);
        
        // Strategy 4: Force React state update
        triggerReactStateUpdate(composer);
        
        await waitMs(50);
      }
    }
  }
  
  // Final verification
  const finalContent = composer.textContent || composer.innerText || '';
  console.log('✅ Typing completed. Final content:', `"${finalContent}"`);
  console.log('🔍 Expected vs Actual:', {
    expected: text,
    actual: finalContent,
    match: text === finalContent
  });
}

async function selectAllAndDelete(composer) {
  composer.focus();
  
  // Send Ctrl+A (or Cmd+A on Mac) to select all
  const selectAllKey = isMac() ? 'metaKey' : 'ctrlKey';
  const selectAllEvent = new KeyboardEvent('keydown', {
    key: 'a',
    code: 'KeyA',
    [selectAllKey]: true,
    bubbles: true,
    cancelable: true
  });
  composer.dispatchEvent(selectAllEvent);
  
  await waitMs(10);
  
  // Send Delete key to clear content
  const deleteEvent = new KeyboardEvent('keydown', {
    key: 'Delete',
    code: 'Delete',
    bubbles: true,
    cancelable: true
  });
  composer.dispatchEvent(deleteEvent);
  
  await waitMs(10);
}

async function typeCharacterWithKeyboard(composer, char) {
  // This simulates exactly what happens when you press a key on your keyboard
  const keyCode = char.charCodeAt(0);
  const key = char;
  const code = getKeyCode(char);
  
  // Step 1: keydown event
  const keydownEvent = new KeyboardEvent('keydown', {
    key: key,
    code: code,
    keyCode: keyCode,
    which: keyCode,
    charCode: 0,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  composer.dispatchEvent(keydownEvent);
  
  // Step 2: keypress event (for character keys)
  if (char.match(/[a-zA-Z0-9\s.,!?'"]/)) {
    const keypressEvent = new KeyboardEvent('keypress', {
      key: key,
      code: code,
      keyCode: keyCode,
      which: keyCode,
      charCode: keyCode,
      bubbles: true,
      cancelable: true,
      composed: true
    });
    composer.dispatchEvent(keypressEvent);
  }
  
  // Step 3: beforeinput event (modern browsers)
  const beforeInputEvent = new InputEvent('beforeinput', {
    inputType: 'insertText',
    data: char,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  composer.dispatchEvent(beforeInputEvent);
  
  // Step 4: CRITICAL - Multiple insertion methods to trigger React
  
  // Method 1: execCommand (traditional)
  document.execCommand('insertText', false, char);
  
  // Method 2: Direct React fiber manipulation (AGGRESSIVE)
  try {
    // Find React fiber on the composer element
    const reactKey = Object.keys(composer).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));
    if (reactKey) {
      const fiber = composer[reactKey];
      if (fiber && fiber.memoizedProps && fiber.memoizedProps.onChange) {
        // Trigger React onChange directly
        const syntheticEvent = {
          target: composer,
          currentTarget: composer,
          type: 'input',
          bubbles: true,
          cancelable: true,
          preventDefault: () => {},
          stopPropagation: () => {}
        };
        fiber.memoizedProps.onChange(syntheticEvent);
      }
    }
  } catch (e) {
    console.log('React fiber manipulation failed, continuing with other methods');
  }
  
  // Method 3: Force React re-render by modifying the DOM and triggering MutationObserver
  const currentText = composer.textContent || '';
  if (!currentText.includes(char)) {
    composer.textContent = currentText + char;
    composer.innerText = currentText + char;
    
    // Trigger MutationObserver which React often uses
    const observer = new MutationObserver(() => {});
    observer.observe(composer, { childList: true, subtree: true, characterData: true });
    observer.disconnect();
  }
  
  // Step 5: Multiple input events to ensure React detects change
  const inputEvent = new InputEvent('input', {
    inputType: 'insertText',
    data: char,
    bubbles: true,
    cancelable: false,
    composed: true
  });
  composer.dispatchEvent(inputEvent);
  
  // Additional input event for React compatibility
  const inputEvent2 = new Event('input', {
    bubbles: true,
    cancelable: true
  });
  composer.dispatchEvent(inputEvent2);
  
  // Change event to trigger React form updates
  const changeEvent = new Event('change', {
    bubbles: true,
    cancelable: true
  });
  composer.dispatchEvent(changeEvent);
  
  // Step 6: keyup event
  const keyupEvent = new KeyboardEvent('keyup', {
    key: key,
    code: code,
    keyCode: keyCode,
    which: keyCode,
    charCode: 0,
    bubbles: true,
    cancelable: true,
    composed: true
  });
  composer.dispatchEvent(keyupEvent);
  
  // CRITICAL: Force React to check button state after each character
  await waitMs(5);
  
  // Dispatch additional events that React might be listening for
  const propertyChangeEvent = new Event('propertychange', { bubbles: true });
  composer.dispatchEvent(propertyChangeEvent);
  
  // Focus events to ensure React knows the field is active
  const focusEvent = new FocusEvent('focus', { bubbles: true });
  composer.dispatchEvent(focusEvent);
  
  // NUCLEAR OPTION: Try to find and trigger X.com's specific React handlers
  try {
    // Look for React event handlers on the composer or its parents
    let element = composer;
    for (let i = 0; i < 5; i++) { // Check up to 5 parent levels
      if (element) {
        // Check for React props that might contain onChange handlers
        const reactProps = Object.keys(element).find(key => key.startsWith('__reactProps'));
        if (reactProps && element[reactProps] && element[reactProps].onChange) {
          console.log('🎯 Found React onChange handler, triggering...');
          element[reactProps].onChange({
            target: composer,
            currentTarget: composer,
            type: 'input'
          });
          break;
        }
        element = element.parentElement;
      }
    }
  } catch (e) {
    console.log('React handler search failed:', e.message);
  }
  
  // LAST RESORT: Simulate a complete user interaction sequence
  setTimeout(() => {
    composer.focus();
    composer.click();
    
    // Dispatch a custom event that might trigger X.com's listeners
    const customEvent = new CustomEvent('x-composer-change', {
      bubbles: true,
      detail: { text: composer.textContent }
    });
    composer.dispatchEvent(customEvent);
    
    // Try to trigger any data-* attribute handlers
    if (composer.dataset) {
      Object.keys(composer.dataset).forEach(key => {
        if (key.includes('testid') || key.includes('change')) {
          console.log(`🔍 Found data attribute: ${key}`);
        }
      });
    }
  }, 1);
}

function getKeyCode(char) {
  // Convert character to proper key code
  if (char === ' ') return 'Space';
  if (char === '.') return 'Period';
  if (char === ',') return 'Comma';
  if (char === '!') return 'Digit1'; // Shift+1
  if (char === '?') return 'Slash'; // Shift+/
  if (char === "'") return 'Quote';
  if (char === '"') return 'Quote'; // Shift+'
  if (char.match(/[a-zA-Z]/)) return `Key${char.toUpperCase()}`;
  if (char.match(/[0-9]/)) return `Digit${char}`;
  return 'Unknown';
}

function triggerReactStateUpdate(composer) {
  console.log('⚛️ Triggering React state update - BULLETPROOF MODE');
  
  try {
    // SAFE Method 1: Focus composer
    composer.focus();
    
    // SAFE Method 2: Simple input event only
    const inputEvent = new Event('input', { 
      bubbles: true, 
      cancelable: true 
    });
    composer.dispatchEvent(inputEvent);
    
    // SAFE Method 3: BULLETPROOF cursor positioning
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      
      // CRITICAL FIX: Ultra-safe range handling
      if (composer.childNodes.length > 0) {
        const lastNode = composer.childNodes[composer.childNodes.length - 1];
        
        if (lastNode.nodeType === Node.TEXT_NODE && lastNode.textContent) {
          // BULLETPROOF: Use actual text node length with bounds checking
          const textLength = lastNode.textContent.length;
          const safeOffset = Math.max(0, Math.min(textLength, textLength));
          
          // Double-check the text node can handle this offset
          if (safeOffset <= textLength) {
            range.setStart(lastNode, safeOffset);
            range.setEnd(lastNode, safeOffset);
          } else {
            // Ultra-safe fallback: place cursor at end of composer
            range.selectNodeContents(composer);
            range.collapse(false);
          }
        } else {
          // SAFE: Non-text node or empty - use setStartAfter
          range.setStartAfter(lastNode);
          range.setEndAfter(lastNode);
        }
      } else {
        // SAFE: No content - place cursor at start of composer
        range.setStart(composer, 0);
        range.setEnd(composer, 0);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      
    } catch (rangeError) {
      console.log('⚠️ Range operation failed safely:', rangeError.message);
      // Ultimate fallback: just focus, no cursor positioning
      composer.focus();
    }
    
    // Method 4: Minimal key events that React listens for
    const inputEvent2 = new Event('input', { bubbles: true });
    composer.dispatchEvent(inputEvent2);
    
    console.log('⚛️ React state update completed safely');
    
  } catch (error) {
    console.log('⚠️ triggerReactStateUpdate failed safely:', error.message);
    // Final fallback: just focus the composer
    try {
      composer.focus();
    } catch (focusError) {
      console.log('⚠️ Even focus failed:', focusError.message);
    }
  }
}

function isDisabled(el) {
  if (!el) return true;
  
  // Check standard disabled attributes
  const aria = el.getAttribute('aria-disabled');
  if (aria === 'true') return true;
  if (el.hasAttribute('disabled')) return true;
  
  // Check computed styles
  const style = window.getComputedStyle(el);
  if (style.pointerEvents === 'none') return true;
  
  // X.com specific: Check for gray/disabled styling
  const bgColor = style.backgroundColor;
  const color = style.color;
  
  // Common disabled button colors on X.com
  if (bgColor.includes('rgb(15, 20, 25)') || // Dark disabled
      bgColor.includes('rgb(83, 100, 113)') || // Gray disabled
      bgColor.includes('rgba(15, 20, 25, 0.75)') || // Semi-transparent disabled
      color.includes('rgb(83, 100, 113)')) { // Gray text
    return true;
  }
  
  // Check opacity (but be more specific)
  const opacity = parseFloat(style.opacity);
  if (opacity < 0.6) return true;
  
  // Check if button has enabled styling (X blue background)
  if (bgColor.includes('rgb(29, 155, 240)') || // X blue
      bgColor.includes('rgb(26, 140, 216)')) { // X blue hover
    return false;
  }
  
  // Additional check: if button contains text but looks visually disabled
  const hasText = el.textContent && el.textContent.trim().length > 0;
  const rect = el.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0;
  
  if (hasText && isVisible && opacity > 0.6) {
    return false; // Likely enabled
  }
  
  return false; // Default to enabled if we can't determine
}

function findReplyButton(scope) {
  if (!scope) return null;
  
  try {
    // First, prefer buttons inside the composer toolbar when present
    const toolBar = scope.querySelector('[data-testid="toolBar"]');
    const scoped = toolBar || scope;
    
    // Enhanced selectors for X.com's latest button structures
    const candidates = [
      ...scoped.querySelectorAll('button[data-testid="tweetButtonInline"]'),
      ...scoped.querySelectorAll('div[data-testid="tweetButtonInline"]'),
      ...scoped.querySelectorAll('button[data-testid="tweetButton"]'),
      ...scoped.querySelectorAll('div[data-testid="tweetButton"]'),
      ...scoped.querySelectorAll('button[aria-label^="Reply"]'),
      ...scoped.querySelectorAll('button[aria-label^="Post"]'),
      // Additional selectors for newer X.com structures
      ...scoped.querySelectorAll('button[aria-label*="reply"]'),
      ...scoped.querySelectorAll('button[aria-label*="Post reply"]'),
      ...scoped.querySelectorAll('div[role="button"][aria-label*="reply"]'),
      ...scoped.querySelectorAll('div[role="button"][aria-label*="Post"]'),
      // CSS-based selectors for buttons with specific styling
      ...scoped.querySelectorAll('button[style*="background-color: rgb(29, 155, 240)"]'), // X blue
      ...scoped.querySelectorAll('div[role="button"][style*="background-color: rgb(29, 155, 240)"]')
    ];
    
    // Filter for visible and enabled buttons
    const visible = candidates.filter(b => {
      const rect = b.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (b.offsetParent || b.getClientRects().length);
    });
    
    // Prefer enabled buttons, but fall back to any visible button
    const enabled = visible.filter(b => !isDisabled(b));
    if (enabled.length) return enabled[0];
    if (visible.length) return visible[0];
    
    // Explicit text match on nested span: "Reply" or "Post"
    const textMatches = ['reply', 'post', 'tweet'];
    for (const text of textMatches) {
      const span = Array.from(scoped.querySelectorAll('span')).find(s => 
        (s.textContent || '').trim().toLowerCase() === text
      );
      if (span) {
        const btn = span.closest('button, div[role="button"]');
        if (btn && !isDisabled(btn)) return btn;
      }
    }
    
    // Next, try outside toolbar but nearby
    const nearby = [
      ...scope.querySelectorAll('button[data-testid="tweetButtonInline"], div[data-testid="tweetButtonInline"], button[data-testid="tweetButton"], div[data-testid="tweetButton"]')
    ];
    const nearVisible = nearby.filter(b => (b.offsetParent || b.getClientRects().length));
    if (nearVisible.length) return nearVisible.find(b => !isDisabled(b)) || nearVisible[0];
    
    // Fallback: any button/div role=button whose visible text contains reply/post
    const allBtns = Array.from(scope.querySelectorAll('button, div[role="button"]'));
    const byText = allBtns.find(b => /\b(reply|post|tweet)\b/i.test((b.textContent || '').trim()));
    return byText || null;
    
  } catch (error) {
    console.error('Error in findReplyButton:', error);
    return null;
  }
}

function mouseClick(el) {
  if (!(el instanceof HTMLElement)) return;
  
  // Get element position for realistic click coordinates
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  // Comprehensive mouse event sequence with proper coordinates
  const events = [
    'pointerover',
    'pointerenter', 
    'mouseover',
    'mouseenter',
    'pointermove',
    'mousemove',
    'pointerdown',
    'mousedown',
    'focus',
    'pointerup',
    'mouseup',
    'click'
  ];
  
  for (const type of events) {
    const event = new MouseEvent(type, { 
      bubbles: true, 
      cancelable: true, 
      view: window,
      clientX: x,
      clientY: y,
      screenX: x,
      screenY: y,
      button: 0,
      buttons: type.includes('down') ? 1 : 0
    });
    el.dispatchEvent(event);
  }
  
  // Also try direct click as fallback
  try {
    el.click();
  } catch (e) {
    console.warn('Direct click failed:', e);
  }
}

async function clickSend(composer, replyText) {
  console.log('🚀 TRIPLE-REDUNDANT SEND FUNCTION - Starting...');
  console.log('🔍 Composer element:', composer);
  console.log('📝 Reply text to send:', `"${replyText}"`);
  
  // Find composer if not provided or disconnected
  if (!composer || !composer.isConnected) {
    console.log('🔍 Composer not connected, finding fresh composer...');
    composer = document.querySelector('[data-testid="tweetTextarea_0"]') || 
               document.querySelector('[role="textbox"]') ||
               document.querySelector('.DraftEditor-editorContainer [contenteditable]') ||
               document.querySelector('[contenteditable][aria-label*="text"]');
               
    if (!composer) {
      console.error('❌ CRITICAL: No composer found anywhere on page');
      return false;
    }
    console.log('✅ Found fresh composer:', composer);
  }
  
  // Check composer text with multiple methods
  const composerText1 = composer.innerText?.trim() || '';
  const composerText2 = composer.textContent?.trim() || '';
  const composerText3 = composer.value?.trim() || '';
  
  console.log('📝 Composer text check (innerText):', `"${composerText1.slice(0, 50)}..." (${composerText1.length} chars)`);
  console.log('📝 Composer text check (textContent):', `"${composerText2.slice(0, 50)}..." (${composerText2.length} chars)`);
  console.log('📝 Composer text check (value):', `"${composerText3.slice(0, 50)}..." (${composerText3.length} chars)`);
  
  const hasAnyText = composerText1 || composerText2 || composerText3;
  if (!hasAnyText) {
    console.error('❌ CRITICAL: Composer is completely empty by all methods');
    // Try to re-insert text one more time
    console.log('🔄 Attempting to re-insert text...');
    await simulateRealUserInput(composer, replyText);
    await waitMs(2000);
    
    const retryText = composer.innerText?.trim() || composer.textContent?.trim() || '';
    if (!retryText) {
      console.error('❌ CRITICAL: Still no text after retry, aborting send');
      return false;
    }
    console.log('✅ Text re-inserted successfully');
  }
  
  // TRIPLE-REDUNDANT BUTTON DETECTION
  console.log('🔍 PHASE 1: Looking for send button with comprehensive strategy...');
  
  let sendButton = null;
  
  // STRATEGY 1: X.com specific data-testid selectors
  console.log('🎯 Strategy 1: X.com data-testid selectors');
  const xSelectors = [
    '[data-testid="tweetButton"]',
    '[data-testid="tweetButtonInline"]',
    '[data-testid="toolBar"] [role="button"]',
    '[aria-label*="Reply"]',
    '[aria-label*="Post reply"]',
    '[aria-label*="Tweet"]'
  ];
  
  const scopes = [
    composer.closest('div[role="dialog"]'),
    composer.closest('article'),
    composer.closest('form'),
    composer.parentElement?.parentElement,
    document
  ].filter(Boolean);
  
  console.log(`🔍 Searching in ${scopes.length} scopes:`, scopes.map(s => s.tagName));
  
  for (let scopeIndex = 0; scopeIndex < scopes.length; scopeIndex++) {
    const scope = scopes[scopeIndex];
    console.log(`🔍 Scope ${scopeIndex + 1}: ${scope.tagName} ${scope.className || ''}`);
    
    for (let selectorIndex = 0; selectorIndex < xSelectors.length; selectorIndex++) {
      const selector = xSelectors[selectorIndex];
      console.log(`  🎯 Trying selector: ${selector}`);
      
      try {
        const buttons = scope.querySelectorAll(selector);
        console.log(`    📊 Found ${buttons.length} buttons with this selector`);
        
        for (let btnIndex = 0; btnIndex < buttons.length; btnIndex++) {
          const btn = buttons[btnIndex];
          const rect = btn.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          const isDisabled = btn.disabled || btn.hasAttribute('aria-disabled') === 'true';
          const bgColor = getComputedStyle(btn).backgroundColor;
          const textContent = btn.textContent?.trim() || '';
          
          console.log(`    🔘 Button ${btnIndex + 1}:`, {
            visible: isVisible,
            disabled: isDisabled,
            size: `${rect.width}x${rect.height}`,
            bgColor: bgColor,
            text: textContent.slice(0, 20),
            ariaLabel: btn.getAttribute('aria-label')
          });
          
          // Check if this is a valid send button
          const isValidSendButton = isVisible && !isDisabled && (
            bgColor.includes('29, 155, 240') || // X blue
            bgColor.includes('15, 20, 25') ||   // X dark mode
            textContent.toLowerCase().includes('reply') ||
            textContent.toLowerCase().includes('post') ||
            btn.getAttribute('aria-label')?.toLowerCase().includes('reply')
          );
          
          if (isValidSendButton) {
            console.log(`✅ FOUND VALID SEND BUTTON! Strategy 1, Scope ${scopeIndex + 1}, Selector ${selectorIndex + 1}, Button ${btnIndex + 1}`);
            sendButton = btn;
            break;
          }
        }
        if (sendButton) break;
      } catch (e) {
        console.warn(`⚠️ Error with selector ${selector}:`, e.message);
      }
    }
    if (sendButton) break;
  }
  
  // STRATEGY 2: If no button found, try visual detection
  if (!sendButton) {
    console.log('🎯 Strategy 2: Visual button detection by color and position');
    const allButtons = document.querySelectorAll('button, div[role="button"]');
    console.log(`🔍 Scanning ${allButtons.length} total buttons on page`);
    
    for (let i = 0; i < allButtons.length; i++) {
      const btn = allButtons[i];
      const rect = btn.getBoundingClientRect();
      const style = getComputedStyle(btn);
      
      // Check if button is in the right area (near composer)
      const composerRect = composer.getBoundingClientRect();
      const isNearComposer = Math.abs(rect.top - composerRect.bottom) < 200;
      
      if (rect.width > 0 && rect.height > 0 && isNearComposer) {
        const bgColor = style.backgroundColor;
        const isBlue = bgColor.includes('29, 155, 240') || bgColor.includes('26, 140, 216');
        const hasReplyText = btn.textContent?.toLowerCase().includes('reply') || 
                           btn.textContent?.toLowerCase().includes('post');
        
        if (isBlue || hasReplyText) {
          console.log(`✅ FOUND BUTTON BY VISUAL DETECTION! Button ${i}`);
          console.log(`📊 Button details:`, {
            text: btn.textContent?.trim().slice(0, 30),
            bgColor: bgColor,
            size: `${rect.width}x${rect.height}`,
            nearComposer: isNearComposer
          });
          sendButton = btn;
          break;
        }
      }
    }
  }
  
  // STRATEGY 3: Last resort - find any clickable element with "Reply" or similar
  if (!sendButton) {
    console.log('🎯 Strategy 3: Last resort text-based detection');
    const textElements = document.querySelectorAll('*');
    for (const el of textElements) {
      const text = el.textContent?.trim().toLowerCase() || '';
      const isClickable = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      
      if (isClickable && isVisible && (text === 'reply' || text === 'post' || text === 'tweet')) {
        console.log(`✅ FOUND BUTTON BY TEXT! Text: "${text}"`);
        sendButton = el;
        break;
      }
    }
  }
  
  if (!sendButton) {
    console.error('❌ CRITICAL FAILURE: Could not find send button with ANY strategy');
    console.log('🔍 Debug: Composer area HTML:', composer.closest('div[role="dialog"]')?.outerHTML.slice(0, 500));
    return false;
  }
  
  console.log('🎉 SUCCESS: Send button found!');
  console.log('📊 Final button details:', {
    tagName: sendButton.tagName,
    className: sendButton.className,
    textContent: sendButton.textContent?.trim(),
    ariaLabel: sendButton.getAttribute('aria-label'),
    dataTestId: sendButton.getAttribute('data-testid')
  });
  
  // TRIPLE-REDUNDANT CLICKING SEQUENCE
  console.log('🚀 PHASE 2: Executing triple-redundant click sequence...');
  
  // Pre-click preparation
  composer.focus();
  await waitMs(200);
  
  // CLICK METHOD 1: Comprehensive mouse event simulation
  console.log('🖱️ Method 1: Comprehensive mouse event simulation');
  try {
    const rect = sendButton.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseEvents = [
      { type: 'mouseover', clientX: centerX, clientY: centerY },
      { type: 'mouseenter', clientX: centerX, clientY: centerY },
      { type: 'mousemove', clientX: centerX, clientY: centerY },
      { type: 'mousedown', clientX: centerX, clientY: centerY, button: 0 },
      { type: 'mouseup', clientX: centerX, clientY: centerY, button: 0 },
      { type: 'click', clientX: centerX, clientY: centerY, button: 0 }
    ];
    
    for (const eventData of mouseEvents) {
      const event = new MouseEvent(eventData.type, {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: eventData.clientX,
        clientY: eventData.clientY,
        button: eventData.button || 0,
        buttons: eventData.type.includes('down') ? 1 : 0
      });
      sendButton.dispatchEvent(event);
      await waitMs(50);
    }
    
    console.log('✅ Method 1 completed');
    await waitMs(2000);
    
    // Check if sent
    if (await verifySent(composer, replyText)) {
      console.log('🎉 SUCCESS! Reply sent via Method 1 (mouse events)');
      return true;
    }
  } catch (e) {
    console.error('❌ Method 1 failed:', e.message);
  }
  
  // CLICK METHOD 2: Direct button click
  console.log('🖱️ Method 2: Direct button click');
  try {
    sendButton.focus();
    await waitMs(100);
    sendButton.click();
    
    console.log('✅ Method 2 completed');
    await waitMs(2000);
    
    if (await verifySent(composer, replyText)) {
      console.log('🎉 SUCCESS! Reply sent via Method 2 (direct click)');
      return true;
    }
  } catch (e) {
    console.error('❌ Method 2 failed:', e.message);
  }
  
  // CLICK METHOD 3: Keyboard activation
  console.log('⌨️ Method 3: Keyboard activation');
  try {
    sendButton.focus();
    await waitMs(100);
    
    // Press Enter on the button
    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    sendButton.dispatchEvent(enterEvent);
    
    await waitMs(100);
    
    const enterUpEvent = new KeyboardEvent('keyup', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    sendButton.dispatchEvent(enterUpEvent);
    
    console.log('✅ Method 3 completed');
    await waitMs(2000);
    
    if (await verifySent(composer, replyText)) {
      console.log('🎉 SUCCESS! Reply sent via Method 3 (keyboard)');
      return true;
    }
  } catch (e) {
    console.error('❌ Method 3 failed:', e.message);
  }
  
  // CLICK METHOD 4: Ctrl/Cmd+Enter shortcut
  console.log('⌨️ Method 4: Ctrl/Cmd+Enter shortcut');
  try {
    composer.focus();
    await waitMs(100);
    
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const shortcutEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      [isMac ? 'metaKey' : 'ctrlKey']: true,
      bubbles: true,
      cancelable: true
    });
    
    composer.dispatchEvent(shortcutEvent);
    document.dispatchEvent(shortcutEvent);
    
    console.log(`✅ Method 4 completed (${isMac ? 'Cmd' : 'Ctrl'}+Enter)`);
    await waitMs(2000);
    
    if (await verifySent(composer, replyText)) {
      console.log('🎉 SUCCESS! Reply sent via Method 4 (shortcut)');
      return true;
    }
  } catch (e) {
    console.error('❌ Method 4 failed:', e.message);
  }
  
  // CLICK METHOD 5: Force trigger all possible events
  console.log('🔥 Method 5: Nuclear option - trigger all events');
  try {
    const allEvents = [
      'focus', 'click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
      'touchstart', 'touchend', 'keydown', 'keypress', 'keyup'
    ];
    
    sendButton.focus();
    await waitMs(100);
    
    for (const eventType of allEvents) {
      try {
        let event;
        if (eventType.includes('key')) {
          event = new KeyboardEvent(eventType, {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            bubbles: true,
            cancelable: true
          });
        } else {
          event = new Event(eventType, { bubbles: true, cancelable: true });
        }
        sendButton.dispatchEvent(event);
      } catch (e) {
        // Ignore individual event errors
      }
    }
    
    console.log('✅ Method 5 completed');
    await waitMs(3000);
    
    if (await verifySent(composer, replyText)) {
      console.log('🎉 SUCCESS! Reply sent via Method 5 (nuclear option)');
      return true;
    }
  } catch (e) {
    console.error('❌ Method 5 failed:', e.message);
  }
  
  console.error('❌ TOTAL FAILURE: All 5 click methods failed');
  console.log('🔍 Final debug - button state:', {
    connected: sendButton.isConnected,
    visible: sendButton.getBoundingClientRect().width > 0,
    disabled: sendButton.disabled,
    ariaDisabled: sendButton.getAttribute('aria-disabled'),
    computedStyle: getComputedStyle(sendButton).backgroundColor
  });
  
  return false;
}

// Verification function to check if reply was sent
async function verifySent(composer, replyText) {
  console.log('🔍 Verifying if reply was sent...');
  
  // Method 1: Check if composer is gone or empty
  if (!composer || !composer.isConnected) {
    console.log('✅ Composer disconnected - likely sent');
    return true;
  }
  
  const composerText = (composer.innerText || composer.textContent || '').trim();
  if (!composerText || composerText.length < 10) {
    console.log('✅ Composer empty/minimal - likely sent');
    return true;
  }
  
  // Method 2: Look for success indicators in DOM
  const successSelectors = [
    '[data-testid="toast"]',
    '.notification',
    '[role="status"]'
  ];
  
  for (const selector of successSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const el of elements) {
      const text = (el.textContent || '').toLowerCase();
      if (text.includes('sent') || text.includes('posted') || text.includes('reply')) {
        console.log('✅ Success indicator found:', text.slice(0, 50));
        return true;
      }
    }
  }
  
  // Method 3: Look for the reply in recent tweets
  if (replyText && replyText.length > 10) {
    const probe = replyText.split(/\s+/).slice(0, 5).join(' ');
    const articles = document.querySelectorAll('article');
    
    for (const article of articles) {
      const articleText = (article.innerText || '').trim();
      if (articleText.includes(probe)) {
        console.log('✅ Reply found in page content');
        return true;
      }
    }
  }
  
  console.log('❌ No send verification found');
  return false;
}

// OpenAI API integration function
async function generateWithOpenAI(templateId, selectedText, prefs) {
  console.log(`🤖 Calling OpenAI with template ${templateId}`);
  
  const payload = {
    templateId,
    selectedText,
    model: prefs.xengager_model || 'gpt-4',
    language: prefs.language || 'English',
    tone: prefs.tone || 'Neutral',
    style: prefs.style || 'Informal'
  };
  
  try {
    const res = await chrome.runtime.sendMessage({ type: 'XENGAGER_OPENAI', payload });
    if (!res?.ok) {
      throw new Error(res?.error || 'OpenAI API failed');
    }
    console.log(`✅ OpenAI response received: "${res.text.slice(0, 50)}..."`);
    return res.text;
  } catch (error) {
    console.error('❌ OpenAI generation error:', error);
    throw error;
  }
}

// Main automation function - the heart of the extension
async function runOnceOnCurrentPage() {
  if (BOLDTAKE_RUNNING) {
    console.log('🔄 Extension already running, skipping...');
    return;
  }
  
  console.log('🚀 Starting BoldTake automation...');
  
  // Send real-time status to sidepanel
  chrome.runtime.sendMessage({
    type: 'status_update',
    status: 'working',
    message: '🚀 BoldTake automation started!',
    timestamp: new Date().toISOString()
  }).catch(() => {}); // Ignore if sidepanel not open
  
  // Notify sidepanel
  try {
    chrome.runtime.sendMessage({
      type: 'SIDEPANEL_UPDATE',
      eventType: 'CONSOLE_LOG',
      data: { type: 'info', message: '🚀 Starting Post Ideas Helper...' }
    });
    
    chrome.runtime.sendMessage({
      type: 'SIDEPANEL_UPDATE',
      eventType: 'STATUS_UPDATE',
      data: { type: 'active', message: 'AI Automation Running' }
    });
  } catch (e) {}
  
  try {
    const prefs = await chrome.storage.local.get({
      xengager_query: 'min_faves:500 lang:en',
      xengager_template: '1',
      xengager_maxPerRun: 500,
      xengager_autoSend: true,
      xengager_simulateTyping: true,
      xengager_requireVerified: false,
      xengager_likeEnabled: true,
      xengager_likeChance: 10
    });
    
    const maxReplies = prefs.xengager_maxPerRun || 500;
    console.log(`📊 Starting automation for up to ${maxReplies} replies`);
    
    // Update sidepanel with automation details
    chrome.runtime.sendMessage({
      type: 'status_update',
      status: 'analyzing',
      message: `🧠 Analyzing X.com feed - targeting ${maxReplies} high-engagement posts`,
      timestamp: new Date().toISOString()
    }).catch(() => {});
  
  // Notify sidepanel of automation start
  try {
    chrome.runtime.sendMessage({
      type: 'SIDEPANEL_UPDATE',
      eventType: 'CONSOLE_LOG',
      data: { type: 'info', message: `📊 Starting automation for up to ${maxReplies} replies` }
    });
    
    chrome.runtime.sendMessage({
      type: 'SIDEPANEL_UPDATE',
      eventType: 'ACTIVITY',
      data: { type: 'info', icon: '🎯', message: `Target: ${maxReplies} replies` }
    });
  } catch (e) {}
    
    BOLDTAKE_RUNNING = true;
    BOLDTAKE_STOP = false;
    
    let made = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 5;
    let lastSuccessTime = Date.now();
    const processed = new Set();
    
    // Health monitor - restart if stuck for 5+ minutes
    const healthMonitor = setInterval(() => {
      const timeSinceSuccess = Date.now() - lastSuccessTime;
      if (timeSinceSuccess > 300000) { // 5 minutes
        console.log('🔄 Health check: System appears stuck, restarting...');
        setStatus('🔄 Auto-restart: Ensuring continuous operation...');
        toast('🔄 System restart - keeping things running smoothly!');
        
        // Reset everything
        consecutiveErrors = 0;
        processed.clear();
        lastSuccessTime = Date.now();
        
        // Scroll to get fresh content
        window.scrollBy({ top: window.innerHeight * 2, behavior: 'smooth' });
      }
    }, 60000); // Check every minute
    
    setStatus('☕ Starting automation... grab your coffee!');
    toast('🚀 Post Ideas Helper started! Time to relax with some coffee ☕');
    
    // Main automation loop
    while (made < maxReplies && !BOLDTAKE_STOP) {
      let currentTweetId = null; // Declare at loop level for error handling
      
      try {
        console.log(`🔄 Loop iteration ${made + 1}/${maxReplies}`);
        setStatus(`☕ Looking for posts to engage with... (${made}/${maxReplies} completed)`);
        
        // Find tweets to process
        const tweets = document.querySelectorAll('article[data-testid="tweet"]:not([data-processed])');
        console.log(`📊 Found ${tweets.length} unprocessed tweets`);
        
        if (tweets.length === 0) {
          console.log('📜 No tweets found, scrolling for more content...');
          setStatus('📜 Scrolling to find more engaging posts...');
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
          await waitMs(3000);
          continue;
        }
        
        let progressed = false;
        for (const article of tweets) {
          if (BOLDTAKE_STOP) break;
          
          // Wrap each tweet processing in try-catch for error recovery
          let id = null; // Declare id outside try block for error recovery
        
        try {
          // Only process visible articles to reduce flaky selectors
          const rect = article.getBoundingClientRect();
          if (rect.bottom < 0 || rect.top > window.innerHeight * 1.2) {
            continue;
          }
          
          id = getTweetId(article) || `tweet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          currentTweetId = id; // Store for outer error handling
          console.log(`🔍 Processing tweet ${id}`);
        
        // Send real-time status to sidepanel
        chrome.runtime.sendMessage({
          type: 'status_update',
          status: 'analyzing',
          message: `🔍 Found high-engagement tweet - analyzing content`,
          timestamp: new Date().toISOString(),
          details: `Tweet ID: ${id}`
        }).catch(() => {});
        
        // Notify sidepanel of tweet processing
        try {
          chrome.runtime.sendMessage({
            type: 'SIDEPANEL_UPDATE',
            eventType: 'CONSOLE_LOG',
            data: { type: 'info', message: `🔍 Processing tweet ${id}` }
          });
        } catch (e) {}
            
            if (processed.has(id)) {
              console.log(`⏭️ Tweet ${id} already processed, skipping`);
              continue;
            }
            
            // Get author metadata
            const meta = getAuthorMeta(article);
            console.log(`👤 Author: @${meta.handle}, verified: ${meta.verified}`);
            
            // Apply filters with logging
            if (prefs.xengager_requireVerified && !meta.verified) { 
              console.log(`❌ Skipping ${id}: not verified`);
              processed.add(id); 
              continue; 
            }
            
            // Extract tweet text
            const textEl = article.querySelector('[data-testid="tweetText"]');
            if (!textEl) {
              console.log(`❌ Skipping ${id}: no tweet text found`);
              processed.add(id);
              continue;
            }
            
            const text = textEl.innerText || textEl.textContent || '';
            if (text.length < 10) {
              console.log(`❌ Skipping ${id}: tweet too short`);
              processed.add(id);
              continue;
            }
            
            console.log(`📖 Tweet text: "${text.slice(0, 100)}..."`);
            
            // Step 1: Read and analyze (10 seconds)
            console.log('📚 Step 1: Reading post (10s)...');
            setStatus(`📚 Reading post ${made + 1}/20... (perfect time for a coffee sip ☕)`);
            for (let i = 10; i > 0; i--) {
              if (BOLDTAKE_STOP) break;
              setStatus(`📚 Reading post ${made + 1}/20... ${i}s remaining`);
              await waitMs(1000);
            }
            
            // Step 2: Generate reply
            console.log('🤖 Step 2: Generating thoughtful reply...');
            setStatus(`🤖 AI generating reply for post ${made + 1}/20...`);
            
            let templateId = prefs.xengager_template || '1';
            
            // Auto-choose best template if enabled
            if (prefs.xengager_autoChoose) {
              console.log('🎯 Auto-selecting best template for this tweet...');
              try {
                const res = await chrome.runtime.sendMessage({ type: 'XENGAGER_CHOOSE_PROMPT', payload: { text } });
                if (res?.ok && res.templateId) {
                  templateId = String(res.templateId);
                  console.log(`✅ Auto-selected template ${templateId} as best match`);
                } else {
                  console.log('⚠️ Template auto-selection failed, using default');
                }
              } catch (e) {
                console.warn('⚠️ Template selection error:', e);
                // Continue with default template
              }
            }
            
            console.log(`🤖 Generating reply using template ${templateId}...`);
            const replyRaw = await generateWithOpenAI(templateId, text, prefs).catch((e) => {
              console.error('❌ OpenAI generation failed:', e);
              setStatus('❌ AI generation failed, moving to next tweet...');
              processed.add(id);
              return null;
            });
            
            if (!replyRaw || BOLDTAKE_STOP) {
              processed.add(id);
              continue;
            }
            
            // Clean the response to get only one confident reply
            let reply = replyRaw.trim();
            
            // Remove multiple options/paragraphs - just take the first confident response
            if (reply.includes('\n\n')) {
              reply = reply.split('\n\n')[0].trim();
            }
            if (reply.includes('Option 1')) {
              reply = reply.split('Option 1')[1]?.replace(/^[:\-\s]+/, '').trim() || reply;
            }
            if (reply.includes('Here are')) {
              const parts = reply.split('Here are')[0].trim();
              if (parts.length > 10) reply = parts;
            }
            
            if (!reply || reply.length < 5) {
              console.log('❌ Reply too short after cleaning, skipping...');
              processed.add(id);
              continue;
            }
            
            console.log(`💬 Generated reply: "${reply.slice(0, 100)}..."`);
            
            // Step 3: Open reply composer
            console.log('💬 Step 3: Opening reply composer...');
            setStatus(`💬 Opening reply composer for post ${made + 1}/20...`);
            
            const replyButton = article.querySelector('[data-testid="reply"]');
            if (!replyButton) {
              console.log('❌ No reply button found, skipping...');
              processed.add(id);
              continue;
            }
            
            // Click reply button
            replyButton.click();
            await waitMs(2000);
            
            // Find composer
            const composer = document.querySelector('[data-testid="tweetTextarea_0"]') || 
                            document.querySelector('[contenteditable="true"][data-testid*="tweet"]') ||
                            document.querySelector('div[contenteditable="true"][role="textbox"]');
            
            if (!composer) {
              console.log('❌ Could not find composer, skipping...');
              processed.add(id);
              continue;
            }
            
            // Step 4: Type reply with realistic speed
            console.log('⌨️ Step 4: Typing reply naturally...');
            setStatus(`⌨️ Typing thoughtful reply for post ${made + 1}/20... (AI at work!)`);
            
            await simulateRealUserInput(composer, reply);
            
            // Step 5: 110-second approval window
            console.log('⏳ 110 second approval window...');
            for (let i = 110; i > 0; i--) {
              if (BOLDTAKE_STOP) break;
              setStatus(`☕ ${i}s to review reply for post ${made + 1}/20 (plenty of time to relax!)`);
              await waitMs(1000);
            }
            
            if (BOLDTAKE_STOP) break;
            
            // Step 6: Send the reply
            console.log('📤 Step 6: Sending reply...');
            setStatus(`📤 Sending reply for post ${made + 1}/20...`);
            
            const sendSuccess = await clickSend(composer, reply);
            
            if (sendSuccess) {
              made++;
              consecutiveErrors = 0; // Reset error counter on success
              lastSuccessTime = Date.now(); // Update health timer
              
              console.log(`✅ SUCCESS! Reply ${made} sent successfully`);
              
              // Notify sidepanel of successful reply
              try {
                chrome.runtime.sendMessage({
                  type: 'SIDEPANEL_UPDATE',
                  eventType: 'CONSOLE_LOG',
                  data: { type: 'success', message: `✅ SUCCESS! Reply ${made} sent successfully` }
                });
                
                chrome.runtime.sendMessage({
                  type: 'SIDEPANEL_UPDATE',
                  eventType: 'ACTIVITY',
                  data: { type: 'success', icon: '✅', message: `Reply ${made} sent successfully` }
                });
                
                chrome.runtime.sendMessage({
                  type: 'SIDEPANEL_UPDATE',
                  eventType: 'PROGRESS_UPDATE',
                  data: { current: made, total: maxReplies }
                });
              } catch (e) {}
              setStatus(`🎉 Reply ${made}/20 sent! Great job!`);
              toast(`🎉 Reply ${made}/500 sent! You're doing great!`);
              
              // Mark as processed
              processed.add(id);
              article.setAttribute('data-processed', 'true');
              progressed = true;
              
              // Brief celebration pause
              await waitMs(2000);
              
              // Move to next tweet
              break;
            } else {
              console.log('❌ Send failed, will try next tweet...');
              setStatus('❌ Send failed, continuing to next post...');
              processed.add(id);
            }
            
          } catch (error) {
            // Error recovery mechanism
            console.error('❌ Error processing tweet:', error);
            consecutiveErrors++;
            
            if (consecutiveErrors >= maxConsecutiveErrors) {
              console.log('🔄 Too many consecutive errors, restarting system...');
              setStatus('🔄 Auto-restart: Ensuring continuous operation...');
              toast('🔄 System restart - keeping things running smoothly!');
              
              // Reset and continue
              consecutiveErrors = 0;
              processed.clear(); // Clear processed tweets to allow retry
              
              // Scroll to get fresh content
              window.scrollBy({ top: window.innerHeight * 2, behavior: 'smooth' });
              await waitMs(5000); // Brief pause before continuing
              
              lastSuccessTime = Date.now(); // Reset health timer
            } else {
              // Single error - just log and continue
              setStatus(`⚠️ Minor issue (${consecutiveErrors}/5) - continuing...`);
              await waitMs(2000);
            }
            
            // Skip this tweet and continue
            if (id) {
              processed.add(id);
              currentTweetId = id; // Store for outer error handling
            }
            continue;
          }
        }
        
        // If no progress made, scroll and try again
        if (!progressed) {
          console.log('📜 No progress made, scrolling for fresh content...');
          setStatus('📜 Looking for more posts to engage with...');
          window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
          await waitMs(3000);
        }
        
      } catch (loopError) {
        console.error('❌ Main loop error:', loopError);
        consecutiveErrors++;
        
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.log('🔄 Too many main loop errors, restarting...');
          setStatus('🔄 System restart due to errors...');
          consecutiveErrors = 0;
          processed.clear();
          await waitMs(5000);
        } else {
          await waitMs(3000);
        }
      }
    }
    
    // Cleanup
    clearInterval(healthMonitor);
    
    console.log(`🏁 Finished processing. Made ${made} replies out of ${maxReplies} max.`);
    setStatus('Completed!');
    toast(`Completed! Made ${made} replies.`);
    
  } catch (error) {
    console.error('💥 Extension error:', error);
    setStatus('Error occurred');
    toast('❌ An error occurred. Check console for details.');
  } finally {
    BOLDTAKE_RUNNING = false;
  }
}

// Helper function to get reply button from composer context
function getReplyButtonFromComposer(composer) {
  const dialog = composer?.closest('div[role="dialog"]') || document;
  return findReplyButton(dialog);
}

// Helper function to check if reply button is enabled
function isReplyButtonEnabled(button) {
  if (!button) return false;
  
  // Check if button is explicitly disabled
  const isDisabled = button.disabled || 
                    button.getAttribute('aria-disabled') === 'true' ||
                    button.hasAttribute('disabled');
  
  if (isDisabled) return false;
  
  // Check for active/enabled styling - be more flexible with colors
  const computedStyle = getComputedStyle(button);
  const bgColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  const opacity = parseFloat(computedStyle.opacity);
  
  // X.com reply button active states (multiple possible colors)
  const hasActiveBlueStyles = bgColor.includes('29, 155, 240') || // Standard X blue
                             bgColor.includes('26, 140, 216') ||  // Hover blue
                             bgColor.includes('15, 98, 254') ||   // Alternative blue
                             bgColor.includes('59, 130, 246');    // Another blue variant
  
  // Check for enabled state indicators
  const hasEnabledIndicators = opacity > 0.8 || // Not faded out
                              !bgColor.includes('83, 100, 113') || // Not grey disabled
                              !bgColor.includes('75, 88, 102');    // Not dark grey
  
  // Button text content check (should contain "Reply" or "Post")
  const hasValidText = button.textContent && 
                      (button.textContent.toLowerCase().includes('reply') || 
                       button.textContent.toLowerCase().includes('post') ||
                       button.textContent.toLowerCase().includes('tweet'));
  
  // Button is enabled if it's not disabled AND has valid styling OR valid text
  const isEnabled = !isDisabled && (hasActiveBlueStyles || hasEnabledIndicators || hasValidText);
  
  console.log(`🔍 Button check:`, {
    disabled: isDisabled,
    bgColor,
    opacity,
    hasActiveBlue: hasActiveBlueStyles,
    hasEnabledIndicators,
    hasValidText,
    finalEnabled: isEnabled
  });
  
  return isEnabled;
}

// Note: findReplyButton function is defined earlier in the file at line 755

// Helper function to get tweet ID
function getTweetId(article) {
  const link = article.querySelector('a[href*="/status/"]');
  if (!link) return null;
  const m = link.getAttribute('href').match(/status\/(\d+)/);
  return m ? m[1] : null;
}

// Helper function to get author metadata
function getAuthorMeta(article) {
  const handle = article.querySelector('[data-testid="User-Name"] a')?.textContent?.replace('@', '') || 'unknown';
  const verified = !!article.querySelector('[data-testid="icon-verified"]');
  return { handle, verified };
}

// Helper function to check quiet hours
function isWithinQuietHours(prefs) {
  if (!prefs.xengager_quietEnabled) return false;
  
  const now = new Date();
  const hour = now.getHours();
  const start = parseInt(prefs.xengager_quietStart) || 22;
  const end = parseInt(prefs.xengager_quietEnd) || 8;
  
  if (start < end) {
    return hour >= start && hour < end;
  } else {
    return hour >= start || hour < end;
  }
}

// Simple humanize function
function humanize(text) {
  return text; // Pass through for now
}

// Helper function to activate composer
function activateComposer(composer) {
  if (!composer) return false;
  
  try {
    composer.focus();
    composer.click();
    
    // Trigger focus events
    const focusEvent = new FocusEvent('focus', { bubbles: true });
    composer.dispatchEvent(focusEvent);
    
    return true;
  } catch (e) {
    console.error('Failed to activate composer:', e);
    return false;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === 'XENGAGER_START') {
    runOnceOnCurrentPage();
  } else if (msg?.type === 'XENGAGER_STOP') {
    BOLDTAKE_STOP = true;
    setStatus('Stopping…');
    // Auto-clear status to Idle after 2s even if we were between steps
    setTimeout(() => { if (!BOLDTAKE_RUNNING) setStatus('Idle'); }, 2000);
  }
});

// Check if we need to continue automation after page navigation
// No more navigation complexity - users just stay on their current X.com page!
