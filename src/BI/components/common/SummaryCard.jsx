/**
 * 汇总卡片组件
 */
import React from 'react';

export function SummaryCard({ title, value, badge, positive, icon }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center gap-2">
        {icon && <span>{icon}</span>}
        <span className="text-gray-500 text-sm">{title}</span>
      </div>
      <div className="text-2xl font-bold mt-1 text-gray-800">{value}</div>
      {badge && (
        <div className={`text-sm mt-1 ${positive ? 'text-green-600' : 'text-gray-500'}`}>
          {badge}
        </div>
      )}
    </div>
  );
}

export default SummaryCard;
