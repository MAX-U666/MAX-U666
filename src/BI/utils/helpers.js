/**
 * BI 模块 - 辅助计算函数
 */

import { ROI_THRESHOLD, PROFIT_RATE_THRESHOLD } from './constants';

/**
 * 判断店铺/SKU健康度
 * @param {number} roi - ROI值
 * @param {number} rate - 利润率
 * @returns {'good'|'warning'|'danger'}
 */
export const getHealthStatus = (roi, rate) => {
  if (roi >= ROI_THRESHOLD.good && rate > PROFIT_RATE_THRESHOLD.good) {
    return 'good';
  }
  if (roi >= ROI_THRESHOLD.warning || rate > PROFIT_RATE_THRESHOLD.warning) {
    return 'warning';
  }
  return 'danger';
};

/**
 * SKU四象限分类
 * @param {object} sku - SKU数据对象
 * @returns {'star'|'potential'|'thin'|'problem'|'normal'}
 */
export const getSkuQuadrant = (sku) => {
  const { roi, profit, orders } = sku;
  
  if (roi >= 4 && profit > 500) return 'star';       // 明星款：高ROI + 高利润
  if (roi >= 4 && orders < 20) return 'potential';   // 潜力款：高ROI + 低销量
  if (roi < 4 && orders > 50) return 'thin';         // 薄利款：低ROI + 高销量
  if (roi < 2 || profit < 0) return 'problem';       // 问题款：ROI<2 或 亏损
  return 'normal';
};

/**
 * 获取订单异常标记
 * @param {object} order - 订单数据
 * @returns {Array} 异常标记数组
 */
export const getOrderFlags = (order) => {
  const { profit, revenue, ad, cost } = order;
  const profitRate = (profit / revenue) * 100;
  const adRate = (ad / revenue) * 100;
  const costRate = (cost / revenue) * 100;
  
  const flags = [];
  
  if (profitRate < 0) {
    flags.push({ icon: '🔴', label: '亏损', color: 'red', detail: `利润率${profitRate.toFixed(1)}%` });
  }
  if (adRate > 30) {
    flags.push({ icon: '🔴', label: '高广告', color: 'red', detail: `广告占比${adRate.toFixed(1)}%` });
  }
  if (costRate > 50) {
    flags.push({ icon: '🟠', label: '高成本', color: 'orange', detail: `成本占比${costRate.toFixed(1)}%` });
  }
  if (profitRate >= 0 && profitRate < 10 && flags.length === 0) {
    flags.push({ icon: '🟡', label: '低毛利', color: 'yellow', detail: `利润率${profitRate.toFixed(1)}%` });
  }
  
  return flags;
};

/**
 * 计算汇总数据
 * @param {Array} data - 数据数组
 * @param {string} field - 要汇总的字段
 * @returns {number}
 */
export const sumField = (data, field) => {
  return data.reduce((sum, item) => sum + (item[field] || 0), 0);
};

/**
 * 获取预警级别
 * @param {object} data - 数据对象
 * @returns {'critical'|'warning'|'info'}
 */
export const getWarningLevel = (data) => {
  const { roi, profit, profitRate } = data;
  
  if (profit < 0 || roi < 1.5) return 'critical';
  if (roi < ROI_THRESHOLD.warning || profitRate < 10) return 'warning';
  return 'info';
};
