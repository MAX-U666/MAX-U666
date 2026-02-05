import React, { useState } from "react";
import { SkuOverview } from "./SkuOverview";
import { SkuQuadrant } from "./SkuQuadrant";
import { SkuRanking } from "./SkuRanking";
import { SkuTable } from "./SkuTable";

export function SkuProfitModule() {
  const [dateRange, setDateRange] = useState("today");

  return (
    <div className="space-y-5">
      {/* 日期筛选 + 操作按钮 - 统一风格 */}
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
          <button className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-all">
            导出报表
          </button>
          <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-all">
            刷新数据
          </button>
        </div>
      </div>

      {/* 概览卡片 */}
      <SkuOverview />

      {/* 四象限 */}
      <SkuQuadrant />

      {/* 排行榜 */}
      <SkuRanking />

      {/* SKU 明细表 */}
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <SkuTable />
      </div>
    </div>
  );
}
