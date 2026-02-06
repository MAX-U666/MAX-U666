import React, { useState, useEffect, useCallback } from "react";
import { SkuOverview } from "./SkuOverview";
import { SkuQuadrant } from "./SkuQuadrant";
import { SkuRanking } from "./SkuRanking";
import { SkuCharts } from "./SkuCharts";
import { SkuTable } from "./SkuTable";

export function SkuProfitModule() {
  const [dateRange, setDateRange] = useState("today");
  const [skuData, setSkuData] = useState([]);
  const [overview, setOverview] = useState(null);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profit/sku-list?range=${dateRange}`);
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
  }, [dateRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-5">
      {/* 日期筛选 + 操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          {[
            { key: "today", label: "今日" },
            { key: "yesterday", label: "昨日" },
            { key: "7d", label: "近7天" },
            { key: "30d", label: "近30天" }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setDateRange(item.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${dateRange === item.key 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }
              `}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-all disabled:opacity-50"
          >
            {loading ? "加载中..." : "刷新数据"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">
          ⚠️ 数据加载失败: {error}
        </div>
      )}

      {/* 概览卡片 */}
      <SkuOverview data={overview} loading={loading} />

      {/* 四象限 */}
      <SkuQuadrant data={skuData} />

      {/* 排行榜 */}
      <SkuRanking data={skuData} />

      {/* 图表 */}
      <SkuCharts data={skuData} />

      {/* SKU 明细表 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <SkuTable data={skuData} shops={shops} loading={loading} />
      </div>
    </div>
  );
}
