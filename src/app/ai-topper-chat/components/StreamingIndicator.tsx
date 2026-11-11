'use client';

import React from 'react';
import LatticeLoader from '@/components/ui/LatticeLoader';

export default function StreamingIndicator() {
  return (
    <div className="flex items-center justify-start py-2 fade-in-up">
      <LatticeLoader
        status="working"
        label="Thinking"
        pattern="orbit"
        grid={3}
        shape="round"
        color="#3b82f6"
        doneColor="#22c55e"
        errorColor="#ef4444"
        cellSize={5.5}
        gap={2}
        fontSize={13}
        step={90}
        idleOpacity={0.15}
        showTimer={false}
      />
    </div>
  );
}
