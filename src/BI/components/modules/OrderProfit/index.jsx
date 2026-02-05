/**
 * 订单利润模块
 */
import React from 'react';
import { OrderStats } from './OrderStats';
import { OrderByShop } from './OrderByShop';
import { OrderTrend } from './OrderTrend';
import { LossOrders } from './LossOrders';
import { OrderTable } from './OrderTable';

export function OrderProfitModule() {
  return (
    <div className="space-y-6">
      {/* 订单汇总卡片 */}
      <OrderStats />

      {/* 店铺维度单笔订单分析 */}
      <OrderByShop />

      {/* 订单利润趋势折线图 */}
      <OrderTrend />

      {/* 订单利润占比 + 结构指数 */}
      <div className="grid grid-cols-3 gap-6">
        {/* 订单利润区间分布 */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-gray-700 text-sm font-semibold mb-4">📊 订单利润区间分布</h3>
          <div className="space-y-3">
            {[
              { range: '< ¥0（亏损）', count: 93, percent: 7.5, color: 'bg-red-500', textColor: 'text-red-600' },
              { range: '¥0 - ¥2', count: 156, percent: 12.5, color: 'bg-orange-400', textColor: 'text-orange-600' },
              { range: '¥2 - ¥4', count: 203, percent: 16.3, color: 'bg-yellow-400', textColor: 'text-yellow-600' },
              { range: '¥4 - ¥6', count: 287, percent: 23.1, color: 'bg-lime-400', textColor: 'text-lime-600' },
              { range: '¥6 - ¥8', count: 245, percent: 19.7, color: 'bg-green-400', textColor: 'text-green-600' },
              { range: '¥8 - ¥10', count: 134, percent: 10.8, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
              { range: '¥10 - ¥12', count: 78, percent: 6.3, color: 'bg-teal-500', textColor: 'text-teal-600' },
              { range: '≥ ¥12', count: 52, percent: 4.2, color: 'bg-blue-500', textColor: 'text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-28 text-xs text-gray-600 font-medium">{item.range}</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.max(item.percent * 3, 2)}%` }}
                  ></div>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                    {item.count}单
                  </span>
                </div>
                <div className={`w-14 text-right text-sm font-semibold ${item.textColor}`}>
                  {item.percent}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">总订单数</span>
            <span className="font-bold text-gray-800">1,248单</span>
          </div>
        </div>

        {/* 结构指数卡片 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-gray-700 text-sm font-semibold mb-4">📈 结构指数</h3>
          
          {/* 今日 vs 7天对比 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
            <div className="text-xs text-gray-500 mb-2">今日平均单笔利润</div>
            <div className="text-3xl font-bold text-blue-600">¥8.52</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">vs 7天均值 ¥7.23</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                ↑ 17.8%
              </span>
            </div>
          </div>

          {/* 其他指标 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">今日订单数</span>
              <span className="font-bold text-gray-800">186单</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">7天日均订单</span>
              <span className="font-bold text-gray-800">178单</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">今日总利润</span>
              <span className="font-bold text-green-600">¥1,584.72</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">7天日均利润</span>
              <span className="font-bold text-gray-800">¥1,286.94</span>
            </div>
          </div>

          {/* 健康度指示 */}
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✅</span>
              <span className="text-sm text-green-700 font-medium">利润结构健康</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">今日表现优于7天均值</div>
          </div>
        </div>
      </div>

      {/* 亏损订单 + 低利润订单 */}
      <LossOrders />

      {/* 筛选栏 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">店铺:</label>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
              <option>全部店铺</option>
              <option>B03</option>
              <option>15004</option>
              <option>15010</option>
              <option>15007</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">日期:</label>
            <input type="date" defaultValue="2024-01-14" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <span className="text-gray-400">-</span>
            <input type="date" defaultValue="2024-01-15" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">利润:</label>
            <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
              <option>全部</option>
              <option>盈利订单</option>
              <option>亏损订单</option>
            </select>
          </div>
          
          {/* 亏损订单快速筛选 */}
          <button className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-1">
            <span>🚨</span>
            <span>仅看亏损订单</span>
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">93</span>
          </button>
          
          <button className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            查询
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
            导出Excel
          </button>
        </div>
      </div>

      {/* 订单表格 */}
      <OrderTable />

      {/* 分页 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">共 8 条记录</div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">上一页</button>
          <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</span>
          <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50">下一页</button>
        </div>
      </div>
    </div>
  );
}

export default OrderProfitModule;
