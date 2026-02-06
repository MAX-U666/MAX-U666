import React from "react";
import { formatCNY } from "../../../utils/format";

export function SkuOverview({ data, loading }) {
  const d = data || { totalSku: 0, profitSku: 0, lossSku: 0, roiReached: 0, totalProfit: 0 };

  const metrics = [
    { 
      label: "SKU总数", 
      value: d.totalSku, 
      icon: "📦",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100"
    },
    { 
      label: "盈利SKU", 
      value: d.profitSku, 
      sub: d.totalSku > 0 ? `${(d.profitSku/d.totalSku*100).toFixed(1)}%` : '0%', 
      subColor: "text-green-600",
      icon: "✅",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100"
    },
    { 
      label: "亏损SKU", 
      value: d.lossSku, 
      sub: d.totalSku > 0 ? `${(d.lossSku/d.totalSku*100).toFixed(1)}%` : '0%', 
      subColor: "text-red-600",
      icon: "⚠️",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100"
    },
    { 
      label: "ROI达标", 
      value: d.roiReached, 
      sub: "ROI≥4", 
      subColor: "text-blue-600",
      icon: "🎯",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100"
    },
    { 
      label: "SKU总利润", 
      value: formatCNY(d.totalProfit || 0),
      icon: "💰",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {metrics.map((item, idx) => (
        <div key={idx} className={`${item.bgColor} rounded-xl p-4 border border-gray-100 ${loading ? 'animate-pulse' : ''}`}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-2">{item.label}</div>
              <div className="text-2xl font-bold text-gray-800">{item.value}</div>
              {item.sub && (
                <div className={`text-sm mt-1 ${item.subColor}`}>{item.sub}</div>
              )}
            </div>
            <div className={`w-10 h-10 ${item.iconBg} rounded-lg flex items-center justify-center text-lg`}>
              {item.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
