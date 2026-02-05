/**
 * 订单汇总卡片组件
 */
import React from 'react';
import { SummaryCard } from '../../common';

export function OrderStats() {
  const stats = [
    { title: '总订单数', value: '1,854' },
    { title: '盈利订单', value: '1,721', badge: '92.8%', positive: true },
    { title: '亏损订单', value: '133', badge: '7.2%' },
    { title: '平均利润', value: '¥224.45', positive: true },
    { title: '总利润', value: '¥416,072', positive: true },
  ];

  return (
    <div className="grid grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <SummaryCard key={index} {...stat} />
      ))}
    </div>
  );
}

export default OrderStats;
