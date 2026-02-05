import React, { useState } from "react";
import { SkuOverview } from "./SkuOverview";
import { SkuQuadrant } from "./SkuQuadrant";
import { SkuRanking } from "./SkuRanking";
import { SkuTable } from "./SkuTable";

const cardStyle = {
  background: '#FFFFFF',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  border: '1px solid #E8E8ED'
};

const btnBase = {
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

export function SkuProfitModule() {
  const [dateRange, setDateRange] = useState("7d");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 日期筛选 + 操作按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { key: "today", label: "今日" },
            { key: "yesterday", label: "昨日" },
            { key: "7d", label: "近7天" },
            { key: "30d", label: "近30天" }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setDateRange(item.key)}
              style={{
                ...btnBase,
                background: dateRange === item.key ? 'linear-gradient(135deg, #FF6B35, #F7931E)' : '#F5F5F7',
                color: dateRange === item.key ? '#fff' : '#666',
                border: 'none'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button style={{ ...btnBase, background: '#F5F5F7', color: '#333', border: '1px solid #E8E8ED' }}>
            导出报表
          </button>
          <button style={{ ...btnBase, background: 'linear-gradient(135deg, #FF6B35, #F7931E)', color: '#fff', border: 'none' }}>
            刷新数据
          </button>
        </div>
      </div>

      {/* 概览卡片 */}
      <SkuOverview />

      {/* 四象限 */}
      <SkuQuadrant />

      {/* 排行榜 */}
      <SkuRanking />

      {/* SKU 明细表 */}
      <div style={cardStyle}>
        <SkuTable />
      </div>
    </div>
  );
}
