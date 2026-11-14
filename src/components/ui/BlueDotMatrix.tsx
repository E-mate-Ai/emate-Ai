'use client';

import React from 'react';

const DOT_COUNT = 40;

/** A compact, square LED matrix loader for image generation. */
export default function BlueDotMatrix() {
  return (
    <div className="blue-dot-matrix" role="img" aria-label="Creating image">
      <div className="blue-dot-matrix__grid" aria-hidden="true">
        {Array.from({ length: DOT_COUNT * DOT_COUNT }, (_, index) => {
          const row = Math.floor(index / DOT_COUNT);
          const column = index % DOT_COUNT;
          return (
            <span
              className="blue-dot-matrix__cell"
              key={index}
              style={{
                '--row': row,
                '--column': column,
                '--wave-delay': `${-((row + column * 0.72) % 40) * 0.075}s`,
                '--dot-variation': `${((row * 17 + column * 31) % 7) * 0.035}`,
              } as React.CSSProperties}
            >
              <span className="blue-dot-matrix__dot" />
            </span>
          );
        })}
      </div>
    </div>
  );
}
