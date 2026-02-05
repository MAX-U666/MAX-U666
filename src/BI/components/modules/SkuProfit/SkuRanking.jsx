import React from "react";
import { formatCNY } from "../../../utils/format";

const profitTop5 = [
  { name: "凡士林真润倍护霜40G", orders: 269, roi: 3.84, profit: 18735.74 },
  { name: "凡士林真润倍护霜40G(大)", orders: 108, roi: 3.41, profit: 1969.17 },
  { name: "紫色牙膏+牙刷", orders: 45, roi: 2.85, profit: 856.32 },
  { name: "美白牙膏套装", orders: 38, roi: 2.12, profit: 542.18 },
  { name: "护手霜礼盒", orders: 22, roi: 1.95, profit: 312.45 }
];

const roiTop5 = [
  { name: "黄色牙刷", orders: 1, roi: 43.28, profit: 23.30 },
  { name: "紫色牙膏+牙刷", orders: 3, roi: 9.32, profit: 144.50 },
  { name: "儿童牙刷套装", orders: 5, roi: 6.75, profit: 89.20 },
  { name: "旅行洗漱包", orders: 8, roi: 5.42, profit: 167.80 },
  { name: "凡士林真润倍护霜40G", orders: 269, roi: 3.84, profit: 18735.74 }
];

const medals = ["🥇", "🥈", "🥉", "4", "5"];

export function SkuRanking() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 利润排行榜 */}
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
                  <div className="text-sm text-gray-800 font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.orders}单 | ROI {item.roi}</div>
                </div>
              </div>
              <div className="text-base font-semibold text-orange-500">
                {formatCNY(item.profit)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI排行榜 */}
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
                  <div className="text-sm text-gray-800 font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.orders}单 | 利润 {formatCNY(item.profit)}</div>
                </div>
              </div>
              <div className="text-base font-semibold text-blue-500">
                {item.roi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
