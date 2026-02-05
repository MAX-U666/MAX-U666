/**
 * SKU概览卡片组件
 */
import React from 'react';
import { SummaryCard } from '../../common';
import { skuData } from '../../../data/mock';

export function SkuOverview() {
  const summary = {
    totalSku: skuData.length,
    profitSku: skuData.filter(s => s.profit > 0).length,
    lossSku: skuData.filter(s => s.profit <= 0).length,
    roiOk: skuData.filter(s => s.roi >= 4).length,
    totalProfit: skuData.reduce((sum, s) => sum + s.profit, 0)
  };

  const stats = [
    { title: 'SKU总数', value: summary.totalSku },
    { title: '盈利SKU', value: summary.profitSku, badge: `${(summary.profitSku/summary.totalSku*100).toFixed(1)}%`, positive: true },
    { title: '亏损SKU', value: summary.lossSku, badge: `${(summary.lossSku/summary.totalSku*100).toFixed(1)}%` },
    { title: 'ROI达标', value: summary.roiOk, badge: 'ROI≥4', positive: true },
    { title: 'SKU总利润', value: `¥${summary.totalProfit.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`, positive: true },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <SummaryCard key={index} {...stat} />
      ))}
    </div>
  );
}

export default SkuOverview;
