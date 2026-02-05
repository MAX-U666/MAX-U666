import React from "react";
import { formatCNY } from "../../../utils/format";

const profitTop5 = [
  { name: "凡士林真润倍护霜40G", orders: 269, roi: 3.84, avgProfit: 69.65, profit: 18735.74 },
  { name: "凡士林真润倍护霜40G(大)", orders: 108, roi: 3.41, avgProfit: 18.23, profit: 1969.17 },
  { name: "Aiposhiy生姜洗发水", orders: 68, roi: 2.84, avgProfit: 20.52, profit: 1395.08 },
  { name: "二氧化碳洗发水300G", orders: 21, roi: 2.88, avgProfit: 20.34, profit: 427.06 },
  { name: "Aiposhiy白提味牙膏120g+黄色牙刷", orders: 14, roi: 2.83, avgProfit: 22.85, profit: 319.93 }
];

const roiTop5 = [
  { name: "黄色牙刷", orders: 1, roi: 43.28, avgProfit: 23.30, profit: 23.30 },
  { name: "紫色牙膏+牙刷", orders: 3, roi: 9.32, avgProfit: 48.17, profit: 144.50 },
  { name: "凡士林真润倍护霜40G", orders: 269, roi: 3.84, avgProfit: 69.65, profit: 18735.74 },
  { name: "凡士林真润倍护霜40G(大)", orders: 108, roi: 3.41, avgProfit: 18.23, profit: 1969.17 },
  { name: "二氧化碳洗发水300G", orders: 21, roi: 2.88, avgProfit: 20.34, profit: 427.06 }
];

// SKU利润区间分布数据
const profitDistribution = [
  { range: "< ¥0（亏损）", count: 3, percent: 30, color: "#EF4444" },
  { range: "¥0 - ¥100", count: 1, percent: 10, color: "#F59E0B" },
  { range: "¥100 - ¥500", count: 3, percent: 30, color: "#FBBF24" },
  { range: "¥500 - ¥1000", count: 0, percent: 0, color: "#A3E635" },
  { range: "¥1000 - ¥5000", count: 2, percent: 20, color: "#22C55E" },
  { range: "≥ ¥5000", count: 1, percent: 10, color: "#10B981" }
];

const totalSkuCount = profitDistribution.reduce((sum, item) => sum + item.count, 0);

const medals = ["🥇", "🥈", "🥉", "4", "5"];

export function SkuRanking() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 利润排行榜 TOP5 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🏆</span> 利润排行榜 TOP5
        </div>
        <div className="space-y-3">
          {profitTop5.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm
                  ${idx < 3 ? 'text-base' : 'bg-gray-100 text-gray-500 text-xs'}
                `}>
                  {medals[idx]}
                </span>
                <div>
                  <div className="text-sm text-gray-800 font-medium truncate max-w-[140px]" title={item.name}>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.orders}单 | ROI {item.roi} | 单笔¥{item.avgProfit}</div>
                </div>
              </div>
              <div className="text-base font-semibold text-orange-500">
                {formatCNY(item.profit)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI排行榜 TOP5 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>⚡</span> ROI排行榜 TOP5
        </div>
        <div className="space-y-3">
          {roiTop5.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-full text-sm
                  ${idx < 3 ? 'text-base' : 'bg-gray-100 text-gray-500 text-xs'}
                `}>
                  {medals[idx]}
                </span>
                <div>
                  <div className="text-sm text-gray-800 font-medium truncate max-w-[140px]" title={item.name}>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.orders}单 | 利润{formatCNY(item.profit)} | 单笔¥{item.avgProfit}</div>
                </div>
              </div>
              <div className="text-base font-semibold text-blue-500">
                {item.roi}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SKU利润区间分布 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📊</span> SKU利润区间分布
        </div>
        <div className="space-y-3">
          {profitDistribution.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-28 text-xs text-gray-600 shrink-0">{item.range}</div>
              <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${item.percent}%`, 
                    backgroundColor: item.color,
                    minWidth: item.count > 0 ? '8px' : '0'
                  }}
                />
              </div>
              <div className="w-8 text-xs text-gray-700 font-medium text-right">{item.count}个</div>
              <div className="w-12 text-xs text-gray-500 text-right">{item.percent}%</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-600">总SKU数</span>
          <span className="text-lg font-bold text-gray-800">{totalSkuCount}个</span>
        </div>
      </div>
    </div>
  );
}

