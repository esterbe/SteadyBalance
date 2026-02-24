import { useState, useEffect, useCallback } from 'react';

// Shared debounce timer across all useCloudStorage instances
// to batch concurrent saves into a single PUT
let pendingWrites = {};
let sharedTimer = null;
let sharedTokenRef = { current: null };
let onAuthError = null;

function handleResponse(res) {
  if (res.status === 401) {
    // Token expired (server restarted) — force re-login
    localStorage.removeItem('sb-token');
    if (onAuthError) onAuthError();
    return null;
  }
  return res.ok ? res.json() : null;
}

function flushWrites() {
  const data = { ...pendingWrites };
  pendingWrites = {};
  const token = sharedTokenRef.current;
  if (!token) return;

  fetch('/api/data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then(handleResponse)
    .catch(() => {});
}

function scheduleWrite(key, value) {
  pendingWrites[key] = value;
  if (sharedTimer) clearTimeout(sharedTimer);
  sharedTimer = setTimeout(flushWrites, 300);
}

export function saveImmediate(data, token) {
  // Cancel any pending debounced writes for the keys we're saving
  Object.keys(data).forEach((k) => delete pendingWrites[k]);

  return fetch('/api/data', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
    .then(handleResponse)
    .catch(() => {});
}

export function useCloudStorage(key, initialValue, token, setToken) {
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  sharedTokenRef.current = token;

  // Register auth error handler to force re-login
  if (setToken) {
    onAuthError = () => setToken(null);
  }

  // Load from server on mount
  useEffect(() => {
    if (!token) return;
    fetch('/api/data', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('sb-token');
          if (onAuthError) onAuthError();
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        if (data && data[key] !== undefined) {
          setValue(data[key]);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [token, key]);

  const setAndSync = useCallback(
    (newValue) => {
      setValue((prev) => {
        const next = typeof newValue === 'function' ? newValue(prev) : newValue;
        scheduleWrite(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, setAndSync, loaded];
}
