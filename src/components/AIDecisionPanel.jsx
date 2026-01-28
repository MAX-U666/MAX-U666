import React, { useState } from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';

const AIDecisionPanel = ({ selectedProduct, currentDayData, currentDay, onExecute, onAbnormal, currentUser }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);

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
      onExecute(analysisResult.today_decision, analysisResult.key_bottlenecks?.join('; ') || '', analysisResult.confidence);
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

  const yesterdayData = selectedProduct?.daily_data?.find(d => d.day_number === currentDay - 1);

  const calcChange = (today, yesterday) => {
    if (!yesterday || yesterday === 0) return null;
    return ((today - yesterday) / yesterday * 100).toFixed(1);
  };

  // 【依据】面板
  const renderBasisPanel = () => {
    const adImpressions = currentDayData?.ad_impressions || 0;
    const adClicks = currentDayData?.ad_clicks || 0;
    const adOrders = currentDayData?.ad_orders || 0;
    const adSpend = currentDayData?.ad_spend || 0;
    const adRevenue = currentDayData?.ad_revenue || 0;
    const ctr = adImpressions > 0 ? (adClicks / adImpressions * 100).toFixed(2) : 0;
    const cvr = adClicks > 0 ? (adOrders / adClicks * 100).toFixed(2) : 0;
    const roi = adSpend > 0 ? (adRevenue / adSpend).toFixed(2) : 0;

    return (
      <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, color: '#3B82F6', fontSize: '14px' }}>📋 决策依据</h4>
          <button onClick={() => setActiveTab(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>当前阶段</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: getPhaseColor(analysisResult?.phase) }}>
              阶段 {analysisResult?.phase || '-'} <span style={{ fontSize: '12px', fontWeight: '400' }}>({analysisResult?.phase_name || '-'})</span>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', marginBottom: '4px' }}>阶段判定条件</div>
            <div style={{ fontSize: '12px', color: '#CBD5E1', lineHeight: '1.6' }}>
              {adImpressions < 5000 ? `曝光 ${adImpressions.toLocaleString()} < 5,000 → 阶段A` : 
               (adImpressions >= 20000 && roi >= 3) ? `曝光 ≥20,000 且 ROI≥3 → 阶段C` : 
               `曝光 ≥5,000 但未达C条件 → 阶段B`}
            </div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px' }}>关键指标</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {[
            { label: '广告曝光', value: adImpressions.toLocaleString(), color: '#F97316' },
            { label: 'CTR', value: `${ctr}%`, color: parseFloat(ctr) >= 1.5 ? '#10B981' : '#F59E0B' },
            { label: 'CVR', value: `${cvr}%`, color: parseFloat(cvr) >= 3 ? '#10B981' : '#F59E0B' },
            { label: 'ROI', value: roi, color: parseFloat(roi) >= 3 ? '#10B981' : '#EF4444' }
          ].map((item, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{item.label}</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>核心卡点分析</div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
          {analysisResult?.key_bottlenecks?.map((item, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#CBD5E1', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span style={{ color: '#F59E0B' }}>•</span> {item}
            </div>
          )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无分析</div>}
        </div>
      </div>
    );
  };

  // 【效果】面板
  const renderEffectPanel = () => {
    const metrics = [
      { label: '广告曝光', today: currentDayData?.ad_impressions || 0, yesterday: yesterdayData?.ad_impressions || 0 },
      { label: '广告点击', today: currentDayData?.ad_clicks || 0, yesterday: yesterdayData?.ad_clicks || 0 },
      { label: '广告单', today: currentDayData?.ad_orders || 0, yesterday: yesterdayData?.ad_orders || 0 },
      { label: '花费', today: currentDayData?.ad_spend || 0, yesterday: yesterdayData?.ad_spend || 0, format: 'money' },
      { label: '收入', today: currentDayData?.ad_revenue || 0, yesterday: yesterdayData?.ad_revenue || 0, format: 'money' },
      { label: 'ROI', today: currentDayData?.roi || 0, yesterday: yesterdayData?.roi || 0, format: 'decimal' }
    ];

    const overallTrend = () => {
      const roiChange = calcChange(currentDayData?.roi || 0, yesterdayData?.roi || 0);
      const impressionChange = calcChange(currentDayData?.ad_impressions || 0, yesterdayData?.ad_impressions || 0);
      if (!roiChange && !impressionChange) return { text: '无昨日数据对比', color: '#64748B', icon: '➖' };
      if (parseFloat(roiChange) > 0 && parseFloat(impressionChange) > 0) return { text: '数据向好', color: '#10B981', icon: '📈' };
      if (parseFloat(roiChange) < -10 || parseFloat(impressionChange) < -20) return { text: '数据恶化', color: '#EF4444', icon: '📉' };
      return { text: '数据持平', color: '#F59E0B', icon: '➡️' };
    };

    const trend = overallTrend();

    return (
      <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, color: '#10B981', fontSize: '14px' }}>📊 效果对比</h4>
          <button onClick={() => setActiveTab(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        <div style={{ background: `${trend.color}20`, border: `1px solid ${trend.color}40`, borderRadius: '8px', padding: '12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{trend.icon}</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: trend.color }}>{trend.text}</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>对比昨日(Day {currentDay - 1})数据</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {metrics.map((m, i) => {
            const change = calcChange(m.today, m.yesterday);
            const isUp = change && parseFloat(change) > 0;
            const isDown = change && parseFloat(change) < 0;
            const formatValue = (v, fmt) => {
              if (fmt === 'money') return `Rp${(v/1000).toFixed(0)}k`;
              if (fmt === 'decimal') return parseFloat(v).toFixed(2);
              return v.toLocaleString();
            };
            return (
              <div key={i} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '6px' }}>{m.label}</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#E2E8F0', marginBottom: '4px' }}>{formatValue(m.today, m.format)}</div>
                <div style={{ fontSize: '11px', color: isUp ? '#10B981' : isDown ? '#EF4444' : '#64748B' }}>
                  {change ? `${isUp ? '↑' : '↓'} ${Math.abs(parseFloat(change))}%` : '- 无对比'}
                  <span style={{ color: '#475569', marginLeft: '4px' }}>vs {formatValue(m.yesterday, m.format)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 【风险】面板
  const renderRiskPanel = () => {
    const roi = currentDayData?.ad_spend > 0 ? (currentDayData.ad_revenue / currentDayData.ad_spend) : 0;
    const risks = [];
    
    if (roi > 0 && roi < 2) {
      risks.push({ level: '严重', text: `ROI=${roi.toFixed(2)} 严重低于盈亏线，建议立即止损`, color: '#EF4444' });
    } else if (roi > 0 && roi < 3) {
      risks.push({ level: '警告', text: `ROI=${roi.toFixed(2)} 未达目标线3.0，需收缩防守`, color: '#F59E0B' });
    }
    
    if ((currentDayData?.ad_impressions || 0) > 20000 && (currentDayData?.ad_orders || 0) < 5) {
      risks.push({ level: '警告', text: '高曝光低转化，可能进入泛流量池', color: '#F59E0B' });
    }
    
    if (risks.length === 0) {
      risks.push({ level: '正常', text: '当前无明显风险', color: '#10B981' });
    }

    return (
      <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, color: '#EF4444', fontSize: '14px' }}>⚠️ 风险提示</h4>
          <button onClick={() => setActiveTab(null)} style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '18px' }}>×</button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>风险检测</div>
          {risks.map((r, i) => (
            <div key={i} style={{ background: `${r.color}15`, border: `1px solid ${r.color}40`, borderRadius: '8px', padding: '10px 12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ background: r.color, color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' }}>{r.level}</span>
              <span style={{ fontSize: '12px', color: '#CBD5E1' }}>{r.text}</span>
            </div>
          ))}
        </div>

        <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>禁止操作</div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px' }}>
          {analysisResult?.not_to_do?.map((item, i) => (
            <div key={i} style={{ fontSize: '12px', color: '#F87171', marginBottom: '6px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <span>❌</span> {item}
            </div>
          )) || <div style={{ color: '#64748B', fontSize: '12px' }}>暂无禁止操作</div>}
        </div>

        <div style={{ marginTop: '12px', fontSize: '12px', color: '#94A3B8', marginBottom: '8px' }}>熔断规则</div>
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#94A3B8', lineHeight: '1.8' }}>
          • ROI &lt; 2 → 立即止损<br/>
          • ROI &lt; 3 → 收缩防守<br/>
          • 近72h调价 → 暂缓补单<br/>
          • 高曝光+低CVR → 判定泛流量池
        </div>
      </div>
    );
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

  // 已执行
  if (currentDayData.status === '已执行') {
    return (
      <div style={styles.card}>
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '18px' }}>✓</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>Day {currentDay} AI决策 - 已执行</span>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '8px' }}>{currentDayData.ai_action || '维持观察'}</div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>{currentDayData.ai_reason}</div>
        </div>
      </div>
    );
  }

  // 主界面
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
            <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: analysisSource === 'qwen-max' ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.2)', color: analysisSource === 'qwen-max' ? '#A78BFA' : '#94A3B8' }}>
              {analysisSource === 'qwen-max' ? '🤖 千问' : '📋 规则'}
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
            {/* 决策卡片 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'stretch', marginBottom: '16px' }}>
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
              <div style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>24h观察</div>
                <div style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'left' }}>
                  {analysisResult.observation_focus?.slice(0, 2).map((item, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>⏰ {item.length > 15 ? item.slice(0, 15) + '...' : item}</div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '100px' }}>
                <button onClick={handleConfirmExecute} style={{ flex: 1, padding: '12px 16px', background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>✓ 确认执行</button>
                <button onClick={onAbnormal} style={{ flex: 1, padding: '12px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#EF4444', fontSize: '13px', cursor: 'pointer' }}>上报异常</button>
              </div>
            </div>

            {/* 溯源按钮 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => setActiveTab(activeTab === 'basis' ? null : 'basis')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: activeTab === 'basis' ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)', background: activeTab === 'basis' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', color: activeTab === 'basis' ? '#3B82F6' : '#94A3B8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>📋 依据</button>
              <button onClick={() => setActiveTab(activeTab === 'effect' ? null : 'effect')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: activeTab === 'effect' ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)', background: activeTab === 'effect' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', color: activeTab === 'effect' ? '#10B981' : '#94A3B8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>📊 效果</button>
              <button onClick={() => setActiveTab(activeTab === 'risk' ? null : 'risk')} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: activeTab === 'risk' ? '1px solid #EF4444' : '1px solid rgba(255,255,255,0.1)', background: activeTab === 'risk' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', color: activeTab === 'risk' ? '#EF4444' : '#94A3B8', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>⚠️ 风险</button>
            </div>

            {/* 溯源面板 */}
            {activeTab === 'basis' && renderBasisPanel()}
            {activeTab === 'effect' && renderEffectPanel()}
            {activeTab === 'risk' && renderRiskPanel()}

            {/* 默认显示系统判断 */}
            {!activeTab && (
              <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <div style={{ fontWeight: '700', color: '#FF6B35', marginBottom: '12px', fontSize: '13px' }}>🧠 系统判断</div>
                <p style={{ margin: 0, fontSize: '12px', color: '#CBD5E1', lineHeight: '1.8' }}>
  {typeof analysisResult.system_judgment === 'string' 
    ? analysisResult.system_judgment 
    : analysisResult.system_judgment?.judgment || JSON.stringify(analysisResult.system_judgment)}
</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AIDecisionPanel;
