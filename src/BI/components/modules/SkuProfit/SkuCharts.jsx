/**
 * SKU图表组件（双环饼图 + 散点图）
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';

export function SkuCharts() {
  const pieData = [
    { name: '凡士林真润倍护霜40G', orders: 269, profit: 18735.74, orderPercent: 50, profitPercent: 45, color: 'bg-blue-500' },
    { name: 'Aiposhiy生姜洗发水', orders: 68, profit: 1395.08, orderPercent: 18, profitPercent: 20, color: 'bg-green-500' },
    { name: '凡士林真润倍护霜40G(大)', orders: 108, profit: 1969.17, orderPercent: 12, profitPercent: 15, color: 'bg-yellow-500' },
    { name: 'Aiposhiy白提味牙膏', orders: 14, profit: 319.93, orderPercent: 5, profitPercent: 10, color: 'bg-purple-500' },
    { name: '其他SKU', orders: 34, profit: 516.00, orderPercent: 15, profitPercent: 10, color: 'bg-gray-500' },
  ];

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 双环饼图 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">🍩 SKU出单占比 & 利润占比（双环图）</h3>
        <div className="flex">
          {/* 双环饼图 */}
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* 外环 - 利润占比 */}
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="20" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#3b82f6" strokeWidth="20"
                strokeDasharray="254.47 565.49" strokeDashoffset="0" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#22c55e" strokeWidth="20"
                strokeDasharray="113.10 565.49" strokeDashoffset="-254.47" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#eab308" strokeWidth="20"
                strokeDasharray="84.82 565.49" strokeDashoffset="-367.57" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#a855f7" strokeWidth="20"
                strokeDasharray="56.55 565.49" strokeDashoffset="-452.39" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="90" fill="none" stroke="#6b7280" strokeWidth="20"
                strokeDasharray="56.55 565.49" strokeDashoffset="-508.94" transform="rotate(-90 100 100)" />

              {/* 内环 - 出单占比 */}
              <circle cx="100" cy="100" r="60" fill="none" stroke="#e5e7eb" strokeWidth="15" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#93c5fd" strokeWidth="15"
                strokeDasharray="188.50 376.99" strokeDashoffset="0" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#86efac" strokeWidth="15"
                strokeDasharray="67.86 376.99" strokeDashoffset="-188.50" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#fde047" strokeWidth="15"
                strokeDasharray="45.24 376.99" strokeDashoffset="-256.36" transform="rotate(-90 100 100)" />
              <circle cx="100" cy="100" r="60" fill="none" stroke="#d1d5db" strokeWidth="15"
                strokeDasharray="75.40 376.99" strokeDashoffset="-301.60" transform="rotate(-90 100 100)" />

              {/* 中心文字 */}
              <text x="100" y="95" textAnchor="middle" className="text-xs fill-gray-500">总利润</text>
              <text x="100" y="115" textAnchor="middle" className="text-sm font-bold fill-gray-800">¥22,936</text>
            </svg>
            
            {/* 环形图例 */}
            <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span>内环:出单</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span>外环:利润</span>
            </div>
          </div>

          {/* SKU详情列表 */}
          <div className="flex-1 ml-6">
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {pieData.map((sku, i) => (
                <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <span className={`w-3 h-3 rounded-full ${sku.color}`}></span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{sku.name}</div>
                    <div className="text-xs text-gray-500">
                      {sku.orders}单 ({sku.orderPercent}%) | {formatCNY(sku.profit)} ({sku.profitPercent}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 散点图 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-gray-700 text-sm font-semibold mb-4">📊 利润 vs 出单分析（散点图）</h3>
        <div className="relative h-56 border border-gray-100 rounded-lg bg-gray-50">
          {/* Y轴标签 - 利润 */}
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between py-2 text-xs text-gray-400">
            <span>¥20k</span>
            <span>¥15k</span>
            <span>¥10k</span>
            <span>¥5k</span>
            <span>¥0</span>
            <span>-¥1k</span>
          </div>
          
          {/* 散点图区域 */}
          <div className="absolute left-12 right-4 top-4 bottom-8">
            {/* 象限分隔线 */}
            <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-gray-300"></div>
            <div className="absolute left-0 right-0 top-2/3 border-t border-dashed border-gray-300"></div>
            
            {/* 象限标签 */}
            <div className="absolute top-1 right-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">高利润高出单 ✨</div>
            <div className="absolute top-1 left-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">高利润低出单 💎</div>
            <div className="absolute bottom-8 right-1 text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">低利润高出单 ⚠️</div>
            <div className="absolute bottom-8 left-1 text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded">需优化 🚨</div>
            
            {/* 散点 */}
            <svg className="w-full h-full" viewBox="0 0 300 180">
              <circle cx="260" cy="20" r="12" fill="#22c55e" opacity="0.8">
                <title>凡士林真润倍护霜40G | 269单 | ¥18,735</title>
              </circle>
              <circle cx="180" cy="65" r="9" fill="#3b82f6" opacity="0.8">
                <title>凡士林真润倍护霜40G(大) | 108单 | ¥1,969</title>
              </circle>
              <circle cx="120" cy="70" r="8" fill="#3b82f6" opacity="0.8">
                <title>Aiposhiy生姜洗发水 | 68单 | ¥1,395</title>
              </circle>
              <circle cx="30" cy="55" r="5" fill="#a855f7" opacity="0.8">
                <title>黄色牙刷 | 1单 | ¥23（潜力款）</title>
              </circle>
              <circle cx="45" cy="60" r="5" fill="#a855f7" opacity="0.8">
                <title>紫色牙膏+牙刷 | 3单 | ¥145（潜力款）</title>
              </circle>
              <circle cx="220" cy="160" r="6" fill="#ef4444" opacity="0.8">
                <title>Aiposhiy-ZSYG*3 | 4单 | -¥53（需下架）</title>
              </circle>
              <circle cx="50" cy="155" r="5" fill="#ef4444" opacity="0.8">
                <title>二氧化碳洗发水300G(小) | 3单 | -¥25（需下架）</title>
              </circle>
              <circle cx="40" cy="148" r="4" fill="#f97316" opacity="0.8">
                <title>红色牙线 | 2单 | -¥4（需优化）</title>
              </circle>
            </svg>
          </div>
          
          {/* X轴标签 */}
          <div className="absolute left-12 right-4 bottom-0 flex justify-between text-xs text-gray-400">
            <span>0单</span>
            <span>50单</span>
            <span>100单</span>
            <span>150单</span>
            <span>200单</span>
            <span>250单+</span>
          </div>
        </div>
        
        {/* 图例 */}
        <div className="flex gap-4 mt-3 text-xs justify-center">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span>明星款</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span>稳定款</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500"></span>潜力款</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500"></span>需优化</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span>需下架</span>
        </div>
      </div>
    </div>
  );
}

export default SkuCharts;
