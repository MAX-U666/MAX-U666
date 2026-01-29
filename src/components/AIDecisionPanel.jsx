import React, { useState } from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';

const AIDecisionPanel = ({ selectedProduct, currentDayData, currentDay, onExecute, onAbnormal, currentUser }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('judgment');

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
        analysisResult // 传递完整分析结果
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

  // 获取分析数据（从当前结果或历史记录）
  const getAnalysisData = () => {
    if (analysisResult) return analysisResult;
    if (currentDayData?.ai_full_analysis) return currentDayData.ai_full_analysis;
    return null;
  };

  const analysis = getAnalysisData();

  // Tab 按钮样式
  const TabButton = ({ id, icon, label, color }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        flex: 1,
        padding: '10px 8px',
        borderRadius: '8px',
        border: activeTab === id ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.1)',
        background: activeTab === id ? `${color}15` : 'rgba(255,255,255,0.03)',
        color: activeTab === id ? color : '#94A3B8',
        fontSize: '12px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s'
      }}
    >
      {icon} {label}
    </button>
  );

  // 渲染系统判断 Tab
  const renderJudgmentTab = () => (
    <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#3B82F6', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        📋 系统放量判断
      </h4>
      
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: '1.8' }}>
          {typeof analysis?.system_judgment === 'string' 
            ? analysis.system_judgment 
            : analysis?.system_judgment?.judgment || '暂无分析'}
        </p>
      </div>

      <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>🔍 核心卡点</h5>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
        {analysis?.key_bottlenecks?.map((item, i) => (
          <div key={i} style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span style={{ color: '#F59E0B' }}>•</span> {item}
          </div>
        )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无卡点分析</div>}
      </div>
    </div>
  );

  // 渲染执行策略 Tab
  const renderStrategyTab = () => (
    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#10B981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🎯 执行策略
      </h4>
      
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#10B981', fontSize: '12px' }}>补单策略</h5>
        <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: '1.8' }}>
          {analysis?.manual_signal_judgment || '暂无补单建议'}
        </p>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
        <h5 style={{ margin: '0 0 8px 0', color: '#10B981', fontSize: '12px' }}>信号强化</h5>
        <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: '1.8' }}>
          {analysis?.signal_enhancement || '暂无建议'}
        </p>
      </div>

      <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>✅ 今日必做</h5>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
        {analysis?.execution_checklist?.map((item, i) => (
          <div key={i} style={{ fontSize: '12px', color: '#10B981', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span>✓</span> {item}
          </div>
        )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无执行清单</div>}
      </div>
    </div>
  );

  // 渲染风险提示 Tab
  const renderRiskTab = () => (
    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '20px' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#EF4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        ⚠️ 风险提示
      </h4>
      
      <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>❌ 禁止操作</h5>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
        {analysis?.not_to_do?.map((item, i) => (
          <div key={i} style={{ fontSize: '12px', color: '#F87171', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span>❌</span> {item}
          </div>
        )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无禁止操作</div>}
      </div>

      <h5 style={{ margin: '0 0 12px 0', color: '#94A3B8', fontSize: '12px' }}>👀 观察重点</h5>
      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
        {analysis?.observation_focus?.map((item, i) => (
          <div key={i} style={{ fontSize: '12px', color: '#FBBF24', marginBottom: '8px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <span>⏰</span> {item}
          </div>
        )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无观察重点</div>}
      </div>
    </div>
  );

  // 渲染印尼专项 Tab
  const renderIdnTab = () => (
    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: '12px', padding: '20px', backgroundImage: 'linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(255,255,255,0.05) 100%)' }}>
      <h4 style={{ margin: '0 0 16px 0', color: '#EF4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🇮🇩 印尼市场专项
      </h4>
      
      {analysis?.idn_enhancement ? (
        <>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            <h5 style={{ margin: '0 0 8px 0', color: '#FBBF24', fontSize: '12px' }}>💡 关键洞察</h5>
            <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: '1.8' }}>
              {analysis.idn_enhancement.key_insight || '暂无'}
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
            <h5 style={{ margin: '0 0 8px 0', color: '#60A5FA', fontSize: '12px' }}>📦 物流建议</h5>
            <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: '1.8' }}>
              {analysis.idn_enhancement.logistics_note || '暂无'}
            </p>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '16px' }}>
            <h5 style={{ margin: '0 0 8px 0', color: '#34D399', fontSize: '12px' }}>🌏 本地化提示</h5>
            <p style={{ margin: 0, fontSize: '13px', color: '#E2E8F0', lineHeight: '1.8' }}>
              {analysis.idn_enhancement.localization_tip || '暂无'}
            </p>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
          暂无印尼专项分析
        </div>
      )}
    </div>
  );

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

  // 已执行状态 - 显示历史分析
  if (currentDayData.status === '已执行') {
    return (
      <div style={styles.card}>
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '18px' }}>✓</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>Day {currentDay} AI决策 - 已执行</span>
        </div>
        
        <div style={{ padding: '20px' }}>
          {/* 执行结果摘要 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            <div style={{ background: `${getPhaseColor(currentDayData.phase)}15`, border: `1px solid ${getPhaseColor(currentDayData.phase)}40`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>阶段</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: getPhaseColor(currentDayData.phase) }}>阶段 {currentDayData.phase || 'A'}</div>
            </div>
            <div style={{ background: `${getDecisionColor(currentDayData.ai_action)}15`, border: `1px solid ${getDecisionColor(currentDayData.ai_action)}40`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>执行决策</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: getDecisionColor(currentDayData.ai_action) }}>{currentDayData.ai_action || '维持观察'}</div>
            </div>
            <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>置信度</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: '#A78BFA' }}>{currentDayData.ai_confidence || 70}%</div>
            </div>
            <div style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>ROI</div>
              <div style={{ fontSize: '18px', fontWeight: '700', color: (currentDayData.roi || 0) >= 3 ? '#10B981' : '#F59E0B' }}>{currentDayData.roi || '-'}</div>
            </div>
          </div>

          {/* Tab 切换 */}
          {analysis && (
            <>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <TabButton id="judgment" icon="📋" label="系统判断" color="#3B82F6" />
                <TabButton id="strategy" icon="🎯" label="执行策略" color="#10B981" />
                <TabButton id="risk" icon="⚠️" label="风险提示" color="#EF4444" />
                <TabButton id="idn" icon="🇮🇩" label="印尼专项" color="#EF4444" />
              </div>

              {activeTab === 'judgment' && renderJudgmentTab()}
              {activeTab === 'strategy' && renderStrategyTab()}
              {activeTab === 'risk' && renderRiskTab()}
              {activeTab === 'idn' && renderIdnTab()}
            </>
          )}

          {!analysis && (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748B' }}>
              <p>此决策无详细分析记录</p>
              <p style={{ fontSize: '12px' }}>原因：{currentDayData.ai_reason || '无'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 待决策状态 - 主界面
  return (
    <div style={styles.card}>
      {/* 标题栏 */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MiniLogo size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>Day {currentDay} AI决策</span>
          {analysisSource && (
            <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: analysisSource === 'qwen-turbo' ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.2)', color: analysisSource === 'qwen-turbo' ? '#A78BFA' : '#94A3B8' }}>
              {analysisSource === 'qwen-turbo' ? '🤖 千问' : '📋 规则'}
            </span>
          )}
        </div>
        {!analysisResult && (
          <button onClick={handleGenerateAnalysis} disabled={isAnalyzing} style={{ ...styles.buttonPrimary, opacity: isAnalyzing ? 0.7 : 1 }}>
            {isAnalyzing ? '🔄 分析中...' : '🧠 生成AI决策'}
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
        {!analysisResult && !isAnalyzing && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <MiniLogo size={48} color="#FF6B35" />
            <p style={{ marginTop: '16px', fontSize: '14px' }}>点击「生成AI决策」获取智能分析</p>
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

        {/* 分析结果 */}
        {analysisResult && (
          <>
            {/* 决策摘要卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: `${getPhaseColor(analysisResult.phase)}15`, border: `1px solid ${getPhaseColor(analysisResult.phase)}40`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>当前阶段</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: getPhaseColor(analysisResult.phase) }}>阶段 {analysisResult.phase}</div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>{analysisResult.phase_name}</div>
              </div>
              <div style={{ background: `${getDecisionColor(analysisResult.today_decision)}15`, border: `1px solid ${getDecisionColor(analysisResult.today_decision)}40`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>今日判断</div>
                <div style={{ fontSize: '20px', fontWeight: '700', color: getDecisionColor(analysisResult.today_decision) }}>{analysisResult.today_decision}</div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>置信度 {analysisResult.confidence}%</div>
              </div>
              <div style={{ background: `${getSupplementColor(analysisResult.supplement_strategy)}15`, border: `1px solid ${getSupplementColor(analysisResult.supplement_strategy)}40`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>补单策略</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: getSupplementColor(analysisResult.supplement_strategy) }}>{analysisResult.supplement_strategy}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={handleConfirmExecute} style={{ flex: 1, padding: '12px 16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✓ 确认执行</button>
                <button onClick={onAbnormal} style={{ flex: 1, padding: '12px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#EF4444', fontSize: '13px', cursor: 'pointer' }}>上报异常</button>
              </div>
            </div>

            {/* Tab 切换 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <TabButton id="judgment" icon="📋" label="系统判断" color="#3B82F6" />
              <TabButton id="strategy" icon="🎯" label="执行策略" color="#10B981" />
              <TabButton id="risk" icon="⚠️" label="风险提示" color="#EF4444" />
              <TabButton id="idn" icon="🇮🇩" label="印尼专项" color="#EF4444" />
            </div>

            {/* Tab 内容 */}
            {activeTab === 'judgment' && renderJudgmentTab()}
            {activeTab === 'strategy' && renderStrategyTab()}
            {activeTab === 'risk' && renderRiskTab()}
            {activeTab === 'idn' && renderIdnTab()}
          </>
        )}
      </div>
    </div>
  );
};

export default AIDecisionPanel;
