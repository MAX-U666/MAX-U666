/**
 * 趋势卡片组件
 */
import React from 'react';

export function TrendCard({ title, value, change, compareText = 'vs 昨日' }) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-bold mt-1 text-gray-800">{value}</div>
      <div className={`text-sm mt-1 flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        <span>{isPositive ? '↑' : '↓'}</span>
        <span>{Math.abs(change)}%</span>
        <span className="text-gray-400 text-xs">{compareText}</span>
      </div>
    </div>
  );
}

export default TrendCard;
