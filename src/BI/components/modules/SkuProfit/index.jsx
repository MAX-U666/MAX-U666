import React, { useState } from "react";
import { SkuOverview } from "./SkuOverview";
import { SkuQuadrant } from "./SkuQuadrant";
import { SkuRanking } from "./SkuRanking";
import { SkuCharts } from "./SkuCharts";
import { SkuTable } from "./SkuTable";
import { skuData } from "../../../data/mock";

const cardStyle = {
  background: '#FFFFFF',
  borderRadius: '14px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
};

const btnStyle = (active) => ({
  padding: '8px 16px',
  borderRadius: '8px',
  border: active ? '2px solid #FF6B35' : '1px solid #E8E8ED',
  background: active ? 'rgba(255,107,53,0.06)' : '#fff',
  color: active ? '#FF6B35' : '#333',
  fontSize: '13px',
  fontWeight: '500',
  cursor: 'pointer'
});

export function SkuProfitModule() {
  const [dateRange, setDateRange] = useState("7d");
  const [view, setView] = useState("overview");

  const filteredData = skuData;
  
  const stats = {
    total: filteredData.length,
    profit: filteredData.filter(s => s.profit > 0).length,
    loss: filteredData.filter(s => s.profit <= 0).length,
    roiOk: filteredData.filter(s => s.roi >= 4).length,
    totalProfit: filteredData.reduce((sum, s) => sum + s.profit, 0)
  };

  const quadrantData = {
    star: filteredData.filter(s => s.roi >= 4 && s.profit >= 5000).length,
    potential: filteredData.filter(s => s.roi >= 4 && s.profit < 5000).length,
    thin: filteredData.filter(s => s.roi < 4 && s.roi >= 2 && s.orders >= 50).length,
    problem: filteredData.filter(s => s.roi < 2 || s.profit < 0).length
  };

  const topProfit = [...filteredData].sort((a, b) => b.profit - a.profit).slice(0, 5);
  const topRoi = [...filteredData].sort((a, b) => b.roi - a.roi).slice(0, 5);

  return (
    <div>
      {/* 时间筛选 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[
          { key: 'today', label: '今日' },
          { key: 'yesterday', label: '昨日' },
          { key: '7d', label: '近7天' },
          { key: '30d', label: '近30天' }
        ].map(d => (
          <button key={d.key} onClick={() => setDateRange(d.key)} style={btnStyle(dateRange === d.key)}>
            {d.label}
          </button>
        ))}
      </div>

      {/* 概览卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: 'SKU总数', value: stats.total, sub: '' },
          { label: '盈利SKU', value: stats.profit, sub: `${(stats.profit/stats.total*100).toFixed(1)}%`, color: '#10B981' },
          { label: '亏损SKU', value: stats.loss, sub: `${(stats.loss/stats.total*100).toFixed(1)}%`, color: '#EF4444' },
          { label: 'ROI达标', value: stats.roiOk, sub: 'ROI≥4', color: '#3B82F6' },
          { label: 'SKU总利润', value: `¥${stats.totalProfit.toLocaleString()}`, sub: '' }
        ].map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>{item.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#1a1a1a' }}>{item.value}</div>
            {item.sub && <div style={{ fontSize: '12px', color: item.color || '#999', marginTop: '4px' }}>{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* 四象限 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: '🌟 明星SKU', value: quadrantData.star, desc: '高ROI + 高利润', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', color: '#10B981' },
          { label: '🚀 潜力SKU', value: quadrantData.potential, desc: '高ROI + 低销量', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', color: '#3B82F6' },
          { label: '⚠️ 薄利SKU', value: quadrantData.thin, desc: '低ROI + 高销量', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', color: '#F59E0B' },
          { label: '🚨 问题SKU', value: quadrantData.problem, desc: 'ROI<2 或 亏损', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', color: '#EF4444' }
        ].map((q, i) => (
          <div key={i} style={{ ...cardStyle, background: q.bg, border: `1px solid ${q.border}` }}>
            <div style={{ fontSize: '13px', color: q.color, fontWeight: '600', marginBottom: '8px' }}>{q.label}</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: q.color }}>{q.value}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{q.desc}</div>
          </div>
        ))}
      </div>

      {/* TOP5 排行榜 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>🏆 利润排行榜 TOP5</div>
          {topProfit.map((sku, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{sku.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{sku.orders}单 | ROI {sku.roi.toFixed(2)}</div>
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#10B981' }}>¥{sku.profit.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>⚡ ROI排行榜 TOP5</div>
          {topRoi.map((sku, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < 4 ? '1px solid #F0F0F0' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>{sku.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{sku.orders}单 | 利润 ¥{sku.profit.toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#3B82F6' }}>{sku.roi.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SKU 表格 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>📦 SKU 明细</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
                {['SKU名称', '订单数', '销售额', '广告费', '成本', '利润', 'ROI', '利润率'].map(h => (
                  <th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#666' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((sku, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #F5F5F5' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{sku.name}</td>
                  <td style={{ padding: '12px 8px' }}>{sku.orders}</td>
                  <td style={{ padding: '12px 8px' }}>¥{sku.revenue.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px' }}>¥{sku.adSpend.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px' }}>¥{sku.cost.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', fontWeight: '600', color: sku.profit > 0 ? '#10B981' : '#EF4444' }}>
                    ¥{sku.profit.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px',
                      background: sku.roi >= 4 ? 'rgba(16,185,129,0.1)' : sku.roi >= 2 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: sku.roi >= 4 ? '#10B981' : sku.roi >= 2 ? '#F59E0B' : '#EF4444'
                    }}>
                      {sku.roi.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{((sku.profit / sku.revenue) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
