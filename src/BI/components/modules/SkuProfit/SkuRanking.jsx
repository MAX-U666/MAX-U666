import React from "react";
import { formatCNY } from "../../../utils/format";

const profitTop5 = [
  { name: "凡士林真润倍护霜40G", orders: 269, roi: 3.84, profit: 18735.74 },
  { name: "凡士林真润倍护霜40G(大)", orders: 108, roi: 3.41, profit: 1969.17 },
  { name: "紫色牙膏+牙刷", orders: 45, roi: 2.85, profit: 856.32 },
  { name: "美白牙膏套装", orders: 38, roi: 2.12, profit: 542.18 },
  { name: "护手霜礼盒", orders: 22, roi: 1.95, profit: 312.45 }
];

const roiTop5 = [
  { name: "黄色牙刷", orders: 1, roi: 43.28, profit: 23.30 },
  { name: "紫色牙膏+牙刷", orders: 3, roi: 9.32, profit: 144.50 },
  { name: "儿童牙刷套装", orders: 5, roi: 6.75, profit: 89.20 },
  { name: "旅行洗漱包", orders: 8, roi: 5.42, profit: 167.80 },
  { name: "凡士林真润倍护霜40G", orders: 269, roi: 3.84, profit: 18735.74 }
];

const cardStyle = {
  background: '#FFFFFF',
  borderRadius: '12px',
  padding: '20px',
  border: '1px solid #E8E8ED'
};

const medals = ["🥇", "🥈", "🥉", "4", "5"];

export function SkuRanking() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {/* 利润排行榜 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏆</span> 利润排行榜 TOP5
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {profitTop5.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: idx < 3 ? '18px' : '12px',
                  background: idx >= 3 ? '#F5F5F7' : 'transparent',
                  borderRadius: '50%',
                  color: '#999'
                }}>
                  {medals[idx]}
                </span>
                <div>
                  <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{item.orders}单 | ROI {item.roi}</div>
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#FF6B35' }}>
                {formatCNY(item.profit)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ROI排行榜 */}
      <div style={cardStyle}>
        <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>⚡</span> ROI排行榜 TOP5
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {roiTop5.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  width: '28px', 
                  height: '28px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: idx < 3 ? '18px' : '12px',
                  background: idx >= 3 ? '#F5F5F7' : 'transparent',
                  borderRadius: '50%',
                  color: '#999'
                }}>
                  {medals[idx]}
                </span>
                <div>
                  <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: '500' }}>{item.name}</div>
                  <div style={{ fontSize: '12px', color: '#999' }}>{item.orders}单 | 利润 {formatCNY(item.profit)}</div>
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#3B82F6' }}>
                {item.roi}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
