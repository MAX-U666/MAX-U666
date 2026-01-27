// 全局样式
export const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
    fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    background: 'rgba(15, 23, 42, 0.95)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
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
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '16px',
    overflow: 'hidden',
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
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 20px',
    color: '#94A3B8',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

// 状态配置
export const getStatusConfig = (status) => {
  const configs = {
    '进行中': { label: '进行中', color: '#3B82F6', bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', icon: '◐' },
    '已完成': { label: '已完成', color: '#10B981', bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', icon: '✓' },
    '已暂停': { label: '已暂停', color: '#F59E0B', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', icon: '⏸' },
    '已归档': { label: '已归档', color: '#6B7280', bg: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)', icon: '📁' },
  };
  return configs[status] || configs['进行中'];
};

export const getDayStatus = (dayData) => {
  if (!dayData) return { label: '未提交', color: '#6B7280', bg: '#374151' };
  const configs = {
    '未提交': { label: '未提交', color: '#6B7280', bg: '#374151' },
    '待决策': { label: '待决策', color: '#F59E0B', bg: '#78350F' },
    '已执行': { label: '已执行', color: '#10B981', bg: '#064E3B' },
    '异常': { label: '异常', color: '#EF4444', bg: '#7F1D1D' }
  };
  return configs[dayData.status] || configs['未提交'];
};

export const getPhaseConfig = (phase) => {
  const configs = {
    A: { label: '样本不足期', color: '#F59E0B', bg: '#FEF3C7' },
    B: { label: '放量观察期', color: '#3B82F6', bg: '#DBEAFE' },
    C: { label: '放量确认期', color: '#10B981', bg: '#D1FAE5' }
  };
  return configs[phase] || { label: '-', color: '#6B7280', bg: '#F3F4F6' };
};
