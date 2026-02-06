import React, { useState } from "react";
import { SkuCostTable } from "./SkuCostTable";
import { ComboCostTable } from "./ComboCostTable";

export function ProductManagementModule() {
  const [subTab, setSubTab] = useState("single");

  return (
    <div className="space-y-5">
      {/* 子Tab切换 */}
      <div className="flex gap-2">
        {[
          { key: "single", label: "单品SKU", icon: "📦", desc: "管理单品采购成本" },
          { key: "combo", label: "组合SKU", icon: "🔗", desc: "管理组合拆解关系" },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setSubTab(item.key)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all
              ${subTab === item.key
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>
            <div className="text-left">
              <div>{item.label}</div>
              <div className={`text-xs ${subTab === item.key ? "text-orange-100" : "text-gray-400"}`}>
                {item.desc}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 内容 */}
      {subTab === "single" ? <SkuCostTable /> : <ComboCostTable />}
    </div>
  );
}
