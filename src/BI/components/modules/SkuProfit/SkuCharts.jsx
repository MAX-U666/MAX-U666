/**
 * SKU图表组件 - 双环图 + 散点图
 */
import React from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCNY } from '../../../utils/format';

const COLORS = ['#FF6B35', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#EF4444'];

export function SkuCharts({ data }) {
  const list = data || [];

  // 利润占比（取TOP8，其余合并）
  const sorted = [...list].filter(s => s.profit > 0).sort((a, b) => b.profit - a.profit);
  const top8 = sorted.slice(0, 8);
  const otherProfit = sorted.slice(8).reduce((s, d) => s + d.profit, 0);
  
  const pieData = [
    ...top8.map(s => ({ name: s.name || s.sku, value: Math.round(s.profit * 100) / 100 })),
    ...(otherProfit > 0 ? [{ name: '其他', value: Math.round(otherProfit * 100) / 100 }] : [])
  ];

  // 成本结构
  const totalCost = list.reduce((s, d) => s + d.cost, 0);
  const totalPacking = list.reduce((s, d) => s + d.packing, 0);
  const totalAd = list.reduce((s, d) => s + d.ad, 0);
  const costPie = [
    { name: '商品成本', value: Math.round(totalCost * 100) / 100 },
    { name: '包材费', value: Math.round(totalPacking * 100) / 100 },
    { name: '广告费', value: Math.round(totalAd * 100) / 100 },
  ].filter(d => d.value > 0);

  const COST_COLORS = ['#F59E0B', '#EC4899', '#EF4444'];

  // 散点图：ROI vs 利润
  const scatterData = list
    .filter(s => s.ad > 0 && s.roi < 100)
    .map(s => ({
      x: Math.round(s.roi * 100) / 100,
      y: Math.round(s.profit * 100) / 100,
      name: s.name || s.sku,
      orders: s.orders
    }));

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* 利润占比 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🍩 利润占比 TOP8</h3>
        {pieData.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">暂无盈利SKU</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={false}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatCNY(value)} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="mt-2 space-y-1">
          {pieData.slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-gray-600 truncate flex-1">{item.name}</span>
              <span className="font-medium text-gray-700">{formatCNY(item.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 成本结构 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🧮 成本结构</h3>
        {costPie.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">暂无数据</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={costPie} cx="50%" cy="50%" outerRadius={80} innerRadius={40} dataKey="value" label={false}>
                {costPie.map((_, i) => <Cell key={i} fill={COST_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(value) => formatCNY(value)} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="mt-2 space-y-1">
          {costPie.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full" style={{ background: COST_COLORS[i] }} />
              <span className="text-gray-600 flex-1">{item.name}</span>
              <span className="font-medium text-gray-700">{formatCNY(item.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 散点图 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 ROI vs 利润</h3>
        {scatterData.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-12">暂无广告数据</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" dataKey="x" name="ROI" tick={{ fontSize: 11 }} />
              <YAxis type="number" dataKey="y" name="利润" tick={{ fontSize: 11 }} />
              <Tooltip 
                formatter={(value, name) => [name === 'ROI' ? value.toFixed(2) : formatCNY(value), name === 'x' ? 'ROI' : '利润']}
                labelFormatter={() => ''}
                content={({ payload }) => {
                  if (!payload?.[0]) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white border rounded-lg p-2 shadow text-xs">
                      <div className="font-medium">{d.name}</div>
                      <div>ROI: {d.x.toFixed(2)}</div>
                      <div>利润: {formatCNY(d.y)}</div>
                      <div>订单: {d.orders}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={scatterData} fill="#FF6B35" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
