/**
 * 任务详情组件
 */
import React, { useState, useEffect } from 'react';
import { styles } from '../../styles/theme';

const TaskDetail = ({ taskId, onBack }) => {
  const [task, setTask] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskDetail();
    const interval = setInterval(() => {
      if (task?.status === 'running' || task?.status === 'queued') {
        loadTaskDetail();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [taskId, task?.status]);

  const loadTaskDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/execute/tasks/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTask(data.task);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('加载任务详情失败:', err);
    } finally {
      setLoading(false);
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

  const getLogStatusColor = (status) => {
    const colors = { info: '#3B82F6', success: '#10B981', warning: '#F59E0B', error: '#EF4444' };
    return colors[status] || '#94A3B8';
  };

  const formatDuration = (ms) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>加载中...</div>;
  }

  if (!task) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
        任务不存在
        <br />
        <button onClick={onBack} style={{ ...styles.buttonSecondary, marginTop: '16px' }}>返回</button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(task.status);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={onBack} style={{ ...styles.buttonSecondary, marginBottom: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
        ← 返回列表
      </button>

      {/* 任务概览 */}
      <div style={{ ...styles.card, marginBottom: '20px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#E2E8F0', marginBottom: '4px' }}>
              {task.action_name}
            </div>
            <div style={{ fontSize: '13px', color: '#64748B', fontFamily: 'monospace' }}>
              {task.task_no}
            </div>
          </div>
          <span style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', background: statusConfig.bg, color: statusConfig.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <InfoItem label="店铺" value={task.shop_name} />
          <InfoItem label="来源" value={task.source === 'manual' ? '手动' : task.source === 'ai' ? 'AI决策' : task.source} />
          <InfoItem label="耗时" value={formatDuration(task.duration_ms)} />
          <InfoItem label="创建时间" value={new Date(task.created_at).toLocaleString('zh-CN')} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* 操作参数 */}
        <div style={styles.card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: '600', color: '#E2E8F0' }}>
            📋 操作参数
          </div>
          <div style={{ padding: '16px 20px' }}>
            <pre style={{ margin: 0, padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px', color: '#A78BFA', overflow: 'auto', maxHeight: '200px' }}>
              {JSON.stringify(task.payload, null, 2)}
            </pre>
          </div>
        </div>

        {/* 执行结果 */}
        <div style={styles.card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: '600', color: '#E2E8F0' }}>
            📊 执行结果
          </div>
          <div style={{ padding: '16px 20px' }}>
            {task.result ? (
              <pre style={{ margin: 0, padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px', color: task.result.ok ? '#10B981' : '#EF4444', overflow: 'auto', maxHeight: '200px' }}>
                {JSON.stringify(task.result, null, 2)}
              </pre>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                {task.status === 'queued' ? '等待执行...' : task.status === 'running' ? '执行中...' : '无结果'}
              </div>
            )}
            {task.error_message && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', color: '#F87171', fontSize: '13px' }}>
                ⚠️ {task.error_message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 执行日志 */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: '600', color: '#E2E8F0' }}>
          📝 执行日志
        </div>
        <div style={{ padding: '16px 20px' }}>
          {logs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
              {task.status === 'queued' ? '任务尚未开始' : '暂无日志'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {logs.map((log, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${getLogStatusColor(log.status)}` }}>
                  <span style={{ fontSize: '12px', color: '#64748B', minWidth: '50px' }}>
                    Step {log.step}
                  </span>
                  <span style={{ fontSize: '12px', color: getLogStatusColor(log.status), minWidth: '60px', fontWeight: '600' }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: '12px', color: '#E2E8F0', flex: 1 }}>
                    {log.message}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>
                    {new Date(log.created_at).toLocaleTimeString('zh-CN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 截图证据 */}
      {(task.evidence_before || task.evidence_after || task.evidence_error) && (
        <div style={{ ...styles.card, marginTop: '20px' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontWeight: '600', color: '#E2E8F0' }}>
            📸 执行截图
          </div>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <EvidenceImage label="执行前" path={task.evidence_before} />
            <EvidenceImage label="执行后" path={task.evidence_after} />
            <EvidenceImage label="错误截图" path={task.evidence_error} />
          </div>
        </div>
      )}
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '14px', color: '#E2E8F0', fontWeight: '500' }}>{value || '-'}</div>
  </div>
);

const EvidenceImage = ({ label, path }) => (
  <div>
    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '8px' }}>{label}</div>
    {path ? (
      <img src={`/evidence/${path.split('/').pop()}`} alt={label} style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }} />
    ) : (
      <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: '#64748B', fontSize: '12px' }}>
        无截图
      </div>
    )}
  </div>
);

export default TaskDetail;
