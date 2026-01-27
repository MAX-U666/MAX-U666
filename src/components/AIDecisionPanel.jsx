import React, { useState } from 'react';
import { MiniLogo } from './Logo';
import { styles } from '../styles/theme';

/**
 * AI 决策面板组件 - 方案C 上下结构
 */
const AIDecisionPanel = ({ 
  selectedProduct, 
  currentDayData, 
  currentDay,
  onExecute, 
  onAbnormal,
  currentUser 
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisSource, setAnalysisSource] = useState(null);
  const [error, setError] = useState(null);

  // 生成 AI 分析
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

  // 确认执行
  const handleConfirmExecute = () => {
    if (analysisResult) {
      onExecute(
        analysisResult.decision, 
        analysisResult.core_issue, 
        analysisResult.confidence
      );
    }
  };

  // 获取决策颜色
  const getDecisionColor = (decision) => {
    switch (decision) {
      case '加大投放': return '#10B981';
      case '维持观察': return '#3B82F6';
      case '收缩防守': return '#F59E0B';
      case '暂停止损': return '#EF4444';
      default: return '#64748B';
    }
  };

  // 获取阶段颜色
  const getPhaseColor = (phase) => {
    switch (phase) {
      case 'A': return '#F59E0B';
      case 'B': return '#3B82F6';
      case 'C': return '#10B981';
      default: return '#64748B';
    }
  };

  // 如果数据未提交
  if (!currentDayData || currentDayData.status === '未提交') {
    return (
      <div style={styles.card}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
          padding: '16px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)' 
        }}>
          <div style={{ 
            width: '36px', height: '36px', 
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 
            borderRadius: '10px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <MiniLogo size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>
            Day {currentDay} AI决策
          </span>
        </div>
        <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p>请先上传数据后再生成 AI 决策</p>
        </div>
      </div>
    );
  }

  // 如果已执行
  if (currentDayData.status === '已执行') {
    return (
      <div style={styles.card}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
          padding: '16px 20px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)' 
        }}>
          <div style={{ 
            width: '36px', height: '36px', 
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
            borderRadius: '10px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <span style={{ color: '#fff', fontSize: '18px' }}>✓</span>
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>
            Day {currentDay} AI决策 - 已执行
          </span>
        </div>
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#10B981', marginBottom: '8px' }}>
            {currentDayData.ai_action || '维持观察'}
          </div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            {currentDayData.ai_reason}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      {/* 标题栏 */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '36px', height: '36px', 
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)', 
            borderRadius: '10px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <MiniLogo size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: '#E2E8F0' }}>
            Day {currentDay} AI决策
          </span>
          {analysisSource && (
            <span style={{ 
              fontSize: '10px', 
              padding: '4px 8px', 
              borderRadius: '4px',
              background: analysisSource === 'qwen' ? 'rgba(139,92,246,0.2)' : 'rgba(100,116,139,0.2)',
              color: analysisSource === 'qwen' ? '#A78BFA' : '#94A3B8'
            }}>
              {analysisSource === 'qwen' ? '🤖 千问AI' : '📋 规则引擎'}
            </span>
          )}
        </div>
        
        {!analysisResult && (
          <button 
            onClick={handleGenerateAnalysis}
            disabled={isAnalyzing}
            style={{ 
              ...styles.buttonPrimary, 
              opacity: isAnalyzing ? 0.7 : 1,
              cursor: isAnalyzing ? 'wait' : 'pointer'
            }}
          >
            {isAnalyzing ? '🔄 分析中...' : '🧠 生成AI决策'}
          </button>
        )}
      </div>

      {/* 内容区 */}
      <div style={{ padding: '20px' }}>
        {/* 错误提示 */}
        {error && (
          <div style={{ 
            padding: '12px 16px', 
            background: 'rgba(239,68,68,0.1)', 
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#F87171',
            fontSize: '13px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* 未生成分析时的提示 */}
        {!analysisResult && !isAnalyzing && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <MiniLogo size={48} color="#FF6B35" />
            <p style={{ marginTop: '16px', fontSize: '14px' }}>
              点击「生成AI决策」获取智能分析
            </p>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#475569' }}>
              基于千问大模型 + GMV MAX 专家策略
            </p>
          </div>
        )}

        {/* 分析中 */}
        {isAnalyzing && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
            <div style={{ 
              width: '48px', height: '48px', 
              border: '3px solid rgba(255,107,53,0.2)',
              borderTopColor: '#FF6B35',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ fontSize: '14px' }}>AI 正在分析数据...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* 分析结果 - 方案C 上下结构 */}
        {analysisResult && (
          <>
            {/* 上部：执行卡片 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr 1fr auto', 
              gap: '12px', 
              alignItems: 'stretch', 
              marginBottom: '20px' 
            }}>
              {/* 当前阶段 */}
              <div style={{ 
                background: `${getPhaseColor(analysisResult.phase)}15`, 
                border: `1px solid ${getPhaseColor(analysisResult.phase)}40`, 
                borderRadius: '12px', 
                padding: '16px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>当前阶段</div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: getPhaseColor(analysisResult.phase) 
                }}>
                  阶段 {analysisResult.phase}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                  {analysisResult.phase_name}
                </div>
              </div>

              {/* 今日判断 */}
              <div style={{ 
                background: `${getDecisionColor(analysisResult.decision)}15`, 
                border: `1px solid ${getDecisionColor(analysisResult.decision)}40`, 
                borderRadius: '12px', 
                padding: '16px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>今日判断</div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: '700', 
                  color: getDecisionColor(analysisResult.decision) 
                }}>
                  {analysisResult.decision}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px' }}>
                  置信度 {analysisResult.confidence}%
                </div>
              </div>

              {/* 补单建议 */}
              <div style={{ 
                background: 'rgba(139,92,246,0.1)', 
                border: '1px solid rgba(139,92,246,0.3)', 
                borderRadius: '12px', 
                padding: '16px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>补单建议</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#8B5CF6' }}>
                  {analysisResult.supplement_strategy}
                </div>
              </div>

              {/* 禁止操作 */}
              <div style={{ 
                background: 'rgba(239,68,68,0.1)', 
                border: '1px solid rgba(239,68,68,0.3)', 
                borderRadius: '12px', 
                padding: '16px', 
                textAlign: 'center' 
              }}>
                <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '8px' }}>⚠️ 禁止操作</div>
                <div style={{ fontSize: '12px', color: '#EF4444', lineHeight: '1.6' }}>
                  {analysisResult.forbidden_actions?.slice(0, 2).map((action, i) => (
                    <div key={i}>• {action}</div>
                  ))}
                </div>
              </div>

              {/* 操作按钮 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={handleConfirmExecute}
                  style={{ 
                    flex: 1, 
                    padding: '0 24px', 
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', 
                    border: 'none', 
                    borderRadius: '10px', 
                    color: '#fff', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                >
                  ✓ 确认执行
                </button>
                <button 
                  onClick={onAbnormal}
                  style={{ 
                    flex: 1, 
                    padding: '0 24px', 
                    background: 'transparent', 
                    border: '1px solid rgba(239,68,68,0.3)', 
                    borderRadius: '10px', 
                    color: '#EF4444', 
                    fontSize: '13px', 
                    cursor: 'pointer' 
                  }}
                >
                  上报异常
                </button>
              </div>
            </div>

            {/* 下部：完整AI报告 */}
            <div style={{ 
              padding: '20px', 
              background: 'rgba(0,0,0,0.2)', 
              borderRadius: '12px' 
            }}>
              <div style={{ 
                fontWeight: '700', 
                color: '#FF6B35', 
                marginBottom: '16px', 
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🧠 AI 完整分析报告
                <span style={{ 
                  fontSize: '10px', 
                  color: '#64748B', 
                  fontWeight: '400' 
                }}>
                  | 核心卡点: {analysisResult.core_issue}
                </span>
              </div>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '16px' 
              }}>
                {/* 系统放量判断 */}
                <div style={{ 
                  background: 'rgba(59,130,246,0.1)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  border: '1px solid rgba(59,130,246,0.2)'
                }}>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#3B82F6', 
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    【系统放量判断】
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#CBD5E1',
                    lineHeight: '1.6'
                  }}>
                    {analysisResult.analysis?.system_judgment || '暂无分析'}
                  </p>
                </div>

                {/* 核心卡点分析 */}
                <div style={{ 
                  background: 'rgba(245,158,11,0.1)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  border: '1px solid rgba(245,158,11,0.2)'
                }}>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#F59E0B', 
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    【核心卡点分析】
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#CBD5E1',
                    lineHeight: '1.6'
                  }}>
                    {analysisResult.analysis?.bottleneck_analysis || '暂无分析'}
                  </p>
                </div>

                {/* 补单策略判断 */}
                <div style={{ 
                  background: 'rgba(139,92,246,0.1)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  border: '1px solid rgba(139,92,246,0.2)'
                }}>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#8B5CF6', 
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    【补单策略判断】
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#CBD5E1',
                    lineHeight: '1.6'
                  }}>
                    {analysisResult.analysis?.supplement_analysis || '暂无分析'}
                  </p>
                </div>
              </div>

              {/* 第二行：信号方向 + 观察重点 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '16px',
                marginTop: '12px'
              }}>
                <div style={{ 
                  background: 'rgba(16,185,129,0.1)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  border: '1px solid rgba(16,185,129,0.2)'
                }}>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#10B981', 
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    【信号强化方向】
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#CBD5E1',
                    lineHeight: '1.6'
                  }}>
                    {analysisResult.analysis?.signal_direction || '暂无建议'}
                  </p>
                </div>

                <div style={{ 
                  background: 'rgba(100,116,139,0.1)', 
                  borderRadius: '10px', 
                  padding: '14px',
                  border: '1px solid rgba(100,116,139,0.2)'
                }}>
                  <div style={{ 
                    fontWeight: '700', 
                    color: '#94A3B8', 
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}>
                    【24-48小时观察重点】
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#CBD5E1',
                    lineHeight: '1.6'
                  }}>
                    {analysisResult.analysis?.observation_focus || '暂无建议'}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIDecisionPanel;
