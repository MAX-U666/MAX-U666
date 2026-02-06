import React from "react";
import { getSkuQuadrant } from "../../../utils/helpers";

export function SkuQuadrant({ data }) {
  const counts = { star: 0, potential: 0, thin: 0, problem: 0 };
  (data || []).forEach(sku => {
    const q = getSkuQuadrant(sku);
    if (counts[q] !== undefined) counts[q]++;
  });

  const quadrants = [
    { 
      label: "明星SKU", 
      icon: "🌟", 
      count: counts.star, 
      desc: "高ROI + 高利润",
      color: "bg-amber-50 border-amber-200",
      badge: "bg-amber-100 text-amber-700"
    },
    { 
      label: "潜力SKU", 
      icon: "🚀", 
      count: counts.potential, 
      desc: "高ROI + 低销量",
      color: "bg-blue-50 border-blue-200",
      badge: "bg-blue-100 text-blue-700"
    },
    { 
      label: "薄利SKU", 
      icon: "📊", 
      count: counts.thin, 
      desc: "低ROI + 高销量",
      color: "bg-orange-50 border-orange-200",
      badge: "bg-orange-100 text-orange-700"
    },
    { 
      label: "问题SKU", 
      icon: "⚠️", 
      count: counts.problem, 
      desc: "ROI<2 或 亏损",
      color: "bg-red-50 border-red-200",
      badge: "bg-red-100 text-red-700"
    }
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {quadrants.map((q, i) => (
        <div key={i} className={`${q.color} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{q.icon}</span>
            <span className="font-semibold text-gray-800">{q.label}</span>
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">{q.count}</div>
          <div className="text-xs text-gray-500">{q.desc}</div>
        </div>
      ))}
    </div>
  );
}
