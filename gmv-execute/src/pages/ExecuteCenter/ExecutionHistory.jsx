/**
 * 执行记录组件
 */
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/theme';

const ExecutionHistory = ({ onViewDetail, onRefresh }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | queued | running | success | failed

  useEffect(() => {
    loadTasks();
    // 自动刷新
    const interval = setInterval(loadTasks, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/execute/tasks?limit=50';
      if (filter !== 'all') {
        url += `&status=${filter}`;
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('加载任务失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (taskId) => {
    if (!window.confirm('确定要取消该任务吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/execute/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        loadTasks();
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || '取消失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const handleRetry = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/execute/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        alert(`已创建重试任务: ${data.task_no}`);
        loadTasks();
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || '重试失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      queued: { label: '排队中', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: '⏳' },
      running: { label: '执行中', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: '▶️' },
      success: { label: '成功', color: '#10B981', bg: 'rgba(16,185,129,0.15)', icon: '✅' },
      failed: { label: '失败', color: '#EF4444', bg: 'rgba(239,68,68,0.15)', icon: '❌' },
      cancelled: { label: '已取消', color: '#6B7280', bg: 'rgba(107,114,128,0.15)', icon: '🚫' }
    };
    return configs[status] || configs.queued;
  };

  const getActionIcon = (action) => {
    const icons = {
      adjust_budget: '💰',
      toggle_ad: '🔘',
      update_title: '✏️',
      update_price: '💵'
    };
    return icons[action] || '📋';
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
        加载中...
      </div>
    );
  }

  return (
    <div>
      {/* 过滤器 */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px'
      }}>
        {[
          { value: 'all', label: '全部' },
          { value: 'queued', label: '排队中' },
          { value: 'running', label: '执行中' },
          { value: 'success', label: '成功' },
          { value: 'failed', label: '失败' }
        ].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: filter === opt.value 
                ? '1px solid #8B5CF6' 
                : '1px solid rgba(255,255,255,0.1)',
              background: filter === opt.value 
                ? 'rgba(139,92,246,0.15)' 
                : 'transparent',
              color: filter === opt.value ? '#A78BFA' : '#94A3B8',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {opt.label}
          </button>
        ))}
        
        <button
          onClick={() => { loadTasks(); if (onRefresh) onRefresh(); }}
          style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'transparent',
            color: '#94A3B8',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          🔄 刷新
        </button>
      </div>

      {/* 任务列表 */}
      {tasks.length === 0 ? (
        <div style={{
          ...styles.card,
          padding: '60px 20px',
          textAlign: 'center',
          color: '#64748B'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p>暂无执行记录</p>
        </div>
      ) : (
        <div style={styles.card}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={thStyle}>任务编号</th>
                <th style={thStyle}>店铺</th>
                <th style={thStyle}>操作</th>
                <th style={thStyle}>状态</th>
                <th style={thStyle}>耗时</th>
                <th style={thStyle}>创建时间</th>
                <th style={thStyle}>操作</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                const statusConfig = getStatusConfig(task.status);
                return (
                  <tr 
                    key={task.id}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <td style={tdStyle}>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        color: '#A78BFA',
                        cursor: 'pointer'
                      }}
                      onClick={() => onViewDetail && onViewDetail(task.id)}
                      >
                        {task.task_no}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#E2E8F0' }}>{task.shop_name}</span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{getActionIcon(task.action)}</span>
                        <span style={{ color: '#E2E8F0' }}>{task.action_name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: statusConfig.bg,
                        color: statusConfig.color,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#94A3B8' }}>
                        {formatDuration(task.duration_ms)}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ color: '#64748B' }}>
                        {new Date(task.created_at).toLocaleString('zh-CN')}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => onViewDetail && onViewDetail(task.id)}
                          style={actionBtnStyle}
                        >
                          详情
                        </button>
                        {task.status === 'queued' && (
                          <button
                            onClick={() => handleCancel(task.id)}
                            style={{ ...actionBtnStyle, color: '#F59E0B' }}
                          >
                            取消
                          </button>
                        )}
                        {task.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(task.id)}
                            style={{ ...actionBtnStyle, color: '#3B82F6' }}
                          >
                            重试
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '14px 16px',
  textAlign: 'left',
  color: '#64748B',
  fontWeight: '600',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tdStyle = {
  padding: '14px 16px'
};

const actionBtnStyle = {
  padding: '4px 10px',
  borderRadius: '4px',
  border: 'none',
  background: 'rgba(255,255,255,0.05)',
  color: '#94A3B8',
  fontSize: '11px',
  cursor: 'pointer'
};

export default ExecutionHistory;
