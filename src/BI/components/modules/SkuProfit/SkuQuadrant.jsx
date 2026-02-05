import React from "react";

const quadrants = [
  { 
    label: "明星SKU", 
    icon: "🌟", 
    count: 0, 
    desc: "高ROI + 高利润",
    bgColor: "rgba(16, 185, 129, 0.08)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    textColor: "#10B981"
  },
  { 
    label: "潜力SKU", 
    icon: "💪", 
    count: 2, 
    desc: "高ROI + 低销量",
    bgColor: "rgba(59, 130, 246, 0.08)",
    borderColor: "rgba(59, 130, 246, 0.2)",
    textColor: "#3B82F6"
  },
  { 
    label: "薄利SKU", 
    icon: "⚠️", 
    count: 3, 
    desc: "低ROI + 高销量",
    bgColor: "rgba(245, 158, 11, 0.08)",
    borderColor: "rgba(245, 158, 11, 0.2)",
    textColor: "#F59E0B"
  },
  { 
    label: "问题SKU", 
    icon: "🚨", 
    count: 3, 
    desc: "ROI小于2 或 亏损",
    bgColor: "rgba(239, 68, 68, 0.08)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    textColor: "#EF4444"
  }
];

export function SkuQuadrant() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {quadrants.map((q, idx) => (
        <div 
          key={idx} 
          style={{
            background: q.bgColor,
            border: `1px solid ${q.borderColor}`,
            borderRadius: '12px',
            padding: '16px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px' }}>{q.icon}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: q.textColor }}>{q.label}</span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: q.textColor, marginBottom: '4px' }}>
            {q.count}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>{q.desc}</div>
        </div>
      ))}
    </div>
  );
}
