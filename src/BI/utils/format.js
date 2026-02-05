/**
 * BI 模块 - 格式化工具函数
 */

// 印尼盾转人民币汇率
export const RATE = 0.000434;

/**
 * 格式化为人民币
 */
export const formatCNY = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '¥0.00';
  return `¥${n.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * 格式化为印尼盾
 */
export const formatIDR = (n) => {
  if (n === null || n === undefined || isNaN(n)) return 'Rp 0';
  return `Rp ${n.toLocaleString('id-ID')}`;
};

/**
 * 印尼盾转人民币
 */
export const idrToCNY = (idr) => idr * RATE;

/**
 * 格式化百分比
 */
export const formatPercent = (n, decimals = 1) => {
  if (n === null || n === undefined || isNaN(n)) return '0%';
  return `${n.toFixed(decimals)}%`;
};

/**
 * 格式化数字（带千分位）
 */
export const formatNumber = (n) => {
  if (n === null || n === undefined || isNaN(n)) return '0';
  return n.toLocaleString('zh-CN');
};
