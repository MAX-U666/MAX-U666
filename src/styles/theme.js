// 全局样式 - 白底橙色主题（匹配产品开发管理系统）
export const styles = {
  container: {
    minHeight: '100vh',
    background: '#F7F8FA',
    fontFamily: '"PingFang SC", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    background: '#FFFFFF',
    borderBottom: '1px solid #E8E8ED',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  content: {
    padding: '24px 32px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E8E8ED',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 8px rgba(255,107,53,0.25)',
  },
  buttonSecondary: {
    background: '#F5F5F7',
    border: '1px solid #E8E8ED',
    borderRadius: '8px',
    padding: '10px 20px',
    color: '#333',
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
  if (!dayData) return { label: '未提交', color: '#6B7280', bg: '#E5E7EB' };
  const configs = {
    '未提交': { label: '未提交', color: '#6B7280', bg: '#E5E7EB' },
    '待决策': { label: '待决策', color: '#F59E0B', bg: '#FEF3C7' },
    '已执行': { label: '已执行', color: '#10B981', bg: '#D1FAE5' },
    '异常': { label: '异常', color: '#EF4444', bg: '#FEE2E2' }
  };
  return configs[dayData.status] || configs['未提交'];
};

export const getPhaseConfig = (phase) => {
  const configs = {
    1: { label: '虚拟开发', icon: '💻', color: '#3B82F6' },
    2: { label: '视觉设计', icon: '🎨', color: '#8B5CF6' },
    3: { label: '内容规划', icon: '📝', color: '#F59E0B' },
    4: { label: '上架准备', icon: '🚀', color: '#10B981' },
    5: { label: '正式运营', icon: '📊', color: '#FF6B35' },
  };
  return configs[phase] || configs[1];
};
