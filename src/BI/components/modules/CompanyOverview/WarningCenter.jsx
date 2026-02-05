import React, { useState } from "react";

const mockWarnings = [
  {
    id: 1,
    level: "critical",
    type: "profit",
    title: "SKU利润率异常下降",
    description: "SKU-A023 近7日利润率从18%降至3%，低于预警线5%",
    shop: "B03",
    time: "10分钟前",
    resolved: false
  },
  {
    id: 2,
    level: "warning",
    type: "inventory",
    title: "库存不足预警",
    description: "SKU-B156 当前库存仅剩23件，预计2天内售罄",
    shop: "B01",
    time: "1小时前",
    resolved: false
  },
  {
    id: 3,
    level: "warning",
    type: "ads",
    title: "广告ROI偏低",
    description: "店铺B02广告ROI连续3天低于1.5，建议优化投放策略",
    shop: "B02",
    time: "3小时前",
    resolved: false
  },
  {
    id: 4,
    level: "info",
    type: "order",
    title: "订单量波动",
    description: "今日订单量较昨日下降15%，建议关注",
    shop: "全部",
    time: "5小时前",
    resolved: true
  }
];

const levelConfig = {
  critical: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "严重", icon: "🔴" },
  warning: { color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", label: "警告", icon: "🟡" },
  info: { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "提示", icon: "🔵" }
};

const typeLabels = {
  profit: "利润",
  inventory: "库存",
  ads: "广告",
  order: "订单"
};

export function WarningCenter() {
  const [filter, setFilter] = useState("all");
  const [showResolved, setShowResolved] = useState(false);

  const filteredWarnings = mockWarnings.filter(w => {
    if (!showResolved && w.resolved) return false;
    if (filter === "all") return true;
    return w.level === filter;
  });

  const counts = {
    all: mockWarnings.filter(w => !w.resolved).length,
    critical: mockWarnings.filter(w => w.level === "critical" && !w.resolved).length,
    warning: mockWarnings.filter(w => w.level === "warning" && !w.resolved).length,
    info: mockWarnings.filter(w => w.level === "info" && !w.resolved).length
  };

  return (
    <div className="space-y-5">
      {/* 筛选栏 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "critical", "warning", "info"].map(f => {
            const config = f === "all" 
              ? { color: "text-gray-600", bg: "bg-gray-100", border: "border-gray-200", label: "全部" } 
              : levelConfig[f];
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                  isActive 
                    ? `${config.bg} ${config.color} ${config.border} border` 
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {config.label}
                <span className="text-xs opacity-70">({counts[f]})</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={e => setShowResolved(e.target.checked)}
            className="rounded border-gray-300"
          />
          显示已处理
        </label>
      </div>

      {/* 预警列表 */}
      <div className="space-y-3">
        {filteredWarnings.map(warning => {
          const config = levelConfig[warning.level];
          return (
            <div
              key={warning.id}
              className={`bg-white rounded-xl p-4 border-l-4 border border-gray-200 ${warning.resolved ? "opacity-50" : ""}`}
              style={{ borderLeftColor: warning.level === 'critical' ? '#ef4444' : warning.level === 'warning' ? '#f59e0b' : '#3b82f6' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{config.icon}</span>
                    <span className="font-medium text-gray-800">{warning.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                      {typeLabels[warning.type]}
                    </span>
                    {warning.resolved && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-600">
                        已处理
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mb-2">{warning.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>店铺: {warning.shop}</span>
                    <span>{warning.time}</span>
                  </div>
                </div>
                {!warning.resolved && (
                  <button className="text-xs text-orange-600 hover:text-orange-700 px-3 py-1 rounded bg-orange-50 hover:bg-orange-100">
                    处理
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWarnings.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          暂无预警信息
        </div>
      )}
    </div>
  );
}
