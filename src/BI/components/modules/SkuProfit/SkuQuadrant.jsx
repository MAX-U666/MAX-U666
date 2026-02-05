import React from "react";

const quadrants = [
  { 
    label: "明星SKU", 
    icon: "🌟", 
    count: 0, 
    desc: "高ROI + 高利润",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-600"
  },
  { 
    label: "潜力SKU", 
    icon: "💪", 
    count: 2, 
    desc: "高ROI + 低销量",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-600"
  },
  { 
    label: "薄利SKU", 
    icon: "⚠️", 
    count: 3, 
    desc: "低ROI + 高销量",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-600"
  },
  { 
    label: "问题SKU", 
    icon: "🚨", 
    count: 3, 
    desc: "ROI小于2 或 亏损",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-600"
  }
];

export function SkuQuadrant() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {quadrants.map((q, idx) => (
        <div 
          key={idx} 
          className={`${q.bgColor} ${q.borderColor} border rounded-xl p-4`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">{q.icon}</span>
            <span className={`text-sm font-semibold ${q.textColor}`}>{q.label}</span>
          </div>
          <div className={`text-3xl font-bold ${q.textColor} mb-1`}>
            {q.count}
          </div>
          <div className="text-xs text-gray-500">{q.desc}</div>
        </div>
      ))}
    </div>
  );
}
