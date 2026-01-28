import React, { useState } from 'react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '48px 40px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 40px rgba(255,107,53,0.3)'
          }}>
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <path d="M20 80 L20 35 Q20 20 35 20 L50 20 L50 40 L40 40 Q35 40 35 45 L35 80 Z" fill="white"/>
              <path d="M55 80 L55 20 L90 20 L90 35 L70 35 L70 42 L85 42 L85 57 L70 57 L70 65 L90 65 L90 80 Z" fill="white"/>
              <circle cx="75" cy="50" r="8" fill="#FF6B35"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '800',
            color: '#E2E8F0',
            margin: '0 0 8px 0',
            letterSpacing: '-0.5px'
          }}>
            GMV MAX
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#64748B',
            margin: 0
          }}>
            智能广告决策中枢
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
              marginBottom: '20px',
              color: '#F87171',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#94A3B8',
              marginBottom: '8px'
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#E2E8F0',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FF6B35';
                e.target.style.background = 'rgba(255,107,53,0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#94A3B8',
              marginBottom: '8px'
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#E2E8F0',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#FF6B35';
                e.target.style.background = 'rgba(255,107,53,0.05)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading 
                ? 'rgba(255,107,53,0.5)' 
                : 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,53,0.4)'
            }}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        {/* 底部信息 */}
        <div style={{
          marginTop: '32px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#475569'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Powered by <span style={{ color: '#FF6B35' }}>千问 qwen-max</span>
          </p>
          <p style={{ margin: 0 }}>
            © 2026 ClawdMax. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
