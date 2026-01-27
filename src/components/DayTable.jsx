import React from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';

const DayTable = ({ selectedProduct }) => {
  if (!selectedProduct?.daily_data) return null;
  
  const dailyData = selectedProduct.daily_data;
  const currentDay = selectedProduct.current_day || 1;

  const summary = {
    totalOrganic: dailyData.reduce((sum, d) => sum + (d.organic_orders || 0), 0),
    totalManual: dailyData.reduce((sum, d) => sum + (d.manual_orders || 0), 0),
    totalAdSpend: dailyData.reduce((sum, d) => sum + (d.ad_spend || 0), 0),
    totalAdRevenue: dailyData.reduce((sum, d) => sum + (d.ad_revenue || 0), 0),
    avgROI: dailyData.filter(d => d.roi > 0).length > 0 
      ? (dailyData.filter(d => d.roi > 0).reduce((sum, d) => sum + parseFloat(d.roi), 0) / dailyData.filter(d => d.roi > 0).length).toFixed(2) 
      : 0
  };

  const headers = ['阶段', '日期', '实际单', '自然单', '曝光', '点击', '加购', '转化率', '广告曝光', '广告点击', 'CTR', '广告单', '广告转化', '花费', '收入', '设置ROI', '实际ROI', 'AI决策', '补单'];

  return (
    <div style={{ ...styles.card, background: 'rgba(255,255,255,0.02)' }}>
      {/* 表头统计 */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MiniLogo size={20} color="#FF6B35" />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>7天数据追踪</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#94A3B8' }}>
          <span>累计订单 <strong style={{ color: '#10B981' }}>{summary.totalOrganic + summary.totalManual}</strong></span>
          <span>累计花费 <strong style={{ color: '#EF4444' }}>Rp {(summary.totalAdSpend/1000).toFixed(0)}k</strong></span>
          <span>累计收入 <strong style={{ color: '#10B981' }}>Rp {(summary.totalAdRevenue/1000).toFixed(0)}k</strong></span>
          <span>整体ROI <strong style={{ color: summary.avgROI >= 3 ? '#10B981' : '#F59E0B' }}>{summary.avgROI}</strong></span>
        </div>
      </div>
      
      {/* 表格 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '1400px' }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: '14px 10px', textAlign: 'center', fontWeight: '600', color: '#64748B', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dailyData.map((row) => {
              const isCurrentDay = row.day_number === currentDay;
              const cvr = row.visitors > 0 ? (row.organic_orders / row.visitors * 100).toFixed(2) : 0;
              const adCTR = row.ad_impressions > 0 ? (row.ad_clicks / row.ad_impressions * 100).toFixed(2) : 0;
              const adCVR = row.ad_clicks > 0 ? (row.ad_orders / row.ad_clicks * 100).toFixed(2) : 0;
              const naturalOrders = Math.max(0, (row.organic_orders || 0) - (row.ad_orders || 0));
              
              const cellStyle = { padding: '12px 10px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' };
              
              return (
                <tr key={row.day_number} style={{ 
                  background: isCurrentDay ? 'rgba(255,107,53,0.08)' : 'transparent',
                  borderLeft: isCurrentDay ? '3px solid #FF6B35' : '3px solid transparent'
                }}>
                  <td style={{ ...cellStyle, fontWeight: '700', color: isCurrentDay ? '#FF6B35' : '#E2E8F0' }}>
                    {isCurrentDay && <span style={{ marginRight: '4px' }}>▸</span>}Day {row.day_number}
                  </td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{new Date(row.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}</td>
                  <td style={{ ...cellStyle, color: '#10B981', fontWeight: '600' }}>{row.organic_orders || '-'}</td>
                  <td style={{ ...cellStyle, color: '#3B82F6', fontWeight: '600' }}>{naturalOrders || '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{row.visitors || '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{row.clicks || '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{row.add_to_cart || '-'}</td>
                  <td style={{ ...cellStyle, color: '#10B981', fontWeight: '600' }}>{cvr > 0 ? `${cvr}%` : '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{row.ad_impressions?.toLocaleString() || '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{row.ad_clicks || '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{adCTR > 0 ? `${adCTR}%` : '-'}</td>
                  <td style={{ ...cellStyle, color: '#F97316', fontWeight: '600' }}>{row.ad_orders || '-'}</td>
                  <td style={{ ...cellStyle, color: '#F97316' }}>{adCVR > 0 ? `${adCVR}%` : '-'}</td>
                  <td style={{ ...cellStyle, color: '#EF4444', fontWeight: '600' }}>{row.ad_spend ? `Rp ${(row.ad_spend/1000).toFixed(0)}k` : '-'}</td>
                  <td style={{ ...cellStyle, color: '#10B981', fontWeight: '600' }}>{row.ad_revenue ? `Rp ${(row.ad_revenue/1000).toFixed(0)}k` : '-'}</td>
                  <td style={{ ...cellStyle, color: '#94A3B8' }}>{selectedProduct.target_roi || '-'}</td>
                  <td style={{ ...cellStyle, fontWeight: '700', color: row.roi >= 3 ? '#10B981' : row.roi > 0 ? '#F59E0B' : '#64748B' }}>{row.roi > 0 ? row.roi : '-'}</td>
                  <td style={cellStyle}>
                    {row.ai_action ? (
                      <span style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: '600', background: row.status === '已执行' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: row.status === '已执行' ? '#10B981' : '#F59E0B' }}>
                        {row.status === '已执行' ? '✓ ' : '→ '}{row.ai_action}
                      </span>
                    ) : <span style={{ color: '#475569' }}>-</span>}
                  </td>
                  <td style={{ ...cellStyle, color: '#8B5CF6', fontWeight: '600' }}>{row.manual_orders || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DayTable;
