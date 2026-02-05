/**
 * 关联分析组件
 * 设计：3个指标卡片（相关性系数/最优广告占比/当前广告占比）+ 散点图 + 成本-利润/SKU-店铺占位图
 */
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Legend, BarChart, Bar } from 'recharts';

// 指标卡片数据
const metricCards = [
  { 
    title: '广告-利润相关性', 
    value: '0.78', 
    desc: '强正相关',
    icon: '🔗',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  },
  { 
    title: '最优广告占比', 
    value: '35%', 
    desc: '建议范围: 30-40%',
    icon: '🎯',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  { 
    title: '当前广告占比', 
    value: '42%', 
    desc: '略高于建议值',
    icon: '📊',
    color: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700'
  },
];

// 散点图数据 - 广告花费 vs 利润
const scatterData = [
  { adSpend: 1200, profit: 3500, sku: 'SKU-001', size: 100 },
  { adSpend: 2500, profit: 6800, sku: 'SKU-002', size: 150 },
  { adSpend: 800, profit: 2100, sku: 'SKU-003', size: 80 },
  { adSpend: 3200, profit: 8500, sku: 'SKU-004', size: 200 },
  { adSpend: 1800, profit: 4200, sku: 'SKU-005', size: 120 },
  { adSpend: 4500, profit: 11200, sku: 'SKU-006', size: 250 },
  { adSpend: 2100, profit: 5600, sku: 'SKU-007', size: 140 },
  { adSpend: 900, profit: 1800, sku: 'SKU-008', size: 60 },
  { adSpend: 3800, profit: 9200, sku: 'SKU-009', size: 180 },
  { adSpend: 1500, profit: 3800, sku: 'SKU-010', size: 110 },
  { adSpend: 2800, profit: 7200, sku: 'SKU-011', size: 160 },
  { adSpend: 600, profit: 1500, sku: 'SKU-012', size: 50 },
];

// 成本-利润对比数据
const costProfitData = [
  { name: 'SKU-001', cost: 2500, profit: 3500 },
  { name: 'SKU-002', cost: 3200, profit: 6800 },
  { name: 'SKU-003', cost: 1800, profit: 2100 },
  { name: 'SKU-004', cost: 4100, profit: 8500 },
  { name: 'SKU-005', cost: 2800, profit: 4200 },
];

// 店铺SKU分布数据
const shopSkuData = [
  { shop: '店铺A', profitable: 12, loss: 3 },
  { shop: '店铺B', profitable: 8, loss: 5 },
  { shop: '店铺C', profitable: 15, loss: 2 },
  { shop: '店铺D', profitable: 6, loss: 4 },
];

export function RelationAnalysis() {
  return (
    <div className="space-y-6">
      {/* 3个指标卡片 */}
      <div className="grid grid-cols-3 gap-4">
        {metricCards.map((card, index) => (
          <div 
            key={index}
            className={`${card.bgColor} rounded-xl p-5 border border-gray-200`}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-sm font-medium text-gray-600">{card.title}</span>
            </div>
            <div className={`text-3xl font-bold ${card.textColor} mb-1`}>{card.value}</div>
            <div className="text-sm text-gray-500">{card.desc}</div>
          </div>
        ))}
      </div>

      {/* 广告花费-利润散点图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📈</span>
          广告花费 vs 利润关联分析
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey="adSpend" 
                name="广告花费" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `¥${value}`}
                label={{ value: '广告花费 (¥)', position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="profit" 
                name="利润" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `¥${value}`}
                label={{ value: '利润 (¥)', angle: -90, position: 'insideLeft' }}
              />
              <ZAxis type="number" dataKey="size" range={[50, 300]} />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <div className="font-medium text-gray-800 mb-2">{data.sku}</div>
                        <div className="text-sm text-gray-600">广告花费: ¥{data.adSpend}</div>
                        <div className="text-sm text-gray-600">利润: ¥{data.profit}</div>
                        <div className="text-sm text-gray-600">ROI: {(data.profit / data.adSpend).toFixed(2)}</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                name="SKU" 
                data={scatterData} 
                fill="url(#scatterGradient)"
              />
              <defs>
                <linearGradient id="scatterGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 成本-利润 + SKU-店铺分布 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 成本-利润对比 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>💰</span>
            TOP5 SKU成本-利润对比
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costProfitData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `¥${(value/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => `¥${value.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="cost" name="成本" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="利润" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 店铺SKU分布 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🏪</span>
            店铺SKU盈亏分布
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shopSkuData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="shop" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="profitable" name="盈利SKU" fill="#10B981" stackId="stack" radius={[4, 4, 0, 0]} />
                <Bar dataKey="loss" name="亏损SKU" fill="#EF4444" stackId="stack" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RelationAnalysis;
