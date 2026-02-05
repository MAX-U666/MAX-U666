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
  critical: { color: "#ef4444", bg: "#ef444420", label: "严重", icon: "🔴" },
  warning: { color: "#f59e0b", bg: "#f59e0b20", label: "警告", icon: "🟡" },
  info: { color: "#3b82f6", bg: "#3b82f620", label: "提示", icon: "🔵" }
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
    <div className="space-y-6">
      {/* 筛选栏 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["all", "critical", "warning", "info"].map(f => {
            const config = f === "all" ? { color: "#9ca3af", label: "全部" } : levelConfig[f];
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
                  filter === f
                    ? "border"
                    : "bg-[#1a1f2e] text-gray-400 hover:bg-[#252b3d]"
                }`}
                style={filter === f ? { 
                  backgroundColor: (levelConfig[f]?.bg || "#9ca3af20"),
                  color: config.color,
                  borderColor: config.color + "50"
                } : {}}
              >
                {config.label}
                <span className="text-xs opacity-70">({counts[f]})</span>
              </button>
            );
          })}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={e => setShowResolved(e.target.checked)}
            className="rounded bg-[#1a1f2e] border-gray-600"
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
              className={`bg-[#1a1f2e] rounded-xl p-4 border-l-4 ${warning.resolved ? "opacity-50" : ""}`}
              style={{ borderLeftColor: config.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span>{config.icon}</span>
                    <span className="font-medium text-white">{warning.title}</span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ backgroundColor: config.bg, color: config.color }}
                    >
                      {typeLabels[warning.type]}
                    </span>
                    {warning.resolved && (
                      <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                        已处理
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{warning.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>店铺: {warning.shop}</span>
                    <span>{warning.time}</span>
                  </div>
                </div>
                {!warning.resolved && (
                  <button className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1 rounded bg-blue-500/10">
                    处理
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredWarnings.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无预警信息
        </div>
      )}
    </div>
  );
}
