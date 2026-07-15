import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WINDOW_MS = 700;

/** Triple-click → /os (owner login). Discrete — no UI copy. */
export function useSecretLoginClick() {
  const navigate = useNavigate();
  const state = useRef({ count: 0, timer: null });

  return useCallback(() => {
    const s = state.current;
    s.count += 1;
    if (s.timer) clearTimeout(s.timer);
    if (s.count >= 3) {
      s.count = 0;
      navigate('/os');
      return;
    }
    s.timer = setTimeout(() => {
      s.count = 0;
    }, WINDOW_MS);
  }, [navigate]);
}
