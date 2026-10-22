'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Cpu,
  ChevronDown,
  Check,
  Search,
  Sparkles,
  Code2,
  Image as ImageIcon,
  Eye,
  Layers,
  Zap,
} from 'lucide-react';
import { MASTER_MODEL_REGISTRY } from '@/lib/multimodal/registry';
import { UnifiedModelMetadata } from '@/lib/multimodal/types';

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
  const [models] = useState<UnifiedModelMetadata[]>(MASTER_MODEL_REGISTRY);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Code' | 'Vision' | 'Image' | '1M Context'>('All');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';
  const isMinimal = variant === 'minimal';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const selectedModelObj =
    models.find((m) => m.id === currentModel) ||
    models.find((m) => m.id === 'emate') ||
    models[0];

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      // Filter tab check
      if (selectedFilter === 'Code' && !m.capabilities.supportsCodeGeneration) return false;
      if (selectedFilter === 'Vision' && !m.capabilities.supportsVisionInput) return false;
      if (selectedFilter === 'Image' && !m.capabilities.supportsImageGeneration) return false;
      if (selectedFilter === '1M Context' && (m.contextLength || 0) < 1000000) return false;

      // Text search check
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.badge.toLowerCase().includes(q)
      );
    });
  }, [models, selectedFilter, searchQuery]);

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
        {selectedModelObj.id === 'auto' ? (
          <Sparkles size={13} className="text-amber-500 animate-pulse" />
        ) : selectedModelObj.id === 'emate' || selectedModelObj.name.toLowerCase().includes('emate') ? (
          <EMateBadgeIcon />
        ) : selectedModelObj.capabilities.supportsImageGeneration ? (
          <ImageIcon size={13} className="text-pink-500" />
        ) : selectedModelObj.capabilities.supportsCodeGeneration ? (
          <Code2 size={13} className="text-indigo-400" />
        ) : (
          <Cpu size={12} className={isDark ? 'text-zinc-400' : 'text-zinc-500'} />
        )}
        <span className="truncate max-w-[80px] sm:max-w-[130px] font-medium">{selectedModelObj.name}</span>
        <ChevronDown
          size={10}
          className={`transition-transform duration-200 opacity-60 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl py-2 shadow-2xl z-50 border backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: isDark ? 'rgba(18, 18, 22, 0.98)' : 'rgba(255, 255, 255, 0.99)',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
          }}
        >
          {/* Header & Search */}
          <div className="px-3 pb-2 border-b border-zinc-200/60 dark:border-zinc-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
              <span>Select Model or Engine</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">
                100% Free
              </span>
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models, code, vision, 1M context..."
                className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Capability Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {(['All', 'Code', 'Vision', 'Image', '1M Context'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedFilter(tab)}
                  className={`px-2 py-0.5 rounded-md font-medium transition shrink-0 ${
                    selectedFilter === tab
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Model Options List */}
          <div className="max-h-72 overflow-y-auto space-y-1 p-1.5">
            {filteredModels.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                No matching models found for &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredModels.map((m) => {
                const isSelected = m.id === currentModel;
                const isAuto = m.id === 'auto';
                const isEmate = m.id === 'emate';

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectModel(m.id);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-start justify-between p-2 rounded-xl text-xs transition-colors text-left group"
                    style={{
                      background: isSelected
                        ? isDark
                          ? 'rgba(37, 99, 235, 0.16)'
                          : 'rgba(37, 99, 235, 0.08)'
                        : 'transparent',
                    }}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 pr-2">
                      <div className="mt-0.5 shrink-0">
                        {isAuto ? (
                          <Sparkles size={14} className="text-amber-500" />
                        ) : isEmate ? (
                          <EMateBadgeIcon />
                        ) : m.capabilities.supportsImageGeneration ? (
                          <ImageIcon size={14} className="text-pink-500" />
                        ) : m.capabilities.supportsCodeGeneration ? (
                          <Code2 size={14} className="text-indigo-400" />
                        ) : (
                          <Cpu size={14} className="text-zinc-400" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-semibold truncate text-[13px] ${
                              isAuto
                                ? 'text-amber-500 dark:text-amber-400'
                                : isEmate
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : 'text-zinc-900 dark:text-zinc-100'
                            }`}
                          >
                            {m.name}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {m.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-0.5">
                          {m.description}
                        </p>

                        {/* Capability Icons */}
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                          {m.capabilities.supportsVisionInput && (
                            <span className="flex items-center gap-0.5 text-blue-500 dark:text-blue-400">
                              <Eye size={10} /> Vision
                            </span>
                          )}
                          {m.capabilities.supportsImageGeneration && (
                            <span className="flex items-center gap-0.5 text-pink-500 dark:text-pink-400">
                              <ImageIcon size={10} /> Image Gen
                            </span>
                          )}
                          {m.capabilities.supportsCodeGeneration && (
                            <span className="flex items-center gap-0.5 text-indigo-500 dark:text-indigo-400">
                              <Code2 size={10} /> Code
                            </span>
                          )}
                          {m.contextLength && m.contextLength >= 1000000 && (
                            <span className="flex items-center gap-0.5 text-amber-500">
                              <Zap size={10} /> 1M Context
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check size={16} className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
