import { useEffect } from 'react';
import { useLocation } from 'react-router';

export function useActivityMonitor() {
  const location = useLocation();

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return '[]';
    };

    let history = [];
    try {
      history = JSON.parse(decodeURIComponent(getCookie('user_activity') || '[]'));
    } catch (e) {
      history = [];
    }

    history.push({ path: location.pathname, time: new Date().toISOString() });
    
    if (history.length > 5) history.shift();

    const expires = new Date(Date.now() + 7 * 864e5).toUTCString();
    document.cookie = `user_activity=${encodeURIComponent(JSON.stringify(history))}; expires=${expires}; path=/; SameSite=Strict`;

  }, [location]); 
}