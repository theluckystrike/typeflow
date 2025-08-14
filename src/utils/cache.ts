type JsonValue = any;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

export async function setCache(key: string, value: JsonValue): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set({ [key]: { data: value, timestamp: Date.now() } }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.error(`Failed to set cache for key "${key}":`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(`Failed to set cache for key "${key}":`, err);
      reject(err);
    }
  });
}

export async function getCache<T = JsonValue>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get([key], (items) => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.error(`Failed to get cache for key "${key}":`, err);
          return reject(err);
        }
        const record = items[key];
        if (record === undefined) {
          return resolve(null);
        }
        if (record && typeof record === 'object' && 'timestamp' in record && 'data' in record) {
          const age = Date.now() - (record.timestamp as number);
          if (age > CACHE_TTL) {
            chrome.storage.local.remove([key]);
            return resolve(null);
          }
          return resolve((record.data as T));
        }
        return resolve(record as T);
      });
    } catch (err) {
      console.error(`Failed to get cache for key "${key}":`, err);
      reject(err);
    }
  });
}

export async function updateCache<T = JsonValue>(
  key: string,
  updater: (prev: T | null) => T
): Promise<void> {
  try {
    const prev = await getCache<T>(key);
    const next = updater(prev);
    await setCache(key, next);
  } catch (err) {
    console.error(`Failed to update cache for key "${key}":`, err);
  }
}

export async function deleteCache(key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove([key], () => {
        const err = chrome.runtime.lastError;
        if (err) {
          console.error(`Failed to delete cache for key "${key}":`, err);
          reject(err);
        } else {
          resolve();
        }
      });
    } catch (err) {
      console.error(`Failed to delete cache for key "${key}":`, err);
      reject(err);
    }
  });
}

export async function hasCache(key: string): Promise<boolean> {
  try {
    const value = await getCache(key);
    return value !== null;
  } catch (err) {
    console.error(`Failed to check cache existence for key "${key}":`, err);
    return false;
  }
}