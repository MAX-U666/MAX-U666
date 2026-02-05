/**
 * 订单利润趋势图组件
 */
import React, { useState } from 'react';

export function OrderTrend() {
  const [timeRange, setTimeRange] = useState('7days');

  const shops = [
    { name: 'B03', color: 'bg-blue-500' },
    { name: '15004', color: 'bg-green-500' },
    { name: '15010', color: 'bg-yellow-500' },
    { name: '15007', color: 'bg-purple-500' },
    { name: '15009', color: 'bg-pink-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-700 text-sm font-semibold">📈 订单利润趋势（按店铺叠加）</h3>
        <div className="flex gap-2">
          {[
            { id: '7days', label: '近7天' },
            { id: '30days', label: '近30天' },
            { id: '90days', label: '近90天' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                timeRange === t.id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 店铺图例 */}
      <div className="flex gap-4 mb-4">
        {shops.map((shop, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span className={`w-3 h-3 rounded-full ${shop.color}`}></span>
            <span className="text-gray-600">{shop.name}</span>
          </div>
        ))}
      </div>

      {/* 折线图区域 */}
      <div className="relative h-64 border border-gray-100 rounded-lg bg-gray-50">
        {/* Y轴标签 */}
        <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2 text-xs text-gray-400">
          <span>¥50k</span>
          <span>¥40k</span>
          <span>¥30k</span>
          <span>¥20k</span>
          <span>¥10k</span>
          <span>¥0</span>
        </div>
        
        {/* 图表区域 */}
        <div className="absolute left-12 right-4 top-4 bottom-8">
          <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
            {/* 网格线 */}
            {[0, 40, 80, 120, 160, 200].map((y, i) => (
              <line key={i} x1="0" y1={y} x2="700" y2={y} stroke="#e5e7eb" strokeWidth="1" />
            ))}
            
            {/* B03 - 蓝色 */}
            <polyline 
              fill="none" 
              stroke="#3b82f6" 
              strokeWidth="2.5"
              points="0,80 100,70 200,60 300,50 400,65 500,45 600,40 700,35"
            />
            
            {/* 15004 - 绿色 */}
            <polyline 
              fill="none" 
              stroke="#22c55e" 
              strokeWidth="2.5"
              points="0,140 100,135 200,145 300,130 400,125 500,140 600,135 700,120"
            />
            
            {/* 15010 - 黄色 */}
            <polyline 
              fill="none" 
              stroke="#eab308" 
              strokeWidth="2.5"
              points="0,120 100,115 200,125 300,110 400,105 500,115 600,100 700,95"
            />
            
            {/* 15007 - 紫色 */}
            <polyline 
              fill="none" 
              stroke="#a855f7" 
              strokeWidth="2.5"
              points="0,150 100,145 200,155 300,140 400,145 500,135 600,140 700,130"
            />
            
            {/* 15009 - 粉色 */}
            <polyline 
              fill="none" 
              stroke="#ec4899" 
              strokeWidth="2.5"
              points="0,170 100,168 200,175 300,165 400,170 500,160 600,165 700,155"
            />
          </svg>
        </div>
        
        {/* X轴标签 */}
        <div className="absolute left-12 right-4 bottom-0 flex justify-between text-xs text-gray-400">
          <span>01-09</span>
          <span>01-10</span>
          <span>01-11</span>
          <span>01-12</span>
          <span>01-13</span>
          <span>01-14</span>
          <span>01-15</span>
        </div>
      </div>
    </div>
  );
}

export default OrderTrend;
