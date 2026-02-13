import React, { useState } from 'react';
import { authAPI, saveToken } from '../utils/api';
import './Setup.css';

function Setup({ onComplete }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.setup(password);
      alert('비밀번호가 설정되었습니다. 로그인해주세요.');
      onComplete();
    } catch (err) {
      setError(err.message || '비밀번호 설정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-card fade-in">
        <div className="setup-header">
          <h1>학생 평가 관리 시스템</h1>
          <p>시스템을 사용하기 위한 비밀번호를 설정해주세요</p>
        </div>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label className="label">비밀번호</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="label">비밀번호 확인</label>
            <input
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? '설정 중...' : '비밀번호 설정'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Setup;
