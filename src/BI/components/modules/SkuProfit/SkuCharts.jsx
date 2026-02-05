/**
 * SKU图表组件 - 双环图 + 散点图
 */
import React from 'react';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Label } from 'recharts';

// 双环图数据 - 出单占比 & 利润占比
const donutData = [
  { name: '凡士林真润倍护霜40G', orders: 269, orderPercent: 50, profit: 18735.74, profitPercent: 45, color: '#3B82F6' },
  { name: 'Aiposhiy生姜洗发水', orders: 68, orderPercent: 18, profit: 1395.08, profitPercent: 20, color: '#22C55E' },
  { name: '凡士林真润倍护霜40G(大)', orders: 108, orderPercent: 12, profit: 1969.17, profitPercent: 15, color: '#F59E0B' },
  { name: 'Aiposhiy白提味牙膏', orders: 14, orderPercent: 5, profit: 319.93, profitPercent: 10, color: '#8B5CF6' },
  { name: '其他SKU', orders: 80, orderPercent: 15, profit: 516.08, profitPercent: 10, color: '#94A3B8' },
];

const totalProfit = donutData.reduce((sum, item) => sum + item.profit, 0);

// 散点图数据 - 利润 vs 出单
const scatterData = [
  { name: '凡士林真润倍护霜40G', orders: 269, profit: 18735.74, category: 'star', color: '#22C55E' },
  { name: 'Aiposhiy生姜洗发水', orders: 68, profit: 1395.08, category: 'stable', color: '#3B82F6' },
  { name: '凡士林真润倍护霜40G(大)', orders: 108, profit: 1969.17, category: 'stable', color: '#3B82F6' },
  { name: '二氧化碳洗发水300G', orders: 21, profit: 427.06, category: 'potential', color: '#8B5CF6' },
  { name: '紫色牙膏+牙刷', orders: 3, profit: 144.50, category: 'potential', color: '#8B5CF6' },
  { name: '黄色牙刷', orders: 1, profit: 23.30, category: 'potential', color: '#8B5CF6' },
  { name: '红色牙线', orders: 2, profit: -4.16, category: 'optimize', color: '#F59E0B' },
  { name: '蓝色漱口水', orders: 5, profit: -120, category: 'remove', color: '#EF4444' },
  { name: '白色牙膏', orders: 15, profit: -80, category: 'optimize', color: '#F59E0B' },
  { name: '洗发水小样', orders: 180, profit: 12500, category: 'star', color: '#22C55E' },
];

// 分类图例
const categoryLegend = [
  { name: '明星款', color: '#22C55E', desc: '高利润高出单' },
  { name: '稳定款', color: '#3B82F6', desc: '中等表现' },
  { name: '潜力款', color: '#8B5CF6', desc: '低出单有利润' },
  { name: '需优化', color: '#F59E0B', desc: '有出单但亏损' },
  { name: '需下架', color: '#EF4444', desc: '低利润低出单' },
];

export function SkuCharts() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 双环图 - SKU出单占比 & 利润占比 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>🍩</span> SKU出单占比 & 利润占比（双环图）
        </div>
        <div className="flex items-center">
          {/* 双环图 */}
          <div className="w-52 h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* 内环 - 出单占比 */}
                <Pie
                  data={donutData}
                  dataKey="orderPercent"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`inner-${index}`} fill={entry.color} opacity={0.7} />
                  ))}
                </Pie>
                {/* 外环 - 利润占比 */}
                <Pie
                  data={donutData}
                  dataKey="profitPercent"
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`outer-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => {
                    const data = props.payload;
                    return [`${value}%`, name === 'orderPercent' ? '出单占比' : '利润占比'];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* 中心文字 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xs text-gray-500">总利润</div>
              <div className="text-lg font-bold text-gray-800">¥{(totalProfit/1000).toFixed(1)}k</div>
            </div>
          </div>
          
          {/* 图例 */}
          <div className="flex-1 ml-4 space-y-2">
            {donutData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="flex-1">
                  <div className="text-sm text-gray-800 font-medium truncate max-w-[160px]">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    {item.orders}单 ({item.orderPercent}%) | ¥{item.profit.toLocaleString()} ({item.profitPercent}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* 底部图例说明 */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300 opacity-70" />
            <span>内环:出单</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>外环:利润</span>
          </div>
        </div>
      </div>

      {/* 散点图 - 利润 vs 出单分析 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span>📈</span> 利润 vs 出单分析（散点图）
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number" 
                dataKey="orders" 
                name="出单数"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `${v}单`}
              />
              <YAxis 
                type="number" 
                dataKey="profit" 
                name="利润"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => `¥${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`}
              />
              <ZAxis range={[60, 200]} />
              
              {/* 参考线 - 利润=0 */}
              <ReferenceLine y={0} stroke="#EF4444" strokeDasharray="3 3">
                <Label value="盈亏线" position="right" fontSize={10} fill="#EF4444" />
              </ReferenceLine>
              
              {/* 象限标签 */}
              <ReferenceLine x={100} stroke="#E5E7EB" strokeDasharray="2 2" />
              
              <Tooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ payload }) => {
                  if (payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 rounded shadow-lg border border-gray-200 text-xs">
                        <div className="font-medium text-gray-800 mb-1">{data.name}</div>
                        <div className="text-gray-600">出单: {data.orders}单</div>
                        <div className={`${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          利润: ¥{data.profit.toLocaleString()}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Scatter 
                data={scatterData} 
                shape={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={8} 
                      fill={payload.color}
                      opacity={0.8}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* 象限说明文字 */}
        <div className="absolute top-12 left-8 text-[10px] text-green-600 font-medium opacity-60">高利润低出单 💎</div>
        <div className="absolute top-12 right-8 text-[10px] text-green-600 font-medium opacity-60">高利润高出单 ✨</div>
        <div className="absolute bottom-20 right-8 text-[10px] text-orange-500 font-medium opacity-60">低利润高出单 ⚠️</div>
        
        {/* 分类图例 */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-center flex-wrap gap-4">
          {categoryLegend.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1 text-xs">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SkuCharts;
