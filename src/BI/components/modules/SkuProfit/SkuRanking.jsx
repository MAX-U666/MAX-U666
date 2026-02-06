import React from 'react';
import { formatCNY } from '../../../utils/format';

export function SkuRanking({ data }) {
  const skuData = data || [];
  if (skuData.length === 0) return null;

  // 利润TOP5
  const profitTop = [...skuData].sort((a, b) => b.profit - a.profit).slice(0, 5);
  // ROI TOP5 (有广告的)
  const roiTop = [...skuData].filter(s => s.ad > 0 && s.orders >= 10).sort((a, b) => b.roi - a.roi).slice(0, 5);
  // 利润区间分布
  // 单笔利润分布（出单>=20才参与）
  const qualifiedData = skuData.filter(s => s.orders >= 20);
  const ranges = [
    { label: '亏损 (<¥0)', min: -Infinity, max: 0, color: 'bg-red-500' },
    { label: '¥0~¥4', min: 0, max: 4, color: 'bg-orange-400' },
    { label: '¥4~¥8', min: 4, max: 8, color: 'bg-yellow-400' },
    { label: '¥8~¥12', min: 8, max: 12, color: 'bg-lime-400' },
    { label: '¥12~¥17', min: 12, max: 17, color: 'bg-green-400' },
    { label: '¥18~¥25', min: 17, max: 25, color: 'bg-emerald-500' },
    { label: '≥¥25', min: 25, max: Infinity, color: 'bg-teal-500' },
  ];
  const distribution = ranges.map(r => {
    const avgProfitFilter = s => {
      const avg = s.orders > 0 ? s.profit / s.orders : 0;
      return avg >= r.min && avg < r.max;
    };
    return { ...r, count: qualifiedData.filter(avgProfitFilter).length };
  });
  const maxCount = Math.max(...distribution.map(d => d.count), 1);

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* 利润TOP5 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">🏆 利润 TOP5</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 pb-1 border-b border-gray-100">
            <span className="w-6">#</span>
            <span className="flex-1">SKU名称</span>
            <span className="w-10 text-right">单量</span>
            <span className="w-16 text-right">单笔利润</span>
            <span className="w-20 text-right">总利润</span>
          </div>
          {profitTop.map((sku, i) => {
            const avgProfit = sku.orders > 0 ? sku.profit / sku.orders : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 truncate" title={sku.name}>{sku.name || sku.sku}</span>
                <span className="w-10 text-right text-xs text-gray-500">{sku.orders}</span>
                <span className="w-16 text-right text-xs text-blue-600">{formatCNY(avgProfit)}</span>
                <span className="w-20 text-right text-sm font-bold text-green-600">+{formatCNY(sku.profit)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROI TOP5 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">🎯 ROI TOP5（有广告）</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 pb-1 border-b border-gray-100">
            <span className="w-6">#</span>
            <span className="flex-1">SKU名称</span>
            <span className="w-10 text-right">单量</span>
            <span className="w-12 text-right">ROI</span>
            <span className="w-16 text-right">单笔利润</span>
          </div>
          {roiTop.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">暂无广告数据</div>
          ) : roiTop.map((sku, i) => {
            const avgProfit = sku.orders > 0 ? sku.profit / sku.orders : 0;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                  i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>{i + 1}</span>
                <span className="flex-1 text-sm text-gray-700 truncate" title={sku.name}>{sku.name || sku.sku}</span>
                <span className="w-10 text-right text-xs text-gray-500">{sku.orders}</span>
                <span className="w-12 text-right text-sm font-bold text-blue-600">{sku.roi >= 900 ? '∞' : sku.roi.toFixed(1)}</span>
                <span className="w-16 text-right text-xs text-green-600">{formatCNY(avgProfit)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 利润区间分布 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">📊 单笔利润分布 <span className="text-xs text-gray-400 font-normal">(≥20单)</span></h3>
        <div className="space-y-3">
          {distribution.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 text-xs text-gray-600 font-medium">{item.label}</div>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                <div className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max((item.count / maxCount) * 100, 3)}%` }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">{item.count}</span>
              </div>
              <div className="w-10 text-right text-xs text-gray-500">
                {skuData.length > 0 ? ((item.count / skuData.length) * 100).toFixed(0) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SkuRanking;
