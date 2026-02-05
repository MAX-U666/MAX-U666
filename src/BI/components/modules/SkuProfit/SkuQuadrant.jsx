/**
 * SKU四象限组件
 */
import React from 'react';
import { getSkuQuadrant } from '../../../utils/helpers';
import { skuData } from '../../../data/mock';

export function SkuQuadrant({ selectedQuadrant, onSelect }) {
  // 四象限统计
  const quadrantStats = {
    star: skuData.filter(s => getSkuQuadrant(s) === 'star').length,
    potential: skuData.filter(s => getSkuQuadrant(s) === 'potential').length,
    thin: skuData.filter(s => getSkuQuadrant(s) === 'thin').length,
    problem: skuData.filter(s => getSkuQuadrant(s) === 'problem').length,
  };

  const quadrants = [
    { 
      id: 'star', 
      title: '🌟 明星SKU', 
      count: quadrantStats.star, 
      desc: '高ROI + 高利润',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      activeBorderColor: 'border-green-500',
      textColor: 'text-green-700',
      countColor: 'text-green-600'
    },
    { 
      id: 'potential', 
      title: '💪 潜力SKU', 
      count: quadrantStats.potential, 
      desc: '高ROI + 低销量',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      activeBorderColor: 'border-blue-500',
      textColor: 'text-blue-700',
      countColor: 'text-blue-600'
    },
    { 
      id: 'thin', 
      title: '⚠️ 薄利SKU', 
      count: quadrantStats.thin, 
      desc: '低ROI + 高销量',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      activeBorderColor: 'border-yellow-500',
      textColor: 'text-yellow-700',
      countColor: 'text-yellow-600'
    },
    { 
      id: 'problem', 
      title: '🚨 问题SKU', 
      count: quadrantStats.problem, 
      desc: 'ROI小于2 或 亏损',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      activeBorderColor: 'border-red-500',
      textColor: 'text-red-700',
      countColor: 'text-red-600'
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {quadrants.map((q) => (
        <div 
          key={q.id}
          onClick={() => onSelect(selectedQuadrant === q.id ? null : q.id)}
          className={`${q.bgColor} border-2 rounded-xl p-4 cursor-pointer transition hover:shadow-md ${
            selectedQuadrant === q.id ? `${q.activeBorderColor} ring-2 ring-opacity-50` : q.borderColor
          }`}
        >
          <h4 className={`${q.textColor} text-sm font-semibold mb-2`}>{q.title}</h4>
          <div className={`text-3xl font-bold ${q.countColor}`}>{q.count}</div>
          <p className="text-xs text-gray-500 mt-1">{q.desc}</p>
          {selectedQuadrant === q.id && (
            <span className={`text-xs ${q.countColor} mt-2 block`}>✓ 已筛选</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default SkuQuadrant;
