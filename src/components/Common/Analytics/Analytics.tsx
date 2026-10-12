import { useEffect } from 'react';

const WEBSITE_ID = '24631c72-dafb-4fb7-8992-8e719aec2c7a';
const SCRIPT_URL = 'https://um.cl-st.me/x.js';

export function Analytics() {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    const script = document.createElement('script');
    script.defer = true;
    script.src = SCRIPT_URL;
    script.setAttribute('data-website-id', WEBSITE_ID);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return null;
}
