import React, { useState } from "react";
import { shopData } from "../../../data/mock";

const cardStyle = {
  background: '#FFFFFF',
  borderRadius: '14px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
};

export function ShopProfitModule() {
  const [expandedShop, setExpandedShop] = useState(null);

  const totalRevenue = shopData.reduce((sum, s) => sum + s.revenue, 0);
  const totalAdSpend = shopData.reduce((sum, s) => sum + s.adSpend, 0);
  const totalCost = shopData.reduce((sum, s) => sum + s.cost, 0);
  const totalProfit = shopData.reduce((sum, s) => sum + s.profit, 0);
  const totalOrders = shopData.reduce((sum, s) => sum + s.orders, 0);
  const avgRoi = totalAdSpend > 0 ? totalRevenue / totalAdSpend : 0;

  return (
    <div>
      {/* 集团汇总 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏢 集团口径汇总
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '20px' }}>
          {[
            { label: '总回款', value: `¥${totalRevenue.toLocaleString()}` },
            { label: '总广告费', value: `¥${totalAdSpend.toLocaleString()}`, color: '#EF4444' },
            { label: '总成本', value: `¥${totalCost.toLocaleString()}` },
            { label: '总利润', value: `¥${totalProfit.toLocaleString()}`, color: '#10B981' },
            { label: '整体ROI', value: avgRoi.toFixed(2), color: '#3B82F6' },
            { label: '总订单量', value: totalOrders.toLocaleString() }
          ].map((item, i) => (
            <div key={i}>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '6px' }}>{item.label}</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: item.color || '#1a1a1a' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 成本结构 */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>📊 成本结构占比</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          {[
            { label: '商品成本', value: totalCost * 0.6, color: '#3B82F6' },
            { label: '广告费用', value: totalAdSpend, color: '#F59E0B' },
            { label: '物流费用', value: totalCost * 0.25, color: '#10B981' },
            { label: '平台扣点', value: totalCost * 0.15, color: '#8B5CF6' }
          ].map((item, i) => {
            const pct = ((item.value / (totalCost + totalAdSpend)) * 100).toFixed(1);
            return (
              <div key={i} style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#666' }}>{item.label}</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: item.color }}>{pct}%</span>
                </div>
                <div style={{ height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: '4px' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>¥{item.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 店铺列表 */}
      <div style={{ ...cardStyle, marginTop: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px' }}>🏪 各店铺利润</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F0F0F0' }}>
              {['店铺', '订单数', '销售额', '广告费', '成本', '利润', 'ROI', '利润率', '操作'].map(h => (
                <th key={h} style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#666' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shopData.map((shop, i) => (
              <React.Fragment key={i}>
                <tr style={{ borderBottom: '1px solid #F5F5F5', cursor: 'pointer' }} onClick={() => setExpandedShop(expandedShop === shop.id ? null : shop.id)}>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{shop.name}</td>
                  <td style={{ padding: '12px 8px' }}>{shop.orders}</td>
                  <td style={{ padding: '12px 8px' }}>¥{shop.revenue.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px' }}>¥{shop.adSpend.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px' }}>¥{shop.cost.toLocaleString()}</td>
                  <td style={{ padding: '12px 8px', fontWeight: '600', color: shop.profit > 0 ? '#10B981' : '#EF4444' }}>
                    ¥{shop.profit.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                      background: shop.roi >= 4 ? 'rgba(16,185,129,0.1)' : shop.roi >= 2 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                      color: shop.roi >= 4 ? '#10B981' : shop.roi >= 2 ? '#F59E0B' : '#EF4444'
                    }}>{shop.roi.toFixed(2)}</span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{((shop.profit / shop.revenue) * 100).toFixed(1)}%</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ color: '#3B82F6', cursor: 'pointer' }}>{expandedShop === shop.id ? '收起 ▲' : '展开 ▼'}</span>
                  </td>
                </tr>
                {expandedShop === shop.id && (
                  <tr>
                    <td colSpan={9} style={{ padding: '16px', background: '#FAFAFA' }}>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        店铺详情：{shop.name} 共 {shop.orders} 单，日均 {Math.round(shop.orders / 7)} 单
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
