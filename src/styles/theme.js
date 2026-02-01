// 全局样式 - 苹果风格浅色主题
export const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%)',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
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
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 20px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(255,107,53,0.3)',
  },
  buttonSecondary: {
    background: '#F5F5F7',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    padding: '10px 20px',
    color: '#1D1D1F',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// 状态配置
export const getStatusConfig = (status) => {
  const configs = {
    '进行中': { label: '进行中', color: '#007AFF', bg: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', icon: '◐' },
    '已完成': { label: '已完成', color: '#34C759', bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', icon: '✓' },
    '已暂停': { label: '已暂停', color: '#FF9500', bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)', icon: '⏸' },
    '已归档': { label: '已归档', color: '#8E8E93', bg: 'linear-gradient(135deg, #F5F5F7 0%, #E5E5EA 100%)', icon: '📁' },
  };
  return configs[status] || configs['进行中'];
};

export const getDayStatus = (dayData) => {
  if (!dayData) return { label: '未提交', color: '#8E8E93', bg: '#E5E5EA' };
  const configs = {
    '未提交': { label: '未提交', color: '#8E8E93', bg: '#E5E5EA' },
    '待决策': { label: '待决策', color: '#FF9500', bg: '#FFF3E0' },
    '已执行': { label: '已执行', color: '#34C759', bg: '#E8F5E9' },
    '异常': { label: '异常', color: '#FF3B30', bg: '#FFEBEE' }
  };
  return configs[dayData.status] || configs['未提交'];
};

export const getPhaseConfig = (phase) => {
  const configs = {
    A: { label: '样本不足期', color: '#FF9500', bg: '#FFF8E1' },
    B: { label: '放量观察期', color: '#007AFF', bg: '#E3F2FD' },
    C: { label: '放量确认期', color: '#34C759', bg: '#E8F5E9' }
  };
  return configs[phase] || { label: '-', color: '#8E8E93', bg: '#F5F5F7' };
};
