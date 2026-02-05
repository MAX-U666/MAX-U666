/**
 * 店铺详情展开面板组件
 * D1: 店铺指标卡片 (12个)
 * D2: 利润排行 TOP10 + TOP5
 * D3: 订单利润区间分布 (每¥2一个区间)
 */
import React from 'react';
import { formatCNY } from '../../../utils/format';
import { RATE } from '../../../utils/constants';
import { shopData, b03SkuData } from '../../../data/mock';

// 订单利润区间数据 (每¥2一个区间，¥2-20)
const profitRangeData = {
  'B03': [
    { range: '¥2-4', count: 45, percent: 8.7 },
    { range: '¥4-6', count: 62, percent: 12.0 },
    { range: '¥6-8', count: 78, percent: 15.1 },
    { range: '¥8-10', count: 95, percent: 18.4 },
    { range: '¥10-12', count: 82, percent: 15.9 },
    { range: '¥12-14', count: 58, percent: 11.3 },
    { range: '¥14-16', count: 42, percent: 8.2 },
    { range: '¥16-18', count: 31, percent: 6.0 },
    { range: '¥18-20', count: 22, percent: 4.3 },
  ],
  '15004': [
    { range: '¥2-4', count: 35, percent: 12.1 },
    { range: '¥4-6', count: 48, percent: 16.6 },
    { range: '¥6-8', count: 52, percent: 18.0 },
    { range: '¥8-10', count: 45, percent: 15.6 },
    { range: '¥10-12', count: 38, percent: 13.1 },
    { range: '¥12-14', count: 28, percent: 9.7 },
    { range: '¥14-16', count: 22, percent: 7.6 },
    { range: '¥16-18', count: 12, percent: 4.2 },
    { range: '¥18-20', count: 9, percent: 3.1 },
  ],
  '15010': [
    { range: '¥2-4', count: 22, percent: 11.1 },
    { range: '¥4-6', count: 35, percent: 17.6 },
    { range: '¥6-8', count: 42, percent: 21.1 },
    { range: '¥8-10', count: 38, percent: 19.1 },
    { range: '¥10-12', count: 28, percent: 14.1 },
    { range: '¥12-14', count: 18, percent: 9.0 },
    { range: '¥14-16', count: 10, percent: 5.0 },
    { range: '¥16-18', count: 4, percent: 2.0 },
    { range: '¥18-20', count: 2, percent: 1.0 },
  ],
  '15007': [
    { range: '¥2-4', count: 18, percent: 11.5 },
    { range: '¥4-6', count: 25, percent: 16.0 },
    { range: '¥6-8', count: 32, percent: 20.5 },
    { range: '¥8-10', count: 28, percent: 17.9 },
    { range: '¥10-12', count: 22, percent: 14.1 },
    { range: '¥12-14', count: 15, percent: 9.6 },
    { range: '¥14-16', count: 10, percent: 6.4 },
    { range: '¥16-18', count: 4, percent: 2.6 },
    { range: '¥18-20', count: 2, percent: 1.3 },
  ],
  '15009': [
    { range: '¥2-4', count: 12, percent: 13.5 },
    { range: '¥4-6', count: 16, percent: 18.0 },
    { range: '¥6-8', count: 18, percent: 20.2 },
    { range: '¥8-10', count: 15, percent: 16.9 },
    { range: '¥10-12', count: 12, percent: 13.5 },
    { range: '¥12-14', count: 8, percent: 9.0 },
    { range: '¥14-16', count: 5, percent: 5.6 },
    { range: '¥16-18', count: 2, percent: 2.2 },
    { range: '¥18-20', count: 1, percent: 1.1 },
  ],
};

// 各店铺SKU数据
const shopSkuData = {
  'B03': b03SkuData,
  '15004': {
    top10: [
      { name: 'Aiposhiy生姜洗发水', orders: 68, profit: 1395.08, roi: 2.84, rate: 20.99 },
      { name: '紫色牙膏+牙刷', orders: 45, profit: 856.32, roi: 9.32, rate: 57.05 },
      { name: '美白牙膏套装', orders: 38, profit: 542.18, roi: 2.12, rate: 18.50 },
      { name: '护手霜礼盒', orders: 22, profit: 312.45, roi: 1.95, rate: 15.20 },
      { name: '洗发水小样套装', orders: 35, profit: 280.50, roi: 2.45, rate: 22.30 },
      { name: '牙刷3支装', orders: 28, profit: 215.60, roi: 3.12, rate: 28.40 },
      { name: '漱口水套装', orders: 18, profit: 156.80, roi: 2.68, rate: 19.80 },
      { name: '旅行洗漱包', orders: 15, profit: 125.40, roi: 2.35, rate: 17.60 },
      { name: '儿童牙膏', orders: 12, profit: 98.20, roi: 2.88, rate: 24.50 },
      { name: '护发素', orders: 8, profit: 65.30, roi: 2.15, rate: 16.80 },
    ],
    bottom5: [
      { name: 'Aiposhiy-ZSYG*3+139-ID911YS', orders: 4, profit: -53.03, roi: 1.45, rate: -34.43 },
      { name: '过期洗发水清仓', orders: 6, profit: -28.50, roi: 1.62, rate: -12.30 },
      { name: '试用装牙膏', orders: 8, profit: -15.20, roi: 1.85, rate: -8.50 },
      { name: '漱口水小样', orders: 5, profit: -8.60, roi: 1.92, rate: -5.20 },
      { name: '牙线盒', orders: 3, profit: 0, roi: 2.05, rate: 0 },
    ]
  },
  '15010': {
    top10: [
      { name: '凡士林真润倍护霜40G(大)', orders: 108, profit: 1969.17, roi: 3.41, rate: 31.11 },
      { name: '身体乳套装', orders: 45, profit: 680.50, roi: 3.85, rate: 35.20 },
      { name: '护手霜3支装', orders: 28, profit: 420.30, roi: 4.12, rate: 38.50 },
      { name: '润唇膏礼盒', orders: 18, profit: 285.60, roi: 3.95, rate: 32.80 },
      { name: '身体磨砂膏', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
    ],
    bottom5: [
      { name: '过季身体乳', orders: 5, profit: -18.50, roi: 1.75, rate: -8.20 },
      { name: '试用装护手霜', orders: 3, profit: -8.20, roi: 1.88, rate: -4.50 },
      { name: '小样套装', orders: 2, profit: -3.50, roi: 1.95, rate: -2.10 },
      { name: '润唇膏单支', orders: 4, profit: 0, roi: 2.02, rate: 0 },
      { name: '身体乳小样', orders: 2, profit: 2.50, roi: 2.15, rate: 3.20 },
    ]
  },
  '15007': {
    top10: [
      { name: '黄色牙刷', orders: 1, profit: 23.30, roi: 43.28, rate: 53.55 },
      { name: '电动牙刷头', orders: 45, profit: 580.20, roi: 5.25, rate: 42.30 },
      { name: '牙刷架套装', orders: 32, profit: 385.60, roi: 4.85, rate: 38.50 },
      { name: '儿童牙刷套装', orders: 28, profit: 320.40, roi: 4.52, rate: 35.80 },
      { name: '旅行牙刷盒', orders: 22, profit: 245.30, roi: 4.18, rate: 32.60 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
    ],
    bottom5: [
      { name: '牙刷单支清仓', orders: 8, profit: -12.50, roi: 1.68, rate: -6.80 },
      { name: '过期牙刷头', orders: 5, profit: -8.20, roi: 1.82, rate: -4.50 },
      { name: '牙刷试用装', orders: 3, profit: -3.80, roi: 1.92, rate: -2.20 },
      { name: '牙刷收纳盒', orders: 2, profit: 0, roi: 2.05, rate: 0 },
      { name: '便携牙刷', orders: 4, profit: 1.50, roi: 2.12, rate: 1.80 },
    ]
  },
  '15009': {
    top10: [
      { name: '洗护套装A', orders: 25, profit: 380.50, roi: 4.25, rate: 38.20 },
      { name: '洗护套装B', orders: 22, profit: 320.30, roi: 4.05, rate: 35.80 },
      { name: '沐浴露套装', orders: 18, profit: 265.40, roi: 3.85, rate: 32.50 },
      { name: '洗发护发套装', orders: 15, profit: 218.60, roi: 3.65, rate: 30.20 },
      { name: '旅行洗护包', orders: 9, profit: 125.80, roi: 3.45, rate: 28.50 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
      { name: '-', orders: 0, profit: 0, roi: 0, rate: 0 },
    ],
    bottom5: [
      { name: '清仓洗发水', orders: 6, profit: -15.20, roi: 1.72, rate: -7.50 },
      { name: '试用沐浴露', orders: 4, profit: -8.50, roi: 1.85, rate: -4.20 },
      { name: '小样护发素', orders: 3, profit: -4.20, roi: 1.92, rate: -2.50 },
      { name: '洗护小样', orders: 2, profit: 0, roi: 2.08, rate: 0 },
      { name: '沐浴露单瓶', orders: 3, profit: 2.80, roi: 2.18, rate: 2.50 },
    ]
  },
};

// 指标卡片组件
function MetricCard({ label, value, color = 'gray', highlight = false, status = null }) {
  const colorMap = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    cyan: 'text-cyan-600',
    pink: 'text-pink-600',
    purple: 'text-purple-600',
    gray: 'text-gray-800',
  };

  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold ${colorMap[color]}`}>{value}</div>
      {status && <div className="text-xs text-green-600 mt-1">✓ {status}</div>}
    </div>
  );
}

export function ShopDetail({ shopId, onClose }) {
  const shop = shopData.find(s => s.id === shopId);
  if (!shop) return null;

  const skuData = shopSkuData[shopId] || shopSkuData['B03'];
  const rangeData = profitRangeData[shopId] || profitRangeData['B03'];
  const maxPercent = Math.max(...rangeData.map(d => d.percent));

  return (
    <div className="bg-white border-t border-gray-200">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">📊 {shopId} 店铺利润分析</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕ 收起</button>
        </div>
      </div>

      <div className="p-6">
        {/* D1. 店铺指标卡片 - 第一行 */}
        <div className="grid grid-cols-6 gap-4 mb-4">
          <MetricCard label="汇率" value={`1IDR = ¥${RATE}`} />
          <MetricCard label="回款" value={formatCNY(shop.revenue)} color="blue" />
          <MetricCard label="成本" value={formatCNY(shop.cost)} color="blue" />
          <MetricCard label="仓储费" value={formatCNY(shop.warehouse)} color="cyan" />
          <MetricCard label="包材费" value={formatCNY(shop.packing)} color="pink" />
          <MetricCard label="广告费" value={formatCNY(shop.ad)} color="orange" />
        </div>

        {/* D1. 店铺指标卡片 - 第二行 */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          <MetricCard label="毛利润" value={formatCNY(shop.profit)} color="green" highlight />
          <MetricCard label="ROI" value={shop.roi.toFixed(2)} status="达标" color="green" />
          <MetricCard label="单笔利润" value={formatCNY(shop.profit / shop.orders)} status="达标" color="green" />
          <MetricCard label="客单价" value={formatCNY(shop.revenue / shop.orders)} />
          <MetricCard label="利润率" value={`${shop.rate.toFixed(1)}%`} color="green" />
          <MetricCard label="广告占比" value={`${((shop.ad / shop.revenue) * 100).toFixed(1)}%`} color="orange" />
        </div>

        {/* D2. 利润排行 TOP10 + TOP5 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 利润最高 TOP10 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-green-500">✨</span> 利润最高 SKU TOP10
            </h4>
            <table className="w-full text-xs">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">商品名称</th>
                  <th className="text-right py-2 font-medium">订单</th>
                  <th className="text-right py-2 font-medium">利润</th>
                  <th className="text-right py-2 font-medium">ROI</th>
                  <th className="text-right py-2 font-medium">利润率</th>
                </tr>
              </thead>
              <tbody>
                {skuData.top10.filter(s => s.name !== '-').map((sku, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-white' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="py-2 max-w-[150px] truncate text-gray-700" title={sku.name}>{sku.name}</td>
                    <td className="text-right text-gray-500">{sku.orders}</td>
                    <td className="text-right text-green-600 font-semibold">{formatCNY(sku.profit)}</td>
                    <td className="text-right">{sku.roi.toFixed(2)}</td>
                    <td className="text-right text-gray-500">{sku.rate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 利润最低 TOP5 */}
          <div className="bg-red-50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="text-red-500">⚠️</span> 利润最低 SKU TOP5（需关注）
            </h4>
            <table className="w-full text-xs">
              <thead className="text-gray-400">
                <tr>
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">商品名称</th>
                  <th className="text-right py-2 font-medium">订单</th>
                  <th className="text-right py-2 font-medium">利润</th>
                  <th className="text-right py-2 font-medium">ROI</th>
                  <th className="text-right py-2 font-medium">建议</th>
                </tr>
              </thead>
              <tbody>
                {skuData.bottom5.map((sku, i) => (
                  <tr key={i} className="border-b border-red-100">
                    <td className="py-2">
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    </td>
                    <td className="py-2 max-w-[150px] truncate text-gray-700" title={sku.name}>{sku.name}</td>
                    <td className="text-right text-gray-500">{sku.orders}</td>
                    <td className={`text-right font-semibold ${sku.profit < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {formatCNY(sku.profit)}
                    </td>
                    <td className={`text-right ${sku.roi < 2 ? 'text-red-600' : 'text-gray-600'}`}>
                      {sku.roi.toFixed(2)}
                    </td>
                    <td className="text-right">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        sku.profit < 0 ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
                      }`}>
                        {sku.profit < 0 ? '下架' : '优化'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* D3. 订单利润区间分布 */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span>📈</span> 订单利润区间分布（每¥2一个区间）
          </h4>
          <div className="grid grid-cols-9 gap-3">
            {rangeData.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="text-xs text-gray-500 mb-2">{item.range}</div>
                <div className="relative h-24 bg-gray-100 rounded-lg overflow-hidden flex items-end justify-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-500"
                    style={{ height: `${(item.percent / maxPercent) * 100}%` }}
                  />
                </div>
                <div className="text-xs font-medium text-gray-700 mt-2">{item.count}个</div>
                <div className="text-xs text-gray-400">{item.percent}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopDetail;
