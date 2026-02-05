/**
 * SKU排行榜组件
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';
import { skuData } from '../../../data/mock';

export function SkuRanking() {
  // 利润排行
  const profitRanking = [...skuData].sort((a, b) => b.profit - a.profit).slice(0, 5);
  
  // ROI排行（只取盈利的）
  const roiRanking = [...skuData].filter(s => s.profit > 0).sort((a, b) => b.roi - a.roi).slice(0, 5);

  const RankBadge = ({ index }) => (
    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
      index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-200' : index === 2 ? 'bg-orange-100' : 'bg-gray-50'
    }`}>
      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
    </span>
  );

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 利润排行榜 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">🏆 利润排行榜 TOP5</h3>
        <div className="space-y-3">
          {profitRanking.map((sku, i) => (
            <div key={sku.sku} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <RankBadge index={i} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm truncate">{sku.name}</div>
                <div className="text-xs text-gray-500">{sku.orders}单 | ROI {sku.roi.toFixed(2)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">{formatCNY(sku.profit)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI排行榜 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">⚡ ROI排行榜 TOP5</h3>
        <div className="space-y-3">
          {roiRanking.map((sku, i) => (
            <div key={sku.sku} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <RankBadge index={i} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm truncate">{sku.name}</div>
                <div className="text-xs text-gray-500">{sku.orders}单 | 利润 {formatCNY(sku.profit)}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-blue-600">{sku.roi.toFixed(2)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SkuRanking;
