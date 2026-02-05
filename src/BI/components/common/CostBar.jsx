/**
 * 成本进度条组件
 */
import React from 'react';

export function CostBar({ label, value, color, amount }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">
          {value}% <span className="text-gray-400 text-xs">({amount})</span>
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-300`} 
          style={{ width: `${Math.min(value * 2.5, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default CostBar;
