import React from "react";
import { formatCNY } from "../../../utils/format";

export function SkuRanking({ data }) {
  const list = data || [];
  
  // 利润TOP5
  const profitTop5 = [...list]
    .filter(s => s.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);
  
  // ROI TOP5（排除无广告的）
  const roiTop5 = [...list]
    .filter(s => s.ad > 0 && s.roi < 900)
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);

  // 利润区间分布
  const profitRanges = [
    { label: '亏损', min: -Infinity, max: 0, color: 'bg-red-500' },
    { label: '0~50', min: 0, max: 50, color: 'bg-yellow-500' },
    { label: '50~200', min: 50, max: 200, color: 'bg-blue-500' },
    { label: '200~500', min: 200, max: 500, color: 'bg-green-500' },
    { label: '500+', min: 500, max: Infinity, color: 'bg-emerald-600' },
  ];

  const distribution = profitRanges.map(r => ({
    ...r,
    count: list.filter(s => s.profit >= r.min && s.profit < r.max).length
  }));
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 利润TOP5 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">💰 利润 TOP5</h3>
        <div className="space-y-3">
          {profitTop5.length === 0 && <div className="text-sm text-gray-400">暂无数据</div>}
          {profitTop5.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>{i + 1}</span>
                <span className="text-sm text-gray-700 truncate max-w-[140px]" title={item.name || item.sku}>
                  {item.name || item.sku}
                </span>
              </div>
              <span className="text-sm font-bold text-green-600 whitespace-nowrap">{formatCNY(item.profit)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ROI TOP5 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🎯 ROI TOP5</h3>
        <div className="space-y-3">
          {roiTop5.length === 0 && <div className="text-sm text-gray-400">暂无数据</div>}
          {roiTop5.map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>{i + 1}</span>
                <span className="text-sm text-gray-700 truncate max-w-[140px]" title={item.name || item.sku}>
                  {item.name || item.sku}
                </span>
              </div>
              <span className={`text-sm font-bold whitespace-nowrap ${item.roi >= 4 ? 'text-green-600' : 'text-yellow-600'}`}>
                {item.roi.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 利润区间分布 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 利润区间分布</h3>
        <div className="space-y-3">
          {distribution.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-16 text-right">{item.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div 
                  className={`${item.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 w-8">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
