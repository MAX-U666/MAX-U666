/**
 * 执行中心主页面
 * src/pages/ExecuteCenter/index.jsx
 */
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/theme';
import ShopManagement from './ShopManagement';
import OperationPanel from './OperationPanel';
import ExecutionHistory from './ExecutionHistory';
import TaskDetail from './TaskDetail';

const ExecuteCenter = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('operation'); // operation | shops | history
  const [stats, setStats] = useState(null);
  const [workerStatus, setWorkerStatus] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // 加载统计和状态
  useEffect(() => {
    loadStats();
    loadWorkerStatus();
    
    // 定时刷新
    const interval = setInterval(() => {
      loadStats();
      loadWorkerStatus();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/execute/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  };

  const loadWorkerStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/execute/worker/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setWorkerStatus(data.worker);
      }
    } catch (err) {
      console.error('加载Worker状态失败:', err);
    }
  };

  // 如果选中了任务，显示任务详情
  if (selectedTaskId) {
    return (
      <TaskDetail 
        taskId={selectedTaskId} 
        onBack={() => setSelectedTaskId(null)} 
      />
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 页头 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🤖
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#E2E8F0' }}>
              AI 执行中心
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
              自动化操作 Shopee 卖家中心
            </p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(6, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <StatCard 
          label="Worker状态" 
          value={workerStatus?.ziniao_running ? '运行中' : '未启动'} 
          color={workerStatus?.ziniao_running ? '#10B981' : '#EF4444'}
          icon="🔄"
        />
        <StatCard 
          label="队列中" 
          value={stats?.stats?.queued || 0} 
          color="#F59E0B"
          icon="⏳"
        />
        <StatCard 
          label="执行中" 
          value={stats?.stats?.running || 0} 
          color="#3B82F6"
          icon="▶️"
        />
        <StatCard 
          label="今日成功" 
          value={stats?.today?.success || 0} 
          color="#10B981"
          icon="✅"
        />
        <StatCard 
          label="今日失败" 
          value={stats?.today?.failed || 0} 
          color="#EF4444"
          icon="❌"
        />
        <StatCard 
          label="历史总数" 
          value={stats?.stats?.total || 0} 
          color="#94A3B8"
          icon="📊"
        />
      </div>

      {/* Tab 切换 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        background: 'rgba(255,255,255,0.03)',
        padding: '8px',
        borderRadius: '12px',
        width: 'fit-content'
      }}>
        <TabButton 
          active={activeTab === 'operation'} 
          onClick={() => setActiveTab('operation')}
          icon="🎯"
          label="操作台"
        />
        <TabButton 
          active={activeTab === 'shops'} 
          onClick={() => setActiveTab('shops')}
          icon="🏪"
          label="店铺管理"
        />
        <TabButton 
          active={activeTab === 'history'} 
          onClick={() => setActiveTab('history')}
          icon="📋"
          label="执行记录"
        />
      </div>

      {/* 内容区 */}
      {activeTab === 'operation' && (
        <OperationPanel 
          onTaskCreated={() => {
            loadStats();
            setActiveTab('history');
          }}
        />
      )}
      {activeTab === 'shops' && <ShopManagement />}
      {activeTab === 'history' && (
        <ExecutionHistory 
          onViewDetail={(taskId) => setSelectedTaskId(taskId)}
          onRefresh={loadStats}
        />
      )}
    </div>
  );
};

// 统计卡片组件
const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    ...styles.card,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  }}>
    <div style={{
      width: '42px',
      height: '42px',
      background: `${color}15`,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px'
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '20px', fontWeight: '700', color }}>{value}</div>
    </div>
  </div>
);

// Tab 按钮组件
const TabButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      borderRadius: '8px',
      border: 'none',
      background: active ? 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)' : 'transparent',
      color: active ? '#fff' : '#94A3B8',
      fontSize: '13px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    }}
  >
    <span>{icon}</span>
    {label}
  </button>
);

export default ExecuteCenter;
