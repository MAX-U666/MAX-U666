import React, { useState } from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';
import { SkuDecision, ShopDecision } from './DecisionModules';

// ==================== 决策工作台（新版 - 三模式切换） ====================
const AIDecisionPanel = ({ selectedProduct, currentDayData, currentDay, onExecute, onAbnormal, currentUser }) => {
  const [decisionMode, setDecisionMode] = useState('sku'); // 'sku' | 'shop' | 'legacy'

  // === 原有 Legacy 面板的状态 ===
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('judgment');
  const [reportExpanded, setReportExpanded] = useState(true);

  // === Legacy 面板逻辑（保留原有功能） ===
  const handleGenerateAnalysis = async () => {
    if (!selectedProduct || !currentDay) return;
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

  const getDecisionColor = (d) => ({ '加大投放': '#10B981', '维持观察': '#3B82F6', '收缩防守': '#F59E0B', '暂停止损': '#EF4444' }[d] || '#64748B');
  const getPhaseColor = (p) => ({ 'A': '#F59E0B', 'B': '#3B82F6', 'C': '#10B981' }[p] || '#64748B');

  const getAnalysisData = () => analysisResult || currentDayData?.ai_full_analysis || null;
  const analysis = getAnalysisData();

  // 渲染Markdown报告（简化版，保留核心功能）
  const renderReport = (report) => {
    if (!report) return null;
    const lines = report.split('\n');
    const result = [];
    let inCode = false, codeLines = [], k = 0;
    for (const line of lines) {
      const t = line.trim();
      if (t.startsWith('```')) {
        if (inCode) {
          result.push(<pre key={k++} style={{ background: '#1E293B', color: '#E2E8F0', borderRadius: '8px', padding: '14px', margin: '12px 0', fontSize: '12px', whiteSpace: 'pre-wrap' }}>{codeLines.map((cl, j) => <div key={j} style={{ color: cl.trim().startsWith('✅') ? '#4ADE80' : cl.trim().startsWith('❌') ? '#F87171' : cl.trim().startsWith('⏰') ? '#FBBF24' : cl.trim().startsWith('【') ? '#FB923C' : '#E2E8F0' }}>{cl}</div>)}</pre>);
          codeLines = [];
        }
        inCode = !inCode;
        continue;
      }
      if (inCode) { codeLines.push(line); continue; }
      if (t.startsWith('### ')) { result.push(<h4 key={k++} style={{ color: '#F59E0B', fontSize: '14px', fontWeight: '600', margin: '16px 0 8px', borderLeft: '3px solid #F59E0B', paddingLeft: '10px' }}>{t.slice(4)}</h4>); continue; }
      if (t.startsWith('## ')) { result.push(<h3 key={k++} style={{ color: '#FF6B35', fontSize: '16px', fontWeight: '700', margin: '24px 0 10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,107,53,0.3)' }}>{t.slice(3)}</h3>); continue; }
      if (t.startsWith('# ')) { result.push(<h2 key={k++} style={{ color: '#1E293B', fontSize: '18px', fontWeight: '700', margin: '20px 0 12px' }}>{t.slice(2)}</h2>); continue; }
      if (t === '---') { result.push(<hr key={k++} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '16px 0' }} />); continue; }
      if (t.startsWith('✅') || t.startsWith('❌') || t.startsWith('⏰')) { const c = t.startsWith('✅') ? '#10B981' : t.startsWith('❌') ? '#EF4444' : '#F59E0B'; result.push(<div key={k++} style={{ color: c, fontWeight: '500', margin: '4px 0', paddingLeft: '8px' }}>{t}</div>); continue; }
      if (t.startsWith('【') && t.endsWith('】')) { result.push(<div key={k++} style={{ color: '#FF6B35', fontWeight: '700', margin: '12px 0 6px' }}>{t}</div>); continue; }
      if (t.startsWith('- ') || t.startsWith('* ')) { result.push(<div key={k++} style={{ display: 'flex', gap: '8px', margin: '4px 0', paddingLeft: '8px' }}><span style={{ color: '#FF6B35' }}>•</span><span>{t.slice(2)}</span></div>); continue; }
      if (!t) { result.push(<div key={k++} style={{ height: '8px' }} />); continue; }
      result.push(<p key={k++} style={{ margin: '4px 0', fontSize: '13px', lineHeight: '1.8' }}>{t}</p>);
    }
    return result;
  };

  // ==================== 模式切换选项 ====================
  const modeOptions = [
    { key: 'sku', label: 'SKU决策', icon: '🔗' },
    { key: 'shop', label: '店铺决策', icon: '🏪' },
    { key: 'legacy', label: '投放决策', icon: '📊' },
  ];

  // ==================== 渲染 ====================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* 顶部：标题 + 模式切换 */}
      <div style={{
        background: '#FFF', borderRadius: '16px 16px 0 0', border: '1px solid #E2E8F0',
        borderBottom: 'none', padding: '10px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
            borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MiniLogo size={18} color="#FFF" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1E293B' }}>决策工作台</span>
        </div>

        <div style={{ display: 'flex', gap: '3px', background: '#F1F5F9', borderRadius: '10px', padding: '3px' }}>
          {modeOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setDecisionMode(opt.key)}
              style={{
                padding: '5px 12px', borderRadius: '7px', border: 'none',
                background: decisionMode === opt.key ? '#FFF' : 'transparent',
                color: decisionMode === opt.key ? '#FF6B35' : '#64748B',
                fontSize: '12px', fontWeight: decisionMode === opt.key ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: decisionMode === opt.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              <span>{opt.icon}</span> {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div style={{
        background: '#FFF', borderRadius: '0 0 16px 16px', border: '1px solid #E2E8F0',
        borderTop: '1px solid #F1F5F9', padding: '16px', minHeight: '200px',
      }}>
        {/* SKU决策 */}
        {decisionMode === 'sku' && <SkuDecision />}

        {/* 店铺决策 */}
        {decisionMode === 'shop' && <ShopDecision />}

        {/* 投放决策（原有Legacy） */}
        {decisionMode === 'legacy' && (
          <LegacyPanel
            selectedProduct={selectedProduct}
            currentDayData={currentDayData}
            currentDay={currentDay}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            error={error}
            analysisSource={analysisSource}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            reportExpanded={reportExpanded}
            setReportExpanded={setReportExpanded}
            onGenerate={handleGenerateAnalysis}
            onExecute={handleConfirmExecute}
            onAbnormal={onAbnormal}
            getDecisionColor={getDecisionColor}
            getPhaseColor={getPhaseColor}
            renderReport={renderReport}
          />
        )}
      </div>
    </div>
  );
};

// ==================== Legacy投放决策面板（原有功能） ====================
const LegacyPanel = ({ selectedProduct, currentDayData, currentDay, analysis, isAnalyzing, error, analysisSource, activeTab, setActiveTab, reportExpanded, setReportExpanded, onGenerate, onExecute, onAbnormal, getDecisionColor, getPhaseColor, renderReport }) => {
  
  if (!selectedProduct) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '13px' }}>请先从左侧选择产品和Day</div>
      </div>
    );
  }

  if (!currentDayData || currentDayData.status === '未提交') {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📊</div>
        <div>Day {currentDay} 请先上传数据后再生成 AI 决策</div>
      </div>
    );
  }

  const isExecuted = currentDayData.status === '已执行';
  const showAnalysis = analysis || isAnalyzing;

  const TabButton = ({ id, icon, label, color }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
        background: activeTab === id ? `${color}15` : '#F8FAFC',
        color: activeTab === id ? color : '#94A3B8',
        fontSize: '11px', fontWeight: '600', cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >{icon} {label}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>
          Day {currentDay} {isExecuted ? '- 已执行' : ''}
        </span>
        <button
          onClick={onGenerate}
          disabled={isAnalyzing}
          style={{
            padding: '6px 16px', borderRadius: '8px', border: 'none',
            background: isAnalyzing ? '#94A3B8' : '#FF6B35', color: '#FFF',
            fontSize: '12px', fontWeight: '600', cursor: isAnalyzing ? 'not-allowed' : 'pointer',
          }}
        >
          {isAnalyzing ? '🔄 分析中...' : analysis?.full_report ? '🔄 重新分析' : '🧠 生成AI决策'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '10px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#EF4444', fontSize: '12px' }}>
          ⚠️ {error}
        </div>
      )}

      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '13px' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid rgba(255,107,53,0.2)', borderTopColor: '#FF6B35', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          千问 AI 正在分析...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* 决策摘要卡片 */}
      {analysis && !isAnalyzing && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            <div style={{ background: `${getPhaseColor(analysis.phase)}15`, border: `1px solid ${getPhaseColor(analysis.phase)}40`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}>阶段</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: getPhaseColor(analysis.phase) }}>阶段 {analysis.phase || 'A'}</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{analysis.phase_name}</div>
            </div>
            <div style={{ background: `${getDecisionColor(analysis.today_decision)}15`, border: `1px solid ${getDecisionColor(analysis.today_decision)}40`, borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}>今日判断</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: getDecisionColor(analysis.today_decision) }}>{analysis.today_decision}</div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>置信度 {analysis.confidence}%</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '4px' }}>补单策略</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>{analysis.supplement_strategy || '-'}</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <TabButton id="report" icon="📄" label="完整报告" color="#FF6B35" />
            <TabButton id="judgment" icon="📋" label="核心卡点" color="#3B82F6" />
            <TabButton id="strategy" icon="🎯" label="今日必做" color="#10B981" />
            <TabButton id="risk" icon="⚠️" label="风险提示" color="#EF4444" />
          </div>

          {/* Tab内容 */}
          {activeTab === 'report' && analysis.full_report && (
            <div style={{ maxHeight: '500px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
              {renderReport(analysis.full_report)}
            </div>
          )}
          {activeTab !== 'report' && (
            <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', fontSize: '12px', color: '#64748B' }}>
              详见完整分析报告
            </div>
          )}

          {/* 操作按钮 */}
          {!isExecuted && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={onExecute} style={{ flex: 1, padding: '10px', background: '#10B981', border: 'none', borderRadius: '10px', color: '#FFF', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>✓ 确认执行</button>
              <button onClick={onAbnormal} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid #FECACA', borderRadius: '10px', color: '#EF4444', fontSize: '13px', cursor: 'pointer' }}>上报异常</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AIDecisionPanel;
