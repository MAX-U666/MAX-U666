/**
 * 店铺利润模块
 */
import React, { useState } from 'react';
import { ShopSummary } from './ShopSummary';
import { CostStructure } from './CostStructure';
import { ShopTable } from './ShopTable';
import { ShopDetail } from './ShopDetail';

export function ShopProfitModule() {
  const [expandedShop, setExpandedShop] = useState('B03');
  const [showExtraCols, setShowExtraCols] = useState(false);

  return (
    <div className="space-y-6">
      {/* 集团汇总卡片 */}
      <ShopSummary />

      {/* 成本结构 + 店铺排名 */}
      <div className="grid grid-cols-4 gap-6">
        <CostStructure />
        <ShopTable 
          expandedShop={expandedShop}
          onExpand={setExpandedShop}
          showExtraCols={showExtraCols}
          onToggleExtraCols={() => setShowExtraCols(!showExtraCols)}
        />
      </div>

      {/* 店铺利润分析面板（展开） */}
      {expandedShop && (
        <ShopDetail 
          shopId={expandedShop} 
          onClose={() => setExpandedShop(null)} 
        />
      )}
    </div>
  );
}

export default ShopProfitModule;
