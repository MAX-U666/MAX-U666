/**
 * SKU利润表格组件 - 带筛选栏
 */
import React, { Fragment, useState, useMemo } from 'react';
import { formatCNY } from '../../../utils/format';
import { getSkuQuadrant } from '../../../utils/helpers';
import { skuData } from '../../../data/mock';

// 店铺列表
const shopList = ['全部', 'B03', '15004', '15007', '15010'];

// 状态列表
const statusList = [
  { key: 'all', label: '全部' },
  { key: 'profit', label: '盈利' },
  { key: 'loss', label: '亏损' },
];

export function SkuTable({ quadrantFilter }) {
  const [expandedSku, setExpandedSku] = useState(null);
  const [selectedShop, setSelectedShop] = useState('全部');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  // 筛选数据
  const filteredData = useMemo(() => {
    let result = [...skuData];
    
    // 店铺筛选
    if (selectedShop !== '全部') {
      result = result.filter(s => s.store === selectedShop);
    }
    
    // 状态筛选
    if (selectedStatus === 'profit') {
      result = result.filter(s => s.profit > 0);
    } else if (selectedStatus === 'loss') {
      result = result.filter(s => s.profit <= 0);
    }
    
    // 搜索筛选
    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(keyword) || 
        s.sku.toLowerCase().includes(keyword)
      );
    }
    
    // 象限筛选
    if (quadrantFilter) {
      result = result.filter(s => getSkuQuadrant(s) === quadrantFilter);
    }
    
    return result;
  }, [selectedShop, selectedStatus, searchText, quadrantFilter]);

  // 计算合计
  const totals = useMemo(() => ({
    orders: filteredData.reduce((s, d) => s + d.orders, 0),
    revenue: filteredData.reduce((s, d) => s + d.revenue, 0),
    totalCost: filteredData.reduce((s, d) => s + d.cost + d.warehouse + d.packing, 0),
    ad: filteredData.reduce((s, d) => s + d.ad, 0),
    profit: filteredData.reduce((s, d) => s + d.profit, 0),
  }), [filteredData]);

  // 导出Excel
  const handleExport = () => {
    // 构建CSV内容
    const headers = ['SKU编码', '商品名称', '店铺', '订单数', '回款(CNY)', '总成本', '广告费', '净利润', 'ROI', '利润率'];
    const rows = filteredData.map(sku => [
      sku.sku,
      sku.name,
      sku.store,
      sku.orders,
      sku.revenue.toFixed(2),
      (sku.cost + sku.warehouse + sku.packing).toFixed(2),
      sku.ad.toFixed(2),
      sku.profit.toFixed(2),
      sku.roi.toFixed(2),
      sku.rate.toFixed(1) + '%'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SKU利润数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* 筛选栏 */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-4">
          {/* 店铺筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">店铺:</span>
            <select
              value={selectedShop}
              onChange={(e) => setSelectedShop(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {shopList.map(shop => (
                <option key={shop} value={shop}>{shop}</option>
              ))}
            </select>
          </div>
          
          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">状态:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {statusList.map(status => (
                <option key={status.key} value={status.key}>{status.label}</option>
              ))}
            </select>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索SKU名称或编码..."
              className="pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* 查询和导出按钮 */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {}}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
          >
            查询
          </button>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all"
          >
            导出Excel
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">SKU编码</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">商品名称</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">店铺</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">订单数</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">回款(CNY)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">总成本</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">广告费</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">净利润</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">ROI</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">利润率</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                  暂无匹配的SKU数据
                </td>
              </tr>
            ) : (
              filteredData.map((sku) => (
                <Fragment key={sku.sku}>
                  <tr 
                    onClick={() => setExpandedSku(expandedSku === sku.sku ? null : sku.sku)}
                    className={`border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition ${
                      expandedSku === sku.sku ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-gray-400 transform transition-transform text-xs ${expandedSku === sku.sku ? 'rotate-90' : ''}`}>▶</span>
                        <span className="font-mono text-xs text-gray-600">{sku.sku}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[180px] truncate text-gray-800 font-medium" title={sku.name}>{sku.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">{sku.store}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{sku.orders}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCNY(sku.revenue)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCNY(sku.cost + sku.warehouse + sku.packing)}</td>
                    <td className="px-4 py-3 text-right text-orange-600">{formatCNY(sku.ad)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold ${sku.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sku.profit >= 0 ? '+' : ''}{formatCNY(sku.profit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sku.roi >= 4 ? 'bg-green-100 text-green-700' :
                        sku.roi >= 2 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {sku.roi.toFixed(2)} {sku.roi >= 4 ? '✓' : '!'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-medium ${
                        sku.rate > 30 ? 'text-green-600' :
                        sku.rate > 0 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {sku.rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                  
                  {/* 展开的SKU详情面板 */}
                  {expandedSku === sku.sku && (
                    <tr>
                      <td colSpan="10" className="bg-gray-50 p-4">
                        <div className="grid grid-cols-3 gap-6">
                          {/* 成本明细 */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">💰 成本明细</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">平台回款</span>
                                <span className="text-sm font-medium text-blue-600">{formatCNY(sku.revenue)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">商品成本</span>
                                <span className="text-sm font-medium text-orange-500">-{formatCNY(sku.cost)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">仓储费</span>
                                <span className="text-sm font-medium text-cyan-600">-{formatCNY(sku.warehouse)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">包材费</span>
                                <span className="text-sm font-medium text-pink-500">-{formatCNY(sku.packing)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">广告费</span>
                                <span className="text-sm font-medium text-red-500">-{formatCNY(sku.ad)}</span>
                              </div>
                              <div className="flex justify-between items-center py-2 mt-2 bg-gray-50 rounded px-2">
                                <span className="text-sm font-semibold text-gray-700">净利润</span>
                                <span className={`text-base font-bold ${sku.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {sku.profit >= 0 ? '+' : ''}{formatCNY(sku.profit)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 效率指标 */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">📊 效率指标</h4>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">单品利润</div>
                                <div className={`text-xl font-bold ${sku.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCNY(sku.profit / sku.orders)}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">客单价</div>
                                <div className="text-xl font-bold text-blue-600">
                                  {formatCNY(sku.revenue / sku.orders)}
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">成本占比</div>
                                <div className="text-xl font-bold text-orange-600">
                                  {((sku.cost + sku.warehouse + sku.packing) / sku.revenue * 100).toFixed(1)}%
                                </div>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-3">
                                <div className="text-xs text-gray-500 mb-1">广告占比</div>
                                <div className="text-xl font-bold text-red-500">
                                  {(sku.ad / sku.revenue * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AI建议 */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">🤖 AI 诊断</h4>
                            <div className="space-y-3">
                              {sku.profit < 0 ? (
                                <Fragment>
                                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="text-red-600 font-medium text-sm">⚠️ 亏损预警</div>
                                    <div className="text-xs text-gray-600 mt-1">此SKU净利润为负，建议立即评估是否下架</div>
                                  </div>
                                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="text-orange-600 font-medium text-sm">💡 优化建议</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                      广告费占比 {(sku.ad / sku.revenue * 100).toFixed(1)}% 过高，建议降低广告投放
                                    </div>
                                  </div>
                                </Fragment>
                              ) : sku.roi < 4 ? (
                                <Fragment>
                                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="text-yellow-600 font-medium text-sm">⚡ ROI未达标</div>
                                    <div className="text-xs text-gray-600 mt-1">当前ROI={sku.roi.toFixed(2)}，低于目标值4，需优化</div>
                                  </div>
                                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-blue-600 font-medium text-sm">📈 提升空间</div>
                                    <div className="text-xs text-gray-600 mt-1">建议优化广告投放策略，提升转化率</div>
                                  </div>
                                </Fragment>
                              ) : (
                                <Fragment>
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="text-green-600 font-medium text-sm">✅ 表现优秀</div>
                                    <div className="text-xs text-gray-600 mt-1">ROI={sku.roi.toFixed(2)} 达标，利润率 {sku.rate.toFixed(1)}% 健康</div>
                                  </div>
                                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="text-blue-600 font-medium text-sm">🚀 增长建议</div>
                                    <div className="text-xs text-gray-600 mt-1">可适当加大广告投放，扩大销量</div>
                                  </div>
                                </Fragment>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr className="font-semibold">
              <td className="px-4 py-4" colSpan="3">合计 ({filteredData.length} 个SKU)</td>
              <td className="px-4 py-4 text-right">{totals.orders}</td>
              <td className="px-4 py-4 text-right">{formatCNY(totals.revenue)}</td>
              <td className="px-4 py-4 text-right text-blue-600">{formatCNY(totals.totalCost)}</td>
              <td className="px-4 py-4 text-right text-orange-600">{formatCNY(totals.ad)}</td>
              <td className="px-4 py-4 text-right text-green-600">{formatCNY(totals.profit)}</td>
              <td className="px-4 py-4 text-right">-</td>
              <td className="px-4 py-4 text-right">-</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default SkuTable;
