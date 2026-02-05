import React from "react";
import { formatCNY } from "../../../utils/format";

const mockData = {
  totalSku: 10,
  profitSku: 7,
  lossSku: 3,
  roiReached: 2,
  totalProfit: 22932.82
};

const cardStyle = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '16px 20px',
  border: '1px solid #E8E8ED'
};

export function SkuOverview() {
  const metrics = [
    { label: "SKU总数", value: mockData.totalSku, sub: null },
    { label: "盈利SKU", value: mockData.profitSku, sub: `${(mockData.profitSku/mockData.totalSku*100).toFixed(1)}%`, subColor: "#10B981" },
    { label: "亏损SKU", value: mockData.lossSku, sub: `${(mockData.lossSku/mockData.totalSku*100).toFixed(1)}%`, subColor: "#EF4444" },
    { label: "ROI达标", value: mockData.roiReached, sub: "ROI≥4", subColor: "#3B82F6" },
    { label: "SKU总利润", value: formatCNY(mockData.totalProfit), sub: null }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
      {metrics.map((item, idx) => (
        <div key={idx} style={cardStyle}>
          <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>{item.label}</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#1a1a1a' }}>{item.value}</div>
          {item.sub && (
            <div style={{ fontSize: '12px', color: item.subColor, marginTop: '4px' }}>{item.sub}</div>
          )}
        </div>
      ))}
    </div>
  );
}
