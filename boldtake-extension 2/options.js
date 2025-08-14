async function load() {
  const { boldtake_apiKey } = await chrome.storage.local.get({ boldtake_apiKey: '' });
  document.getElementById('apiKey').value = boldtake_apiKey;
}

async function save() {
  const apiKey = document.getElementById('apiKey').value.trim();
  await chrome.storage.local.set({ boldtake_apiKey: apiKey });
  const el = document.getElementById('status');
  el.textContent = 'Saved';
  setTimeout(() => el.textContent = '', 1500);
}

document.getElementById('save').addEventListener('click', save);
load();


