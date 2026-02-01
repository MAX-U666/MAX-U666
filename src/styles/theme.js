// 全局样式 - 苹果风格浅色主题（清晰版）
export const styles = {
  container: {
    minHeight: '100vh',
    background: '#F2F2F7',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid #D1D1D6',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  content: {
    padding: '24px 32px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E5EA',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  buttonPrimary: {
    background: '#007AFF',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonSecondary: {
    background: '#FFFFFF',
    border: '1px solid #D1D1D6',
    borderRadius: '10px',
    padding: '10px 20px',
    color: '#1C1C1E',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// 状态配置
export const getStatusConfig = (status) => {
  const configs = {
    '进行中': { label: '进行中', color: '#FFFFFF', bg: '#007AFF', icon: '◐' },
    '已完成': { label: '已完成', color: '#FFFFFF', bg: '#34C759', icon: '✓' },
    '已暂停': { label: '已暂停', color: '#FFFFFF', bg: '#FF9500', icon: '⏸' },
    '已归档': { label: '已归档', color: '#FFFFFF', bg: '#8E8E93', icon: '📁' },
  };
  return configs[status] || configs['进行中'];
};

export const getDayStatus = (dayData) => {
  if (!dayData) return { label: '未提交', color: '#8E8E93', bg: '#F2F2F7' };
  const configs = {
    '未提交': { label: '未提交', color: '#8E8E93', bg: '#F2F2F7' },
    '待决策': { label: '待决策', color: '#FF9500', bg: '#FFF4E6' },
    '已执行': { label: '已执行', color: '#34C759', bg: '#E8F8ED' },
    '异常': { label: '异常', color: '#FF3B30', bg: '#FFEBEA' }
  };
  return configs[dayData.status] || configs['未提交'];
};

export const getPhaseConfig = (phase) => {
  const configs = {
    A: { label: '样本不足期', color: '#FF9500', bg: '#FFF4E6' },
    B: { label: '放量观察期', color: '#007AFF', bg: '#E5F1FF' },
    C: { label: '放量确认期', color: '#34C759', bg: '#E8F8ED' }
  };
  return configs[phase] || { label: '-', color: '#8E8E93', bg: '#F2F2F7' };
};
