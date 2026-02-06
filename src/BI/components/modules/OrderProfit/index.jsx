/**
 * 订单利润模块
 */
import React, { useState, useEffect, useCallback } from 'react';
import { OrderStats } from './OrderStats';
import { OrderByShop } from './OrderByShop';
import { OrderTrend } from './OrderTrend';
import { LossOrders } from './LossOrders';
import { OrderTable } from './OrderTable';

export function OrderProfitModule() {
  const [dateRange, setDateRange] = useState('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const now = new Date(Date.now() + 7 * 3600000);
    setCustomStart(now.toISOString().split('T')[0]);
    setCustomEnd(now.toISOString().split('T')[0]);
  }, []);

  const fetchData = useCallback(async (useCustom = false) => {
    setLoading(true);
    setError(null);
    try {
      let url;
      if (useCustom && customStart && customEnd) {
        url = `/api/profit/order-list?startDate=${customStart}&endDate=${customEnd}`;
      } else {
        url = `/api/profit/order-list?range=${dateRange}`;
      }
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(json.error);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }, [dateRange, customStart, customEnd]);

  useEffect(() => { fetchData(); }, [dateRange]);

  const handleCustomQuery = () => {
    setDateRange('custom');
    fetchData(true);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let url;
      if (dateRange === 'custom' && customStart && customEnd) {
        url = `/api/profit/order-download?startDate=${customStart}&endDate=${customEnd}`;
      } else {
        url = `/api/profit/order-download?range=${dateRange}`;
      }
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `订单明细_${customStart || dateRange}_${customEnd || ''}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert('下载失败: ' + err.message);
    }
    setDownloading(false);
  };

  const overview = data?.overview || {};
  const orders = data?.data || [];
  const shopStats = data?.shopStats || [];
  const lossTop = data?.lossTop || [];
  const lowProfitTop = data?.lowProfitTop || [];
  const distribution = data?.distribution || [];
  const shops = data?.shops || [];

  return (
    <div className="space-y-6">
      {/* 日期筛选 */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'today', label: '今日' },
            { key: 'yesterday', label: '昨日' },
            { key: '7d', label: '近7天' },
            { key: '30d', label: '近30天' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setDateRange(item.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dateRange === item.key
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >{item.label}</button>
          ))}
          <span className="text-gray-300 mx-1">|</span>
          <span className="text-sm text-gray-500">📅</span>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
          <span className="text-gray-400 text-sm">至</span>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white" />
          <button onClick={handleCustomQuery}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              dateRange === 'custom'
                ? 'bg-orange-500 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>查询</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownload} disabled={downloading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
            {downloading ? '下载中...' : '📥 下载明细'}
          </button>
          <button onClick={() => fetchData(dateRange === 'custom')} disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50">
            {loading ? '加载中...' : '刷新数据'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          ⚠️ {error}
        </div>
      )}

      <OrderStats data={overview} loading={loading} />
      <OrderByShop data={shopStats} loading={loading} />
      <OrderTrend data={orders} />

      {/* 利润区间 + 关键指标 */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-gray-700 text-sm font-semibold mb-4">📊 订单利润区间分布</h3>
          <div className="space-y-3">
            {distribution.map((item, i) => {
              const maxCount = Math.max(...distribution.map(d => d.count), 1);
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-28 text-xs text-gray-600 font-medium">{item.label}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      i === 0 ? 'bg-red-500' : i < 3 ? 'bg-yellow-400' : 'bg-green-500'
                    }`} style={{ width: `${Math.max((item.count / maxCount) * 100, 2)}%` }} />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">{item.count}单</span>
                  </div>
                  <div className={`w-14 text-right text-sm font-semibold ${i === 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {orders.length > 0 ? ((item.count / orders.length) * 100).toFixed(1) : 0}%
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-sm">
            <span className="text-gray-500">总订单数</span>
            <span className="font-bold text-gray-800">{orders.length.toLocaleString()}单</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-gray-700 text-sm font-semibold mb-4">📌 关键指标</h3>
          <div className="space-y-4">
            {[
              { label: '亏损订单占比', value: overview.finishedOrders > 0 ? `${((overview.lossOrders / overview.finishedOrders) * 100).toFixed(1)}%` : '0%', color: 'text-red-600' },
              { label: '平均单笔利润', value: `¥${(overview.avgProfit || 0).toFixed(2)}`, color: overview.avgProfit >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: '总利润(已完成)', value: `¥${(overview.totalProfit || 0).toFixed(2)}`, color: overview.totalProfit >= 0 ? 'text-green-600' : 'text-red-600' },
              { label: '总回款(已完成)', value: `¥${(overview.totalRevenue || 0).toFixed(2)}`, color: 'text-blue-600' },
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className={`text-lg font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LossOrders lossTop={lossTop} lowProfitTop={lowProfitTop} />

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <OrderTable data={orders} shops={shops} loading={loading} />
      </div>
    </div>
  );
}
