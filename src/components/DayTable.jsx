import React, { useState } from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';

const DayTable = ({ selectedProduct, selectedDay, onDaySelect }) => {
  const [viewMode, setViewMode] = useState('compact'); // compact | full
  
  if (!selectedProduct?.daily_data) return null;
  
  const dailyData = selectedProduct.daily_data;
  const currentDay = selectedDay || selectedProduct.current_day || 1;

  // 汇总统计
  const summary = {
    totalOrdersCreated: dailyData.reduce((sum, d) => sum + (d.orders_created || d.organic_orders || 0), 0),
    totalOrdersReady: dailyData.reduce((sum, d) => sum + (d.orders_ready || 0), 0),
    totalManual: dailyData.reduce((sum, d) => sum + (d.manual_orders || 0), 0),
    totalRevenueCreated: dailyData.reduce((sum, d) => sum + (d.revenue_created || 0), 0),
    totalRevenueReady: dailyData.reduce((sum, d) => sum + (d.revenue_ready || 0), 0),
    totalAdSpend: dailyData.reduce((sum, d) => sum + (d.ad_spend || 0), 0),
    totalAdRevenue: dailyData.reduce((sum, d) => sum + (d.ad_revenue || 0), 0),
    avgROI: dailyData.filter(d => d.roi > 0).length > 0 
      ? (dailyData.filter(d => d.roi > 0).reduce((sum, d) => sum + parseFloat(d.roi), 0) / dailyData.filter(d => d.roi > 0).length).toFixed(2) 
      : 0
  };

  // 紧凑模式的列
  const compactHeaders = [
    { key: 'day', label: '阶段', width: '70px' },
    { key: 'date', label: '日期', width: '60px' },
    { key: 'visitors', label: '总访客', width: '60px' },
    { key: 'natural_visitors', label: '自然访客', width: '70px' },
    { key: 'clicks', label: '总点击', width: '55px' },
    { key: 'natural_clicks', label: '自然点击', width: '70px' },
    { key: 'add_to_cart', label: '加购', width: '50px' },
    { key: 'orders_created', label: '总单量', width: '60px' },
    { key: 'natural_orders', label: '自然单', width: '60px' },
    { key: 'conversion_rate', label: '转化率', width: '60px' },
    { key: 'ad_impressions', label: '广告曝光', width: '80px' },
    { key: 'ad_clicks', label: '广告点击', width: '70px' },
    { key: 'ad_ctr', label: '广告点击率', width: '75px' },
    { key: 'ad_orders', label: '广告单', width: '60px' },
    { key: 'ad_spend', label: '花费', width: '75px' },
    { key: 'ad_revenue', label: '收入', width: '75px' },
    { key: 'roi', label: 'ROI', width: '55px' },
    { key: 'ai_action', label: 'AI决策', width: '90px' },
    { key: 'manual_orders', label: '补单', width: '45px' },
  ];

  // 完整模式的列
  const fullHeaders = [
    { key: 'day', label: '阶段', width: '70px' },
    { key: 'date', label: '日期', width: '60px' },
    { key: 'visitors', label: '总访客', width: '60px', group: 'traffic' },
    { key: 'natural_visitors', label: '自然访客', width: '70px', group: 'traffic' },
    { key: 'page_views', label: '浏览', width: '55px', group: 'traffic' },
    { key: 'visitors_no_buy', label: '未购', width: '50px', group: 'traffic' },
    { key: 'clicks', label: '总点击', width: '55px', group: 'traffic' },
    { key: 'natural_clicks', label: '自然点击', width: '70px', group: 'traffic' },
    { key: 'likes', label: '收藏', width: '45px', group: 'traffic' },
    { key: 'cart_visitors', label: '加购人', width: '60px', group: 'cart' },
    { key: 'add_to_cart', label: '加购数', width: '60px', group: 'cart' },
    { key: 'cart_rate', label: '加购率', width: '60px', group: 'cart' },
    { key: 'orders_created', label: '总单量', width: '60px', group: 'order' },
    { key: 'natural_orders', label: '自然单', width: '60px', group: 'order' },
    { key: 'items_created', label: '下单件', width: '60px', group: 'order' },
    { key: 'revenue_created', label: '下单额', width: '80px', group: 'order' },
    { key: 'conversion_rate', label: '转化率', width: '60px', group: 'order' },
    { key: 'orders_ready', label: '发货人', width: '60px', group: 'ship' },
    { key: 'items_ready', label: '发货件', width: '60px', group: 'ship' },
    { key: 'revenue_ready', label: '发货额', width: '80px', group: 'ship' },
    { key: 'ready_created_rate', label: '发货比', width: '60px', group: 'ship' },
    { key: 'ad_impressions', label: '广告曝光', width: '80px', group: 'ad' },
    { key: 'ad_clicks', label: '广告点击', width: '70px', group: 'ad' },
    { key: 'ad_ctr', label: '广告点击率', width: '75px', group: 'ad' },
    { key: 'ad_orders', label: '广告单', width: '60px', group: 'ad' },
    { key: 'ad_spend', label: '花费', width: '75px', group: 'ad' },
    { key: 'ad_revenue', label: '收入', width: '75px', group: 'ad' },
    { key: 'roi', label: 'ROI', width: '55px', group: 'ad' },
    { key: 'ai_action', label: 'AI决策', width: '90px' },
    { key: 'manual_orders', label: '补单', width: '45px' },
  ];

  const headers = viewMode === 'compact' ? compactHeaders : fullHeaders;

  // 格式化显示值
  const formatValue = (row, key) => {
    const ordersCreated = row.orders_created || row.organic_orders || 0;
    const adOrders = row.ad_orders || 0;
    const naturalOrders = Math.max(0, ordersCreated - adOrders);
    const totalVisitors = row.visitors || 0;
    const adClicks = row.ad_clicks || 0;
    const naturalVisitors = Math.max(0, totalVisitors - adClicks);
    const totalClicks = row.clicks || 0;
    const naturalClicks = Math.max(0, totalClicks - adClicks);
    
    switch (key) {
      case 'day':
        return `Day ${row.day_number}`;
      case 'date':
        return new Date(row.date).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
      case 'visitors':
      case 'page_views':
      case 'visitors_no_buy':
      case 'clicks':
      case 'likes':
      case 'cart_visitors':
      case 'add_to_cart':
      case 'orders_created':
      case 'items_created':
      case 'orders_ready':
      case 'items_ready':
      case 'ad_clicks':
      case 'ad_orders':
      case 'manual_orders':
        return row[key] || '-';
      case 'natural_visitors':
        return naturalVisitors > 0 ? naturalVisitors : '-';
      case 'natural_clicks':
        return naturalClicks > 0 ? naturalClicks : '-';
      case 'natural_orders':
        return naturalOrders > 0 ? naturalOrders : '-';
      case 'ad_impressions':
        return row.ad_impressions ? row.ad_impressions.toLocaleString() : '-';
      case 'conversion_rate':
        const cvr = row.visitors > 0 ? (ordersCreated / row.visitors * 100).toFixed(2) : 0;
        return cvr > 0 ? `${cvr}%` : '-';
      case 'cart_rate':
        return row.cart_rate > 0 ? `${row.cart_rate}%` : '-';
      case 'ready_created_rate':
        return row.ready_created_rate > 0 ? `${row.ready_created_rate}%` : '-';
      case 'ad_ctr':
        const ctr = row.ad_impressions > 0 ? (row.ad_clicks / row.ad_impressions * 100).toFixed(2) : 0;
        return ctr > 0 ? `${ctr}%` : '-';
      case 'ad_spend':
        return row.ad_spend ? `Rp ${(row.ad_spend/1000).toFixed(0)}k` : '-';
      case 'ad_revenue':
        return row.ad_revenue ? `Rp ${(row.ad_revenue/1000).toFixed(0)}k` : '-';
      case 'revenue_created':
        return row.revenue_created ? `Rp ${(row.revenue_created/1000).toFixed(0)}k` : '-';
      case 'revenue_ready':
        return row.revenue_ready ? `Rp ${(row.revenue_ready/1000).toFixed(0)}k` : '-';
      case 'roi':
        return row.roi > 0 ? row.roi : '-';
      case 'ai_action':
        if (!row.ai_action) return '-';
        return (
          <span style={{ 
            padding: '5px 10px', 
            borderRadius: '6px', 
            fontSize: '10px', 
            fontWeight: '600', 
            background: row.status === '已执行' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', 
            color: row.status === '已执行' ? '#10B981' : '#F59E0B' 
          }}>
            {row.status === '已执行' ? '✓ ' : '→ '}{row.ai_action}
          </span>
        );
      default:
        return row[key] || '-';
    }
  };

  // 获取单元格颜色
  const getCellColor = (key, row) => {
    switch (key) {
      case 'visitors':
      case 'clicks':
        return '#94A3B8';
      case 'natural_visitors':
      case 'natural_clicks':
      case 'natural_orders':
        return '#3B82F6';
      case 'orders_created':
      case 'items_created':
      case 'orders_ready':
      case 'items_ready':
        return '#10B981';
      case 'conversion_rate':
      case 'cart_rate':
        return '#10B981';
      case 'ad_orders':
      case 'ad_ctr':
        return '#F97316';
      case 'ad_spend':
        return '#EF4444';
      case 'ad_revenue':
      case 'revenue_created':
      case 'revenue_ready':
        return '#10B981';
      case 'roi':
        return row.roi >= 3 ? '#10B981' : row.roi > 0 ? '#F59E0B' : '#64748B';
      case 'manual_orders':
        return '#8B5CF6';
      default:
        return '#94A3B8';
    }
  };

  // 处理行点击
  const handleRowClick = (dayNumber) => {
    if (onDaySelect) {
      onDaySelect(dayNumber);
    }
  };

  return (
    <div style={{ ...styles.card, background: 'rgba(255,255,255,0.02)' }}>
      {/* 表头统计 */}
      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid rgba(255,255,255,0.06)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MiniLogo size={20} color="#FF6B35" />
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>7天数据追踪</span>
          
          {/* 视图切换 */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '16px' }}>
            <button 
              onClick={() => setViewMode('compact')}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'compact' ? 'rgba(255,107,53,0.2)' : 'transparent',
                color: viewMode === 'compact' ? '#FF6B35' : '#64748B',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              精简
            </button>
            <button 
              onClick={() => setViewMode('full')}
              style={{
                padding: '4px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'full' ? 'rgba(255,107,53,0.2)' : 'transparent',
                color: viewMode === 'full' ? '#FF6B35' : '#64748B',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              完整 (28列)
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', fontSize: '12px', color: '#94A3B8' }}>
          <span>总单 <strong style={{ color: '#10B981' }}>{summary.totalOrdersCreated}</strong></span>
          <span>发货 <strong style={{ color: '#3B82F6' }}>{summary.totalOrdersReady}</strong></span>
          <span>花费 <strong style={{ color: '#EF4444' }}>Rp {(summary.totalAdSpend/1000).toFixed(0)}k</strong></span>
          <span>广告收入 <strong style={{ color: '#10B981' }}>Rp {(summary.totalAdRevenue/1000).toFixed(0)}k</strong></span>
          <span>店铺收入 <strong style={{ color: '#10B981' }}>Rp {(summary.totalRevenueCreated/1000000).toFixed(1)}M</strong></span>
          <span>整体ROI <strong style={{ color: summary.avgROI >= 3 ? '#10B981' : '#F59E0B' }}>{summary.avgROI}</strong></span>
        </div>
      </div>
      
      {/* 表格 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '11px', 
          minWidth: viewMode === 'compact' ? '1400px' : '2000px' 
        }}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th 
                  key={i} 
                  style={{ 
                    padding: '14px 8px', 
                    textAlign: 'center', 
                    fontWeight: '600', 
                    color: '#64748B', 
                    fontSize: '10px', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.5px', 
                    borderBottom: '1px solid rgba(255,255,255,0.06)', 
                    background: 'rgba(255,255,255,0.02)',
                    minWidth: h.width,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dailyData.map((row) => {
              const isSelected = row.day_number === currentDay;
              const hasData = row.status !== '未提交';
              
              return (
                <tr 
                  key={row.day_number}
                  onClick={() => handleRowClick(row.day_number)}
                  style={{ 
                    background: isSelected ? 'rgba(255,107,53,0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #FF6B35' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {headers.map((h, i) => (
                    <td 
                      key={i}
                      style={{ 
                        padding: '12px 8px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        color: h.key === 'day' 
                          ? (isSelected ? '#FF6B35' : '#E2E8F0')
                          : getCellColor(h.key, row),
                        fontWeight: ['day', 'orders_created', 'natural_orders', 'natural_visitors', 'natural_clicks', 'roi', 'ad_spend', 'ad_revenue', 'revenue_created'].includes(h.key) ? '600' : '400'
                      }}
                    >
                      {h.key === 'day' && isSelected && <span style={{ marginRight: '4px' }}>▸</span>}
                      {formatValue(row, h.key)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* 图例说明 */}
      {viewMode === 'full' && (
        <div style={{ 
          padding: '12px 20px', 
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: '24px',
          fontSize: '10px',
          color: '#64748B'
        }}>
          <span>📊 <strong>流量</strong>: 总访客/自然访客/浏览/总点击/自然点击/收藏</span>
          <span>🛒 <strong>加购</strong>: 加购人/加购数/加购率</span>
          <span>📦 <strong>订单</strong>: 总单量/自然单/件数/金额/转化率</span>
          <span>🚚 <strong>发货</strong>: 发货人/件数/金额/发货比</span>
          <span>📢 <strong>广告</strong>: 曝光/点击/点击率/广告单/花费/收入/ROI</span>
        </div>
      )}
      
      {/* 提示 */}
      <div style={{ padding: '8px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '10px', color: '#64748B', textAlign: 'center' }}>
        💡 点击任意行查看该天的 AI 决策分析
      </div>
    </div>
  );
};

export default DayTable;
