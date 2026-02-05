import React, { useState } from "react";
import { formatCNY } from "../../../utils/format";

const correlationData = [
  { x: "广告花费", y: "订单量", correlation: 0.85, insight: "强正相关" },
  { x: "客单价", y: "利润率", correlation: 0.72, insight: "正相关" },
  { x: "退货率", y: "利润", correlation: -0.68, insight: "负相关" },
  { x: "库存周转", y: "现金流", correlation: 0.61, insight: "正相关" },
  { x: "促销力度", y: "毛利", correlation: -0.45, insight: "弱负相关" }
];

const scatterData = [
  { shop: "B01", adSpend: 15000, orders: 420, profit: 28000 },
  { shop: "B02", adSpend: 22000, orders: 580, profit: 35000 },
  { shop: "B03", adSpend: 8000, orders: 180, profit: 12000 },
  { shop: "B04", adSpend: 18000, orders: 520, profit: 32000 },
  { shop: "B05", adSpend: 12000, orders: 350, profit: 22000 }
];

export function RelationAnalysis() {
  const [selectedPair, setSelectedPair] = useState(correlationData[0]);

  const getCorrelationColor = (value) => {
    if (value > 0.6) return "text-green-600";
    if (value > 0.3) return "text-blue-600";
    if (value > 0) return "text-gray-600";
    if (value > -0.3) return "text-orange-600";
    return "text-red-600";
  };

  const getCorrelationBg = (value) => {
    if (value > 0.6) return "bg-green-500";
    if (value > 0.3) return "bg-blue-500";
    if (value > 0) return "bg-gray-400";
    if (value > -0.3) return "bg-orange-500";
    return "bg-red-500";
  };

  const maxAdSpend = Math.max(...scatterData.map(d => d.adSpend));
  const maxOrders = Math.max(...scatterData.map(d => d.orders));

  return (
    <div className="space-y-5">
      {/* 相关性矩阵 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-gray-800 font-semibold mb-4">指标相关性分析</h3>
        <div className="space-y-3">
          {correlationData.map((item, idx) => {
            const colorClass = getCorrelationColor(item.correlation);
            const bgClass = getCorrelationBg(item.correlation);
            const width = Math.abs(item.correlation) * 100;
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                  selectedPair === item ? "bg-orange-50 border-orange-200" : "hover:bg-gray-50 border-gray-100"
                }`}
                onClick={() => setSelectedPair(item)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 text-sm">
                    {item.x} × {item.y}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${colorClass}`}>
                      {item.insight}
                    </span>
                    <span className={`font-mono font-semibold ${colorClass}`}>
                      {item.correlation > 0 ? "+" : ""}{item.correlation.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${bgClass}`}
                    style={{
                      width: `${width}%`,
                      marginLeft: item.correlation < 0 ? `${100 - width}%` : 0
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 散点图模拟 */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h3 className="text-gray-800 font-semibold mb-4">广告花费 vs 订单量（按店铺）</h3>
        <div className="relative h-64 border-l border-b border-gray-200 ml-12 mb-6">
          {/* Y轴标签 */}
          <div className="absolute -left-12 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
            <span>{maxOrders}</span>
            <span>{Math.round(maxOrders / 2)}</span>
            <span>0</span>
          </div>
          {/* X轴标签 */}
          <div className="absolute bottom-[-24px] left-0 w-full flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>{formatCNY(maxAdSpend / 2)}</span>
            <span>{formatCNY(maxAdSpend)}</span>
          </div>
          {/* 散点 */}
          {scatterData.map((point, idx) => {
            const x = (point.adSpend / maxAdSpend) * 100;
            const y = (point.orders / maxOrders) * 100;
            return (
              <div
                key={idx}
                className="absolute w-4 h-4 rounded-full bg-orange-500 hover:scale-150 transition-transform cursor-pointer group"
                style={{
                  left: `${x}%`,
                  bottom: `${y}%`,
                  transform: "translate(-50%, 50%)"
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <div className="font-medium">{point.shop}</div>
                  <div>广告: {formatCNY(point.adSpend)}</div>
                  <div>订单: {point.orders}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 洞察卡片 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">关键发现</div>
          <p className="text-gray-800 text-sm">
            广告花费与订单量呈强正相关（r=0.85），每增加1000元广告投入，预计可带来约28单增量。
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <div className="text-sm text-gray-500 mb-2">优化建议</div>
          <p className="text-gray-800 text-sm">
            B03店铺广告投入产出比最优，建议参考其投放策略。B02可适当降低广告预算以提升ROI。
          </p>
        </div>
      </div>
    </div>
  );
}
