import { useState, useCallback, useRef, useEffect } from "react";

const API_URL = "http://localhost:8000";
const CORS_PROXY = ""; // Set to a proxy URL if needed

/**
 * Custom hook for API calls with loading, error, and abort support.
 */
export function useAPI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const request = useCallback(async (endpoint, options = {}) => {
    // Cancel previous request
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const url = `${API_URL}${endpoint}`;
    const config = { signal: controller.signal, ...options };

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(url, config);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (err) {
      if (err.name === "AbortError") throw err;
      setError(err.message);
      throw err;
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, []);

  const get = useCallback((endpoint, options = {}) => request(endpoint, options), [request]);
  const post = useCallback((endpoint, body) => request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }), [request]);

  return { get, post, loading, error, cancel: () => abortRef.current?.abort() };
}

/**
 * Hook for persisting state to localStorage.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or restricted
    }
  }, [key, value]);

  return [value, setValue];
}