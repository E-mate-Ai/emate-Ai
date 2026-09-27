'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Cpu, ChevronDown, Check } from 'lucide-react';

export const STATIC_FREE_MODELS = [
  { name: 'Auto (Best Available Free Model)', id: 'openrouter/auto', tag: 'Fast' },
  { name: 'Google Gemma 2 9B', id: 'google/gemma-2-9b-it:free', tag: 'General' },
  { name: 'Meta Llama 3.1 8B', id: 'meta-llama/llama-3.1-8b-instruct:free', tag: 'Chat' },
  { name: 'Qwen 2.5 7B', id: 'qwen/qwen-2.5-7b-instruct:free', tag: 'Code & Math' },
  { name: 'Mistral 7B Instruct', id: 'mistralai/mistral-7b-instruct:free', tag: 'Logic' },
];

interface ModelOption {
  id: string;
  name: string;
  tag?: string;
}

interface ModelSelectorProps {
  currentModel: string;
  onSelectModel: (modelId: string) => void;
  theme?: 'light' | 'dark';
  variant?: 'default' | 'minimal';
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
            ? 'flex items-center gap-1 text-[11px] font-medium transition-all duration-200 hover:opacity-80 active:scale-95 focus:outline-none h-8'
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
        <Cpu size={12} className={isDark ? 'text-zinc-400' : 'text-zinc-500'} />
        <span className="truncate max-w-[80px] sm:max-w-[120px]">{selectedModelObj.name}</span>
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-64 rounded-2xl py-1.5 shadow-2xl z-50 border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
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
              Select AI Model
            </p>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-0.5 px-1">
            {models.map((m) => {
              const isSelected = m.id === currentModel;
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
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="font-medium truncate">{m.name}</span>
                    {m.tag && <span className="text-[10px] text-zinc-400 mt-0.5">{m.tag}</span>}
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
