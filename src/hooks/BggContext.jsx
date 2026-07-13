import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { bggLogin, bggLogPlay } from '../utils/bggApi.js';
import { getStoredUsername, setStoredUsername, clearStoredUsername } from '../utils/bggConfig.js';

const BggContext = createContext(null);

// ponytail: PIN_TTL ceiling is 4h game-night session; upgrade path = user-configurable setting
const PIN_TTL_MS = 4 * 60 * 60 * 1000;

export function BggProvider({ children }) {
  // isLoggedIn is derived from localStorage, so it survives page refresh
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getStoredUsername()));
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // PIN cache — refs so storage never triggers re-renders and never hits localStorage
  const pinRef = useRef(null);
  const pinExpiryRef = useRef(0);

  const cachePin = useCallback((pin) => {
    pinRef.current = pin;
    pinExpiryRef.current = Date.now() + PIN_TTL_MS;
  }, []);

  const getCachedPin = useCallback(() => {
    if (pinRef.current && Date.now() < pinExpiryRef.current) return pinRef.current;
    pinRef.current = null;
    pinExpiryRef.current = 0;
    return null;
  }, []);

  const clearCachedPin = useCallback(() => {
    pinRef.current = null;
    pinExpiryRef.current = 0;
  }, []);

  const login = useCallback(async (username, password, pin) => {
    setIsLoggingIn(true);
    try {
      await bggLogin(username, password, pin);
      setStoredUsername(username);
      setIsLoggedIn(true);
      cachePin(pin);
    } finally {
      setIsLoggingIn(false);
    }
  }, [cachePin]);

  const logPlay = useCallback(async (pin, playData) => {
    const username = getStoredUsername();
    if (!username) throw new Error('Not logged in to BGG');
    setIsLogging(true);
    try {
      return await bggLogPlay(username, pin, playData);
    } finally {
      setIsLogging(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredUsername();
    clearCachedPin();
    setIsLoggedIn(false);
  }, [clearCachedPin]);

  return (
    <BggContext.Provider value={{ isLoggedIn, isLoggingIn, isLogging, login, logPlay, logout, getCachedPin, cachePin, clearCachedPin }}>
      {children}
    </BggContext.Provider>
  );
}

export function useBgg() {
  const ctx = useContext(BggContext);
  if (!ctx) throw new Error('useBgg must be used inside BggProvider');
  return ctx;
}
