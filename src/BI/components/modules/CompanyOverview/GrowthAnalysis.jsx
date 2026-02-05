import React, { useState } from "react";
import { formatCNY } from "../../../utils/format";

const growthData = {
  monthly: [
    { period: "2024-07", revenue: 980000, profit: 156000, orders: 4200 },
    { period: "2024-08", revenue: 1050000, profit: 168000, orders: 4500 },
    { period: "2024-09", revenue: 1120000, profit: 179000, orders: 4800 },
    { period: "2024-10", revenue: 1180000, profit: 188000, orders: 5100 },
    { period: "2024-11", revenue: 1250000, profit: 200000, orders: 5400 },
    { period: "2024-12", revenue: 1320000, profit: 211000, orders: 5700 }
  ],
  yoy: { revenue: 28.5, profit: 35.2, orders: 22.8 },
  mom: { revenue: 5.6, profit: 5.5, orders: 5.6 }
};

const metrics = [
  { key: "revenue", label: "营收", format: formatCNY },
  { key: "profit", label: "利润", format: formatCNY },
  { key: "orders", label: "订单", format: (v) => v.toLocaleString() }
];

export function GrowthAnalysis() {
  const [activeMetric, setActiveMetric] = useState("revenue");

  const data = growthData.monthly;
  const current = data[data.length - 1];
  const first = data[0];

  const getGrowthRate = (current, previous) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const totalGrowth = getGrowthRate(current[activeMetric], first[activeMetric]);
  const momGrowth = growthData.mom[activeMetric];
  const yoyGrowth = growthData.yoy[activeMetric];

  const maxValue = Math.max(...data.map(d => d[activeMetric]));
  const formatter = metrics.find(m => m.key === activeMetric)?.format || (v => v);

  return (
    <div className="space-y-5">
      {/* 指标切换 */}
      <div className="flex gap-2">
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeMetric === m.key
                ? "bg-orange-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 增长概览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">当前值</div>
          <div className="text-2xl font-bold text-gray-800">
            {formatter(current[activeMetric])}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">环比增长</div>
          <div className={`text-2xl font-bold ${momGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
            {momGrowth >= 0 ? "+" : ""}{momGrowth}%
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">同比增长</div>
          <div className={`text-2xl font-bold ${yoyGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>
            {yoyGrowth >= 0 ? "+" : ""}{yoyGrowth}%
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">6个月累计增长</div>
          <div className={`text-2xl font-bold ${parseFloat(totalGrowth) >= 0 ? "text-green-600" : "text-red-600"}`}>
            {parseFloat(totalGrowth) >= 0 ? "+" : ""}{totalGrowth}%
          </div>
        </div>
      </div>

      {/* 趋势图 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-gray-800 font-semibold mb-4">月度趋势</h3>
        <div className="flex items-end justify-between h-48 gap-4">
          {data.map((item, idx) => {
            const height = (item[activeMetric] / maxValue) * 100;
            const growth = idx > 0 ? getGrowthRate(item[activeMetric], data[idx - 1][activeMetric]) : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full">
                  {idx > 0 && (
                    <div className={`absolute -top-6 left-1/2 -translate-x-1/2 text-xs ${
                      parseFloat(growth) >= 0 ? "text-green-600" : "text-red-600"
                    } opacity-0 group-hover:opacity-100 transition-opacity`}>
                      {parseFloat(growth) >= 0 ? "+" : ""}{growth}%
                    </div>
                  )}
                  <div
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg transition-all duration-300 group-hover:from-orange-400 group-hover:to-orange-300"
                    style={{ height: `${height}%`, minHeight: "8px" }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-2">{item.period.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 增长预测 */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
        <h3 className="text-gray-800 font-semibold mb-2">📈 增长预测</h3>
        <p className="text-gray-600 text-sm">
          基于当前增长趋势，预计下月{metrics.find(m => m.key === activeMetric)?.label}将达到 
          <span className="text-orange-600 font-semibold mx-1">
            {formatter(Math.round(current[activeMetric] * (1 + momGrowth / 100)))}
          </span>
          ，季度目标完成度预计 <span className="text-green-600 font-semibold">92%</span>
        </p>
      </div>
    </div>
  );
}
