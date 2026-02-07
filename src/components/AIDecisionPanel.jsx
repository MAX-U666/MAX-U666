import React, { useState } from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';

const AIDecisionPanel = ({ selectedProduct, currentDayData, currentDay, onExecute, onAbnormal, currentUser }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('judgment');
  const [reportExpanded, setReportExpanded] = useState(true);

  const handleGenerateAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai-analysis/${selectedProduct.id}/${currentDay}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useAI: true })
      });
      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.result);
        setAnalysisSource(data.source);
      } else {
        setError(data.error || '分析失败');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmExecute = () => {
    if (analysisResult) {
      onExecute(
        analysisResult.today_decision, 
        analysisResult.key_bottlenecks?.join('; ') || '', 
        analysisResult.confidence,
        analysisResult
      );
    }
  };

  // 马卡龙色系 - 与BI中心统一
  const getDecisionColor = (decision) => {
    const colors = { '加大投放': '#10B981', '维持观察': '#3B82F6', '收缩防守': '#F59E0B', '暂停止损': '#EF4444' };
    return colors[decision] || '#64748B';
  };
  const getDecisionMacaron = (decision) => {
    const map = {
      '加大投放': { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669', iconBg: '#D1FAE5' },
      '维持观察': { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB', iconBg: '#DBEAFE' },
      '收缩防守': { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706', iconBg: '#FEF3C7' },
      '暂停止损': { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', iconBg: '#FEE2E2' },
    };
    return map[decision] || { bg: '#F9FAFB', border: '#E5E7EB', text: '#374151', iconBg: '#F3F4F6' };
  };

  const getPhaseColor = (phase) => {
    const colors = { 'A': '#F59E0B', 'B': '#3B82F6', 'C': '#10B981' };
    return colors[phase] || '#64748B';
  };
  const getPhaseMacaron = (phase) => {
    const map = {
      'A': { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309', iconBg: '#FEF3C7' },
      'B': { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', iconBg: '#DBEAFE' },
      'C': { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857', iconBg: '#D1FAE5' },
    };
    return map[phase] || { bg: '#F9FAFB', border: '#E5E7EB', text: '#374151', iconBg: '#F3F4F6' };
  };

  const getSupplementColor = (strategy) => {
    if (strategy?.includes('注入')) return '#8B5CF6';
    if (strategy?.includes('停止') || strategy?.includes('暂缓')) return '#EF4444';
    return '#64748B';
  };
  const getSupplementMacaron = (strategy) => {
    if (strategy?.includes('注入')) return { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9', iconBg: '#EDE9FE' };
    if (strategy?.includes('停止') || strategy?.includes('暂缓')) return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', iconBg: '#FEE2E2' };
    return { bg: '#F0FDFA', border: '#CCFBF1', text: '#0F766E', iconBg: '#CCFBF1' };
  };

  // 获取分析数据
  const getAnalysisData = () => {
    if (analysisResult) return analysisResult;
    if (currentDayData?.ai_full_analysis) return currentDayData.ai_full_analysis;
    return null;
  };

  const analysis = getAnalysisData();

  // 渲染 Markdown 格式的完整报告
  const renderFullReport = (report) => {
    if (!report) return null;
    
    const lines = report.split('\n');
    const result = [];
    let inCodeBlock = false;
    let inActionCard = false;
    let codeContent = [];
    let actionCardContent = [];
    let codeBlockKey = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // 检测行动卡开始（【今日唯一动作】或类似标记）
      if (!inCodeBlock && !inActionCard && (trimmedLine.startsWith('【今日') || trimmedLine.includes('《印尼首单跃迁行动卡》'))) {
        inActionCard = true;
        if (!trimmedLine.includes('《')) {
          actionCardContent.push(line);
        }
        continue;
      }
      
      // 行动卡内容收集（直到遇到空行或新章节）
      if (inActionCard) {
        if (trimmedLine === '' || trimmedLine.startsWith('##') || trimmedLine.startsWith('---') || (trimmedLine.startsWith('**') && !trimmedLine.includes('今日') && !trimmedLine.includes('严禁') && !trimmedLine.includes('盯盘'))) {
          // 行动卡结束，渲染
          if (actionCardContent.length > 0) {
            result.push(
              <div key={`action-${codeBlockKey++}`} style={{ 
                background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(139,92,246,0.1) 100%)', 
                border: '2px solid rgba(255,107,53,0.4)', 
                borderRadius: '12px', 
                padding: '20px', 
                margin: '16px 0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,107,53,0.3)' }}>
                  <span style={{ fontSize: '20px' }}>📌</span>
                  <span style={{ color: '#FF6B35', fontWeight: '700', fontSize: '14px' }}>印尼首单跃迁行动卡</span>
                </div>
                {actionCardContent.map((cardLine, j) => {
                  const cl = cardLine.trim();
                  if (cl.startsWith('【') && cl.endsWith('】')) {
                    return <div key={j} style={{ color: '#FF6B35', fontWeight: '700', fontSize: '13px', margin: '16px 0 8px 0' }}>{cl}</div>;
                  }
                  if (cl.startsWith('✅')) {
                    return <div key={j} style={{ color: '#10B981', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
                  }
                  if (cl.startsWith('❌')) {
                    return <div key={j} style={{ color: '#F87171', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
                  }
                  if (cl.startsWith('⏰')) {
                    return <div key={j} style={{ color: '#FBBF24', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
                  }
                  if (cl.startsWith('①') || cl.startsWith('②') || cl.startsWith('③')) {
                    return <div key={j} style={{ color: '#6B7280', fontSize: '12px', margin: '2px 0', paddingLeft: '20px' }}>{cl}</div>;
                  }
                  if (cl) {
                    return <div key={j} style={{ color: '#1F2937', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
                  }
                  return null;
                })}
              </div>
            );
            actionCardContent = [];
          }
          inActionCard = false;
          // 继续处理当前行
        } else {
          actionCardContent.push(line);
          continue;
        }
      }
      
      // 代码块开始/结束
      if (trimmedLine.startsWith('```')) {
        if (inCodeBlock) {
          // 代码块结束，渲染代码块
          result.push(
            <div key={`code-${codeBlockKey++}`} style={{ 
              background: '#F9FAFB', 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px', 
              padding: '16px', 
              margin: '12px 0',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap',
              color: '#1F2937'
            }}>
              {codeContent.map((codeLine, j) => (
                <div key={j} style={{ 
                  color: codeLine.trim().startsWith('✅') ? '#10B981' : 
                         codeLine.trim().startsWith('❌') ? '#F87171' : 
                         codeLine.trim().startsWith('⏰') ? '#FBBF24' :
                         codeLine.trim().startsWith('【') ? '#FF6B35' : '#1F2937'
                }}>{codeLine}</div>
              ))}
            </div>
          );
          codeContent = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        continue;
      }
      
      // 在代码块内，收集内容
      if (inCodeBlock) {
        codeContent.push(line);
        continue;
      }
      
      // 标题 - 支持更多层级
      if (trimmedLine.startsWith('## ') && !trimmedLine.startsWith('### ')) {
        result.push(<h3 key={i} style={{ color: '#FF6B35', fontSize: '16px', fontWeight: '700', margin: '24px 0 12px 0', borderBottom: '1px solid rgba(255,107,53,0.3)', paddingBottom: '8px' }}>{trimmedLine.replace('## ', '')}</h3>);
        continue;
      }
      if (trimmedLine.startsWith('### ')) {
        result.push(<h4 key={i} style={{ color: '#EA580C', fontSize: '14px', fontWeight: '700', margin: '20px 0 8px 0', paddingLeft: '10px', borderLeft: '3px solid #EA580C' }}>{trimmedLine.replace('### ', '')}</h4>);
        continue;
      }
      if (trimmedLine.startsWith('#### ') || trimmedLine.startsWith('##### ') || trimmedLine.startsWith('###### ')) {
        const text = trimmedLine.replace(/^#+\s/, '');
        result.push(<h5 key={i} style={{ color: '#3B82F6', fontSize: '13px', fontWeight: '600', margin: '12px 0 6px 0' }}>{text}</h5>);
        continue;
      }
      // 带数字的标题（如 "7. 印尼专属增强模块"）
      if (/^\d+\.\s+[^\d]/.test(trimmedLine) && trimmedLine.length < 50) {
        result.push(<h4 key={i} style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '600', margin: '16px 0 8px 0' }}>{trimmedLine}</h4>);
        continue;
      }
      // 引用块
      if (trimmedLine.startsWith('> ')) {
        result.push(<div key={i} style={{ borderLeft: '3px solid #3B82F6', paddingLeft: '12px', margin: '8px 0', color: '#6B7280', fontStyle: 'italic' }}>{trimmedLine.replace('> ', '')}</div>);
        continue;
      }
      // 列表项
      if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('• ') || trimmedLine.startsWith('* ')) {
        const content = trimmedLine.replace(/^[-•*]\s/, '');
        const isError = content.startsWith('❌') || content.includes('不要') || content.includes('严禁') || content.includes('不可');
        const isSuccess = content.startsWith('✅') || content.startsWith('✓');
        result.push(
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '6px 0', color: isError ? '#F87171' : isSuccess ? '#10B981' : '#4B5563' }}>
            <span style={{ color: isError ? '#EF4444' : isSuccess ? '#10B981' : '#6B7280' }}>•</span>
            <span>{content}</span>
          </div>
        );
        continue;
      }
      // 加粗文本
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        result.push(
          <p key={i} style={{ margin: '8px 0', color: '#1F2937', lineHeight: '1.8' }}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#FF6B35' }}>{part}</strong> : part)}
          </p>
        );
        continue;
      }
      // 分隔线
      if (trimmedLine === '---') {
        result.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '16px 0' }} />);
        continue;
      }
      // 普通段落
      if (trimmedLine) {
        result.push(<p key={i} style={{ margin: '8px 0', color: '#4B5563', lineHeight: '1.8' }}>{line}</p>);
      }
    }
    
    // 处理未闭合的行动卡
    if (actionCardContent.length > 0) {
      result.push(
        <div key={`action-final`} style={{ 
          background: 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(139,92,246,0.1) 100%)', 
          border: '2px solid rgba(255,107,53,0.4)', 
          borderRadius: '12px', 
          padding: '20px', 
          margin: '16px 0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,107,53,0.3)' }}>
            <span style={{ fontSize: '20px' }}>📌</span>
            <span style={{ color: '#FF6B35', fontWeight: '700', fontSize: '14px' }}>印尼首单跃迁行动卡</span>
          </div>
          {actionCardContent.map((cardLine, j) => {
            const cl = cardLine.trim();
            if (cl.startsWith('【') && cl.endsWith('】')) {
              return <div key={j} style={{ color: '#FF6B35', fontWeight: '700', fontSize: '13px', margin: '16px 0 8px 0' }}>{cl}</div>;
            }
            if (cl.startsWith('✅')) {
              return <div key={j} style={{ color: '#10B981', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
            }
            if (cl.startsWith('❌')) {
              return <div key={j} style={{ color: '#F87171', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
            }
            if (cl.startsWith('⏰')) {
              return <div key={j} style={{ color: '#FBBF24', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
            }
            if (cl.startsWith('①') || cl.startsWith('②') || cl.startsWith('③')) {
              return <div key={j} style={{ color: '#6B7280', fontSize: '12px', margin: '2px 0', paddingLeft: '20px' }}>{cl}</div>;
            }
            if (cl) {
              return <div key={j} style={{ color: '#1F2937', fontSize: '13px', margin: '4px 0', paddingLeft: '8px' }}>{cl}</div>;
            }
            return null;
          })}
        </div>
      );
    }
    
    return result;
  };

  // Tab 按钮 - 马卡龙色系
  const tabMacaron = {
    judgment: { bg: '#EFF6FF', border: '#BFDBFE', activeBg: '#DBEAFE', text: '#1D4ED8' },
    strategy: { bg: '#ECFDF5', border: '#A7F3D0', activeBg: '#D1FAE5', text: '#059669' },
    risk: { bg: '#FEF2F2', border: '#FECACA', activeBg: '#FEE2E2', text: '#DC2626' },
    time: { bg: '#FFFBEB', border: '#FDE68A', activeBg: '#FEF3C7', text: '#B45309' },
    idn: { bg: '#FFF1F2', border: '#FECDD3', activeBg: '#FFE4E6', text: '#BE123C' },
  };
  const TabButton = ({ id, icon, label }) => {
    const m = tabMacaron[id] || tabMacaron.judgment;
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          flex: 1, padding: '10px 8px', borderRadius: '10px',
          border: `1px solid ${isActive ? m.border : '#E5E7EB'}`,
          background: isActive ? m.activeBg : '#F9FAFB',
          color: isActive ? m.text : '#6B7280',
          fontSize: '12px', fontWeight: '600', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          transition: 'all 0.15s'
        }}
      >
        {icon} {label}
      </button>
    );
  };

  // 从 full_report 中提取盯盘时间
  const extractObservationTimes = (report) => {
    if (!report) return [];
    const times = [];
    const lines = report.split('\n');
    let inSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 检测盯盘时间章节
      if (trimmed.includes('盯盘时间') || trimmed.includes('观察重点') || trimmed.includes('24–48') || trimmed.includes('24-48')) {
        inSection = true;
        continue;
      }
      // 检测下一个章节开始
      if (inSection && (trimmed.startsWith('##') || trimmed.startsWith('🇮🇩') || trimmed.startsWith('✅ 最后') || trimmed.includes('印尼专属'))) {
        inSection = false;
      }
      // 收集时间点
      if (inSection && trimmed.startsWith('⏰')) {
        times.push(trimmed);
      }
      // 也收集带"时间点"的行
      if (inSection && trimmed.includes('时间点') && trimmed.includes('：')) {
        times.push(trimmed);
      }
    }
    return times;
  };

  // 从 full_report 中提取今日必做
  const extractExecutionChecklist = (report) => {
    if (!report) return [];
    const items = [];
    const lines = report.split('\n');
    let inSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 检测章节开始
      if (trimmed.includes('必须动作') || trimmed.includes('今日必做') || trimmed.includes('执行建议') || 
          trimmed.includes('【今日唯一动作】') || trimmed.includes('必须流程')) {
        inSection = true;
        continue;
      }
      // 检测章节结束
      if (inSection && (trimmed.startsWith('##') || trimmed.includes('【今日严禁】') || 
          trimmed.includes('严禁动作') || trimmed.includes('不建议') || trimmed.includes('禁止操作'))) {
        inSection = false;
      }
      // 收集内容
      if (inSection) {
        if (trimmed.startsWith('✅') || trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\d+\.\s/)) {
          const content = trimmed.replace(/^[✅•\-]\s*/, '').replace(/^\d+\.\s*/, '');
          if (content.length > 3 && !content.startsWith('**')) {
            items.push(content);
          }
        }
      }
    }
    return items.length > 0 ? items : [];
  };

  // 从 full_report 中提取禁止操作
  const extractNotToDo = (report) => {
    if (!report) return [];
    const items = [];
    const lines = report.split('\n');
    let inSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 检测章节开始
      if (trimmed.includes('不建议') || trimmed.includes('严禁') || trimmed.includes('禁止操作') || 
          trimmed.includes('【今日严禁】') || trimmed.includes('严禁动作')) {
        inSection = true;
        continue;
      }
      // 检测章节结束
      if (inSection && (trimmed.startsWith('##') || trimmed.includes('【盯盘') || 
          trimmed.includes('观察重点') || trimmed.includes('24–48') || trimmed.includes('24-48'))) {
        inSection = false;
      }
      // 收集内容
      if (inSection) {
        if (trimmed.startsWith('❌') || trimmed.startsWith('•') || trimmed.startsWith('-')) {
          const content = trimmed.replace(/^[❌•\-]\s*/, '');
          if (content.length > 3) {
            items.push(content);
          }
        }
      }
    }
    return items.length > 0 ? items : [];
  };

  // 从 full_report 中提取核心卡点
  const extractKeyBottlenecks = (report) => {
    if (!report) return [];
    const items = [];
    const lines = report.split('\n');
    let inSection = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 检测章节开始
      if (trimmed.includes('核心卡点') || trimmed.includes('卡点分析') || trimmed.includes('系统放量判断')) {
        inSection = true;
        continue;
      }
      // 检测章节结束
      if (inSection && (trimmed.includes('补单策略') || trimmed.includes('信号强化') || 
          trimmed.includes('不建议') || trimmed.startsWith('【补单'))) {
        inSection = false;
      }
      // 收集核心卡点
      if (inSection) {
        if (trimmed.startsWith('🔍') || trimmed.startsWith('❌') || trimmed.startsWith('✅')) {
          const content = trimmed.replace(/^[🔍❌✅]\s*/, '');
          if (content.length > 5) {
            items.push(content);
          }
        }
        // 也收集带•的重要内容
        if (trimmed.startsWith('•') && (trimmed.includes('不足') || trimmed.includes('缺乏') || 
            trimmed.includes('问题') || trimmed.includes('风险') || trimmed.includes('系统'))) {
          const content = trimmed.replace(/^•\s*/, '');
          if (content.length > 5) {
            items.push(content);
          }
        }
      }
    }
    return items.slice(0, 6); // 最多6条
  };

  // 渲染执行面板的 Tab 内容
  const renderTabContent = () => {
    if (!analysis) return null;
    
    // 从 full_report 提取数据
    const keyBottlenecks = analysis.key_bottlenecks?.length > 0 && analysis.key_bottlenecks[0] !== '详见完整分析报告' 
      ? analysis.key_bottlenecks 
      : extractKeyBottlenecks(analysis.full_report);
    const executionChecklist = analysis.execution_checklist?.length > 0 
      ? analysis.execution_checklist 
      : extractExecutionChecklist(analysis.full_report);
    const notToDo = analysis.not_to_do?.length > 0 
      ? analysis.not_to_do 
      : extractNotToDo(analysis.full_report);
    const observationTimes = analysis.observation_times?.length > 0 
      ? analysis.observation_times 
      : extractObservationTimes(analysis.full_report);
    
    switch (activeTab) {
      case 'judgment':
        return (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#1D4ED8', fontSize: '13px', fontWeight: '600' }}>🔍 核心卡点</h5>
            {keyBottlenecks.length > 0 ? keyBottlenecks.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#4B5563', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#F59E0B' }}>•</span> {item}
              </div>
            )) : <div style={{ color: '#9CA3AF', fontSize: '12px' }}>详见完整分析报告</div>}
          </div>
        );
      case 'strategy':
        return (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#059669', fontSize: '13px', fontWeight: '600' }}>✅ 今日必做</h5>
            {executionChecklist.length > 0 ? executionChecklist.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#10B981', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span>✓</span> {item}
              </div>
            )) : <div style={{ color: '#9CA3AF', fontSize: '12px' }}>详见完整分析报告</div>}
          </div>
        );
      case 'risk':
        return (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#DC2626', fontSize: '13px', fontWeight: '600' }}>❌ 禁止操作</h5>
            {notToDo.length > 0 ? notToDo.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#F87171', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span>❌</span> {item}
              </div>
            )) : <div style={{ color: '#9CA3AF', fontSize: '12px' }}>详见完整分析报告</div>}
          </div>
        );
      case 'time':
        return (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#B45309', fontSize: '13px', fontWeight: '600' }}>⏰ 盯盘时间</h5>
            {observationTimes.length > 0 ? observationTimes.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#FBBF24', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span>⏰</span> <span style={{ color: '#1F2937' }}>{item.replace(/^⏰\s*/, '')}</span>
              </div>
            )) : <div style={{ color: '#9CA3AF', fontSize: '12px' }}>详见完整分析报告</div>}
          </div>
        );
      case 'idn':
        return (
          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: '12px', padding: '16px' }}>
            {analysis.idn_enhancement ? (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#FBBF24', fontSize: '12px' }}>💡 关键洞察</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#1F2937', lineHeight: '1.6' }}>{analysis.idn_enhancement.key_insight}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#60A5FA', fontSize: '12px' }}>📦 物流建议</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#1F2937', lineHeight: '1.6' }}>{analysis.idn_enhancement.logistics_note}</p>
                </div>
                <div>
                  <h5 style={{ margin: '0 0 8px 0', color: '#34D399', fontSize: '12px' }}>🌏 本地化提示</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#1F2937', lineHeight: '1.6' }}>{analysis.idn_enhancement.localization_tip}</p>
                </div>
              </>
            ) : <div style={{ color: '#9CA3AF', fontSize: '12px' }}>详见完整分析报告中的印尼专属增强模块</div>}
          </div>
        );
      default:
        return null;
    }
  };

  // 未提交数据
  if (!currentDayData || currentDayData.status === '未提交') {
    return (
      <div style={styles.card}>
        <div style={{ background: '#FFF7ED', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #FED7AA' }}>
          <div style={{ width: '36px', height: '36px', background: '#FFEDD5', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MiniLogo size={20} color="#EA580C" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#9A3412' }}>Day {currentDay} AI决策</span>
        </div>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9CA3AF' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>请先上传数据后再生成 AI 决策</p>
        </div>
      </div>
    );
  }

  // 已执行或待决策状态
  const isExecuted = currentDayData.status === '已执行';
  const showAnalysis = analysis || analysisResult;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 完整分析报告模块 - 放在前面 */}
      {showAnalysis && (
        <div style={styles.card}>
          <div 
            onClick={() => setReportExpanded(!reportExpanded)}
            style={{ 
              background: '#F0F9FF', 
              padding: '16px 20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: reportExpanded ? '1px solid #BAE6FD' : 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', background: '#DBEAFE', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px' }}>📄</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1E40AF' }}>AI 完整分析报告</span>
              {analysisSource && (
                <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                  {analysisSource === 'qwen-turbo' ? '🤖 千问AI' : '📋 规则引擎'}
                </span>
              )}
            </div>
            <span style={{ color: '#9CA3AF', fontSize: '20px', transition: 'transform 0.2s', transform: reportExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          
          {reportExpanded && (
            <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              {analysis?.full_report ? (
                renderFullReport(analysis.full_report)
              ) : (
                <div style={{ color: '#9CA3AF', textAlign: 'center', padding: '40px' }}>
                  暂无完整分析报告
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI决策执行面板 - 放在后面 */}
      <div style={styles.card}>
        <div style={{ background: '#FFF7ED', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FED7AA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', height: '36px', 
              background: isExecuted ? '#D1FAE5' : '#FFEDD5', 
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              {isExecuted ? <span style={{ color: '#059669', fontSize: '18px' }}>✓</span> : <MiniLogo size={20} color="#EA580C" />}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#9A3412' }}>
              Day {currentDay} AI决策 {isExecuted ? '- 已执行' : ''}
            </span>
          </div>
          <button onClick={handleGenerateAnalysis} disabled={isAnalyzing} style={{ ...styles.buttonPrimary, opacity: isAnalyzing ? 0.7 : 1 }}>
            {isAnalyzing ? '🔄 分析中...' : (analysisResult || analysis?.full_report) ? '🔄 重新分析' : '🧠 生成AI决策'}
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* 错误提示 */}
          {error && (
            <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '16px', color: '#F87171', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          {/* 未生成分析 */}
          {!showAnalysis && !isAnalyzing && !analysis?.full_report && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
              <MiniLogo size={48} color="#FF6B35" />
              <p style={{ marginTop: '16px', fontSize: '14px' }}>
                {isExecuted ? '此决策无历史分析记录，点击「重新分析」生成报告' : '点击「生成AI决策」获取智能分析'}
              </p>
            </div>
          )}

          {/* 分析中 */}
          {isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p>千问 AI 正在分析...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* 决策摘要 */}
          {showAnalysis && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isExecuted ? 'repeat(4, 1fr)' : '1fr 1fr 1fr auto', gap: '12px', marginBottom: '16px' }}>
                {(() => { const m = getPhaseMacaron(analysis?.phase); return (
                <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>阶段</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: m.text }}>阶段 {analysis?.phase || 'A'}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{analysis?.phase_name}</div>
                </div>
                ); })()}
                {(() => { const m = getDecisionMacaron(analysis?.today_decision || currentDayData.ai_action); return (
                <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>{isExecuted ? '执行决策' : '今日判断'}</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: m.text }}>{analysis?.today_decision || currentDayData.ai_action}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>置信度 {analysis?.confidence || currentDayData.ai_confidence}%</div>
                </div>
                ); })()}
                {(() => { const m = getSupplementMacaron(analysis?.supplement_strategy); return (
                <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>补单策略</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: m.text }}>{analysis?.supplement_strategy || '-'}</div>
                </div>
                ); })()}
                {!isExecuted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={handleConfirmExecute} style={{ flex: 1, padding: '12px 16px', background: '#10B981', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✓ 确认执行</button>
                    <button onClick={onAbnormal} style={{ flex: 1, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', color: '#DC2626', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>上报异常</button>
                  </div>
                )}
                {isExecuted && (
                  <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '6px', fontWeight: '500' }}>ROI</div>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: (currentDayData.roi || 0) >= 3 ? '#059669' : '#D97706' }}>{currentDayData.roi || '-'}</div>
                  </div>
                )}
              </div>

              {/* Tab 切换 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <TabButton id="judgment" icon="📋" label="核心卡点" />
                <TabButton id="strategy" icon="🎯" label="今日必做" />
                <TabButton id="risk" icon="⚠️" label="风险提示" />
                <TabButton id="time" icon="⏰" label="盯盘时间" />
                <TabButton id="idn" icon="🇮🇩" label="印尼专项" />
              </div>

              {renderTabContent()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIDecisionPanel;
