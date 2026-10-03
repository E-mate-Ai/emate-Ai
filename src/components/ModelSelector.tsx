'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Cpu, ChevronDown, Check } from 'lucide-react';
import { ALL_FREE_MODELS } from '@/lib/modelConfig';

export const STATIC_FREE_MODELS = ALL_FREE_MODELS.map((m) => ({
  id: m.id,
  name: m.name,
  tag: m.badge,
  isFlagship: m.isFlagship,
}));

interface ModelOption {
  id: string;
  name: string;
  tag?: string;
  isFlagship?: boolean;
}

interface ModelSelectorProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  theme?: 'light' | 'dark';
  variant?: 'default' | 'minimal';
}

function EMateBadgeIcon() {
  return (
    <div
      className="flex items-center justify-center rounded-[4px] font-black text-white shrink-0 select-none shadow-2xs"
      style={{
        width: 15,
        height: 15,
        background: 'linear-gradient(135deg, #10a37f 0%, #2563eb 100%)',
        fontSize: 8,
        lineHeight: 1,
      }}
    >
      eM
    </div>
  );
}

export function ModelSelector({
  currentModel,
  onSelectModel,
  theme = 'dark',
  variant = 'default',
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelOption[]>(STATIC_FREE_MODELS);
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';
  const isMinimal = variant === 'minimal';

  useEffect(() => {
    async function fetchModelSelectorFlag() {
      try {
        const res = await fetch('/api/admin?action=flags');
        if (!res.ok) return;
        const data = await res.json();
        const flag = data?.flags?.find((item: { id: string; enabled: boolean }) => item.id === 'openrouterModelSelector');
        if (flag) {
          setIsEnabled(Boolean(flag.enabled));
        }
      } catch {
        // Leave enabled by default for public use.
      }
    }
    fetchModelSelectorFlag();
  }, []);

  useEffect(() => {
    async function fetchFreeModels() {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (data?.models?.length > 0) {
            setModels(data.models);
          }
        }
      } catch (_) {
        // Keep fallback static free models
      }
    }
    fetchFreeModels();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedModelObj = models.find((m) => m.id === currentModel) || models[0];

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={
          isMinimal
            ? 'flex items-center gap-1.5 text-[11px] font-medium transition-all duration-200 hover:opacity-80 active:scale-95 focus:outline-none h-8'
            : 'flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 hover:opacity-90 active:scale-95 border shadow-sm'
        }
        style={
          isMinimal
            ? {
                color: isDark ? '#d4d4d8' : '#3f3f46',
              }
            : {
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                color: isDark ? '#f4f4f5' : '#18181b',
              }
        }
      >
        {selectedModelObj.id === 'emate' || selectedModelObj.name.toLowerCase().includes('emate') ? (
          <EMateBadgeIcon />
        ) : (
          <Cpu size={12} className={isDark ? 'text-zinc-400' : 'text-zinc-500'} />
        )}
        <span className="truncate max-w-[80px] sm:max-w-[120px]">{selectedModelObj.name}</span>
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 rounded-2xl py-1.5 shadow-2xl z-50 border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: isDark ? 'rgba(18, 18, 20, 0.96)' : 'rgba(255, 255, 255, 0.98)',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          }}
        >
          <div
            className="px-3 py-1.5 mb-1 border-b"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}
          >
            <p className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">
              Select Free AI Model
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5 px-1">
            {models.map((m) => {
              const isSelected = m.id === currentModel;
              const isEmate = m.id === 'emate' || m.name.toLowerCase().includes('emate');
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(m.id);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors text-left group"
                  style={{
                    background: isSelected
                      ? isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(0,0,0,0.06)'
                      : 'transparent',
                    color: isDark ? '#ffffff' : '#000000',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    {isEmate ? (
                      <EMateBadgeIcon />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-zinc-600/30 shrink-0 flex items-center justify-center text-[8px] font-bold text-zinc-400">
                        •
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className={`font-medium truncate ${isEmate ? 'text-blue-400 dark:text-blue-300 font-semibold' : ''}`}>
                        {m.name}
                      </span>
                      {m.tag && <span className="text-[10px] text-zinc-400">{m.tag}</span>}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
