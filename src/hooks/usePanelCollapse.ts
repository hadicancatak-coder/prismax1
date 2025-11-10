import { useState, useEffect } from 'react';

interface PanelState {
  left: boolean;
  middle: boolean;
  right: boolean;
}

const STORAGE_KEY = 'ads-panel-collapse-state';

export function usePanelCollapse() {
  const [collapsed, setCollapsed] = useState<PanelState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { left: false, middle: false, right: false };
      }
    }
    return { left: false, middle: false, right: false };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const togglePanel = (panel: keyof PanelState) => {
    setCollapsed(prev => ({
      ...prev,
      [panel]: !prev[panel]
    }));
  };

  return { collapsed, togglePanel };
}
