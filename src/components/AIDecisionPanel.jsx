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

  const getDecisionColor = (decision) => {
    const colors = { '加大投放': '#10B981', '维持观察': '#3B82F6', '收缩防守': '#F59E0B', '暂停止损': '#EF4444' };
    return colors[decision] || '#64748B';
  };

  const getPhaseColor = (phase) => {
    const colors = { 'A': '#F59E0B', 'B': '#3B82F6', 'C': '#10B981' };
    return colors[phase] || '#64748B';
  };

  const getSupplementColor = (strategy) => {
    if (strategy?.includes('注入')) return '#8B5CF6';
    if (strategy?.includes('停止') || strategy?.includes('暂缓')) return '#EF4444';
    return '#64748B';
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
    let codeContent = [];
    let codeBlockKey = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // 代码块开始/结束
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // 代码块结束，渲染代码块
          result.push(
            <div key={`code-${codeBlockKey++}`} style={{ 
              background: 'rgba(0,0,0,0.4)', 
              border: '1px solid rgba(255,107,53,0.3)', 
              borderRadius: '8px', 
              padding: '16px', 
              margin: '12px 0',
              fontFamily: 'monospace',
              fontSize: '13px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: '#E2E8F0'
            }}>
              {codeContent.map((codeLine, j) => (
                <div key={j} style={{ 
                  color: codeLine.startsWith('✅') ? '#10B981' : 
                         codeLine.startsWith('❌') ? '#F87171' : 
                         codeLine.startsWith('⏰') ? '#FBBF24' :
                         codeLine.startsWith('【') ? '#FF6B35' : '#E2E8F0'
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
      
      // 标题
      if (line.startsWith('## ')) {
        result.push(<h3 key={i} style={{ color: '#FF6B35', fontSize: '16px', fontWeight: '700', margin: '24px 0 12px 0', borderBottom: '1px solid rgba(255,107,53,0.3)', paddingBottom: '8px' }}>{line.replace('## ', '')}</h3>);
        continue;
      }
      if (line.startsWith('### ')) {
        result.push(<h4 key={i} style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '600', margin: '16px 0 8px 0' }}>{line.replace('### ', '')}</h4>);
        continue;
      }
      // 引用块
      if (line.startsWith('> ')) {
        result.push(<div key={i} style={{ borderLeft: '3px solid #3B82F6', paddingLeft: '12px', margin: '8px 0', color: '#94A3B8', fontStyle: 'italic' }}>{line.replace('> ', '')}</div>);
        continue;
      }
      // 列表项
      if (line.startsWith('- ')) {
        const content = line.replace('- ', '');
        const isError = content.startsWith('❌') || content.includes('不要') || content.includes('严禁');
        const isSuccess = content.startsWith('✅') || content.startsWith('✓');
        result.push(
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '6px 0', color: isError ? '#F87171' : isSuccess ? '#10B981' : '#CBD5E1' }}>
            <span style={{ color: isError ? '#EF4444' : isSuccess ? '#10B981' : '#64748B' }}>•</span>
            <span>{content}</span>
          </div>
        );
        continue;
      }
      // 数字列表
      if (/^\d+\.\s/.test(line)) {
        result.push(<div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '6px 0', color: '#10B981' }}>{line}</div>);
        continue;
      }
      // 加粗文本
      if (line.includes('**')) {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        result.push(
          <p key={i} style={{ margin: '8px 0', color: '#E2E8F0', lineHeight: '1.8' }}>
            {parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: '#fff' }}>{part}</strong> : part)}
          </p>
        );
        continue;
      }
      // 分隔线
      if (line === '---') {
        result.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '16px 0' }} />);
        continue;
      }
      // 普通段落
      if (line.trim()) {
        result.push(<p key={i} style={{ margin: '8px 0', color: '#CBD5E1', lineHeight: '1.8' }}>{line}</p>);
      }
    }
    
    return result;
  };

  // Tab 按钮
  const TabButton = ({ id, icon, label, color }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '10px 8px', borderRadius: '8px',
        border: activeTab === id ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: activeTab === id ? `${color}15` : 'rgba(255,255,255,0.03)',
        color: activeTab === id ? color : '#94A3B8',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
      }}
    >
      {icon} {label}
    </button>
  );

  // 渲染执行面板的 Tab 内容
  const renderTabContent = () => {
    if (!analysis) return null;
    
    switch (activeTab) {
      case 'judgment':
        return (
          <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>🔍 核心卡点</h5>
            {analysis.key_bottlenecks?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span style={{ color: '#F59E0B' }}>•</span> {item}
              </div>
            )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无</div>}
          </div>
        );
      case 'strategy':
        return (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>✅ 今日必做</h5>
            {analysis.execution_checklist?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#10B981', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span>✓</span> {item}
              </div>
            )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无</div>}
          </div>
        );
      case 'risk':
        return (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>❌ 禁止操作</h5>
            {analysis.not_to_do?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#F87171', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span>❌</span> {item}
              </div>
            )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无</div>}
            <h5 style={{ margin: '16px 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>👀 观察重点</h5>
            {analysis.observation_focus?.map((item, i) => (
              <div key={i} style={{ fontSize: '12px', color: '#FBBF24', marginBottom: '8px', display: 'flex', gap: '8px' }}>
                <span>⏰</span> {item}
              </div>
            )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无</div>}
          </div>
        );
      case 'idn':
        return (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '12px', padding: '16px' }}>
            {analysis.idn_enhancement ? (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#FBBF24', fontSize: '12px' }}>💡 关键洞察</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#E2E8F0', lineHeight: '1.6' }}>{analysis.idn_enhancement.key_insight}</p>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <h5 style={{ margin: '0 0 8px 0', color: '#60A5FA', fontSize: '12px' }}>📦 物流建议</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#E2E8F0', lineHeight: '1.6' }}>{analysis.idn_enhancement.logistics_note}</p>
                </div>
                <div>
                  <h5 style={{ margin: '0 0 8px 0', color: '#34D399', fontSize: '12px' }}>🌏 本地化提示</h5>
                  <p style={{ margin: 0, fontSize: '12px', color: '#E2E8F0', lineHeight: '1.6' }}>{analysis.idn_enhancement.localization_tip}</p>
                </div>
              </>
            ) : <div style={{ color: '#64748B', fontSize: '12px' }}>暂无印尼专项分析</div>}
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
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MiniLogo size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>Day {currentDay} AI决策</span>
        </div>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
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
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', 
              padding: '16px 20px', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              borderBottom: reportExpanded ? '1px solid rgba(255,255,255,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '18px' }}>📄</span>
              </div>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>AI 完整分析报告</span>
              {analysisSource && (
                <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
                  {analysisSource === 'qwen-turbo' ? '🤖 千问AI' : '📋 规则引擎'}
                </span>
              )}
            </div>
            <span style={{ color: '#64748B', fontSize: '20px', transition: 'transform 0.2s', transform: reportExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
          </div>
          
          {reportExpanded && (
            <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              {analysis?.full_report ? (
                renderFullReport(analysis.full_report)
              ) : (
                <div style={{ color: '#64748B', textAlign: 'center', padding: '40px' }}>
                  暂无完整分析报告
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* AI决策执行面板 - 放在后面 */}
      <div style={styles.card}>
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '36px', height: '36px', 
              background: isExecuted ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              {isExecuted ? <span style={{ color: '#fff', fontSize: '18px' }}>✓</span> : <MiniLogo size={20} color="#fff" />}
            </div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>
              Day {currentDay} AI决策 {isExecuted ? '- 已执行' : ''}
            </span>
          </div>
          {!analysisResult && !analysis?.full_report && (
            <button onClick={handleGenerateAnalysis} disabled={isAnalyzing} style={{ ...styles.buttonPrimary, opacity: isAnalyzing ? 0.7 : 1 }}>
              {isAnalyzing ? '🔄 分析中...' : isExecuted ? '🔄 重新分析' : '🧠 生成AI决策'}
            </button>
          )}
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
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <MiniLogo size={48} color="#FF6B35" />
              <p style={{ marginTop: '16px', fontSize: '14px' }}>
                {isExecuted ? '此决策无历史分析记录，点击「重新分析」生成报告' : '点击「生成AI决策」获取智能分析'}
              </p>
            </div>
          )}

          {/* 分析中 */}
          {isAnalyzing && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
              <div style={{ width: '48px', height: '48px', border: '3px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p>千问 AI 正在分析...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* 决策摘要 */}
          {showAnalysis && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: isExecuted ? 'repeat(4, 1fr)' : '1fr 1fr 1fr auto', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: `${getPhaseColor(analysis?.phase)}15`, border: `1px solid ${getPhaseColor(analysis?.phase)}40`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>阶段</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: getPhaseColor(analysis?.phase) }}>阶段 {analysis?.phase || 'A'}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>{analysis?.phase_name}</div>
                </div>
                <div style={{ background: `${getDecisionColor(analysis?.today_decision || currentDayData.ai_action)}15`, border: `1px solid ${getDecisionColor(analysis?.today_decision || currentDayData.ai_action)}40`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{isExecuted ? '执行决策' : '今日判断'}</div>
                  <div style={{ fontSize: '18px', fontWeight: '700', color: getDecisionColor(analysis?.today_decision || currentDayData.ai_action) }}>{analysis?.today_decision || currentDayData.ai_action}</div>
                  <div style={{ fontSize: '10px', color: '#64748B' }}>置信度 {analysis?.confidence || currentDayData.ai_confidence}%</div>
                </div>
                <div style={{ background: `${getSupplementColor(analysis?.supplement_strategy)}15`, border: `1px solid ${getSupplementColor(analysis?.supplement_strategy)}40`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>补单策略</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: getSupplementColor(analysis?.supplement_strategy) }}>{analysis?.supplement_strategy || '-'}</div>
                </div>
                {!isExecuted && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={handleConfirmExecute} style={{ flex: 1, padding: '12px 16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✓ 确认执行</button>
                    <button onClick={onAbnormal} style={{ flex: 1, padding: '12px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#EF4444', fontSize: '13px', cursor: 'pointer' }}>上报异常</button>
                  </div>
                )}
                {isExecuted && (
                  <div style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>ROI</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: (currentDayData.roi || 0) >= 3 ? '#10B981' : '#F59E0B' }}>{currentDayData.roi || '-'}</div>
                  </div>
                )}
              </div>

              {/* Tab 切换 */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <TabButton id="judgment" icon="📋" label="核心卡点" color="#3B82F6" />
                <TabButton id="strategy" icon="🎯" label="今日必做" color="#10B981" />
                <TabButton id="risk" icon="⚠️" label="风险提示" color="#EF4444" />
                <TabButton id="idn" icon="🇮🇩" label="印尼专项" color="#EF4444" />
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
