/** Minimal `window.localStorage` stand-in so storage modules can run under Node. */
export function installFakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  const storage = {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    get length() {
      return data.size;
    },
  };
  globalThis.window = { localStorage: storage, addEventListener() {}, removeEventListener() {} };
  return storage;
}
