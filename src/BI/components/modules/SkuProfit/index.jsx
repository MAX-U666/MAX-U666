import React, { useState, useEffect, useCallback } from "react";
import { SkuOverview } from "./SkuOverview";
import { SkuQuadrant } from "./SkuQuadrant";
import { SkuRanking } from "./SkuRanking";
import { SkuCharts } from "./SkuCharts";
import { SkuTable } from "./SkuTable";
import { LinkTable } from "./LinkTable";
import { authFetch } from '../../../utils/helpers';

export function SkuProfitModule() {
  const [dateRange, setDateRange] = useState("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [skuData, setSkuData] = useState([]);
  const [overview, setOverview] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        url = `/api/profit/sku-list?startDate=${customStart}&endDate=${customEnd}`;
      } else {
        url = `/api/profit/sku-list?range=${dateRange}`;
      }
      const res = await authFetch(url);
      const json = await res.json();
      if (json.success) {
        setSkuData(json.data || []);
        setOverview(json.overview || null);
        setShops(json.shops || []);
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
    setDateRange("custom");
    fetchData(true);
  };

  return (
    <div className="space-y-5">
      {/* 日期筛选 */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "today", label: "今日" },
            { key: "yesterday", label: "昨日" },
            { key: "7d", label: "近7天" },
            { key: "30d", label: "近30天" }
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
        <button onClick={() => fetchData(dateRange === 'custom')} disabled={loading}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-all disabled:opacity-50">
          {loading ? "加载中..." : "刷新数据"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          ⚠️ 数据加载失败: {error}
        </div>
      )}

      <SkuOverview data={overview} loading={loading} />
      <SkuQuadrant data={skuData} />
      <SkuRanking data={skuData} />
      <SkuCharts data={skuData} />

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <SkuTable data={skuData} shops={shops} loading={loading} />
      </div>

      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <LinkTable />
      </div>
    </div>
  );
}
