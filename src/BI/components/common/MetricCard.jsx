/**
 * 指标卡片组件
 */
import React from 'react';

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  orange: 'text-orange-600',
  cyan: 'text-cyan-600',
  pink: 'text-pink-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
};

export function MetricCard({ label, value, color, status, highlight }) {
  return (
    <div className={`bg-gray-50 rounded-xl p-3 ${highlight ? 'ring-2 ring-green-500 bg-green-50' : ''}`}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${color ? colorClasses[color] : 'text-gray-800'}`}>
        {value}
      </div>
      {status && (
        <div className="text-xs text-green-600 mt-0.5">✓ {status}</div>
      )}
    </div>
  );
}

export default MetricCard;
