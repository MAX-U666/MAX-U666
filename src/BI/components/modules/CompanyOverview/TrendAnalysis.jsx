import React, { useState } from "react";
import { formatCNY } from "../../../utils/format";

const mockTrendData = {
  revenue: [
    { date: "01-01", value: 125000 },
    { date: "01-02", value: 138000 },
    { date: "01-03", value: 142000 },
    { date: "01-04", value: 128000 },
    { date: "01-05", value: 156000 },
    { date: "01-06", value: 162000 },
    { date: "01-07", value: 148000 }
  ],
  profit: [
    { date: "01-01", value: 28000 },
    { date: "01-02", value: 32000 },
    { date: "01-03", value: 35000 },
    { date: "01-04", value: 26000 },
    { date: "01-05", value: 42000 },
    { date: "01-06", value: 45000 },
    { date: "01-07", value: 38000 }
  ],
  orders: [
    { date: "01-01", value: 1250 },
    { date: "01-02", value: 1380 },
    { date: "01-03", value: 1420 },
    { date: "01-04", value: 1280 },
    { date: "01-05", value: 1560 },
    { date: "01-06", value: 1620 },
    { date: "01-07", value: 1480 }
  ]
};

const metrics = [
  { key: "revenue", label: "营收", color: "#3b82f6" },
  { key: "profit", label: "利润", color: "#10b981" },
  { key: "orders", label: "订单数", color: "#f59e0b" }
];

export function TrendAnalysis() {
  const [activeMetric, setActiveMetric] = useState("revenue");
  const [dateRange, setDateRange] = useState("7d");

  const data = mockTrendData[activeMetric];
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const avg = total / data.length;

  const getBarHeight = (value) => {
    return (value / maxValue) * 100;
  };

  return (
    <div className="space-y-6">
      {/* 控制栏 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {metrics.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                activeMetric === m.key
                  ? "text-white"
                  : "bg-[#1a1f2e] text-gray-400 hover:bg-[#252b3d]"
              }`}
              style={activeMetric === m.key ? { backgroundColor: m.color + "33", color: m.color, border: `1px solid ${m.color}50` } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["7d", "30d", "90d"].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded text-xs ${
                dateRange === range
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {range === "7d" ? "7天" : range === "30d" ? "30天" : "90天"}
            </button>
          ))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#1a1f2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">累计</div>
          <div className="text-2xl font-bold text-white">
            {activeMetric === "orders" ? total.toLocaleString() : formatCNY(total)}
          </div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">日均</div>
          <div className="text-2xl font-bold text-white">
            {activeMetric === "orders" ? Math.round(avg).toLocaleString() : formatCNY(avg)}
          </div>
        </div>
        <div className="bg-[#1a1f2e] rounded-xl p-4">
          <div className="text-gray-400 text-sm mb-1">峰值</div>
          <div className="text-2xl font-bold text-white">
            {activeMetric === "orders" ? maxValue.toLocaleString() : formatCNY(maxValue)}
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="bg-[#1a1f2e] rounded-xl p-6">
        <div className="flex items-end justify-between h-64 gap-4">
          {data.map((item, idx) => {
            const color = metrics.find(m => m.key === activeMetric)?.color || "#3b82f6";
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full rounded-t-lg transition-all duration-300 hover:opacity-80"
                  style={{ 
                    height: `${getBarHeight(item.value)}%`,
                    backgroundColor: color,
                    minHeight: "4px"
                  }}
                />
                <div className="text-xs text-gray-500 mt-2">{item.date}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
