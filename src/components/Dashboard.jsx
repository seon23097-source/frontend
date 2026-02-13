import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import EvaluationManager from './EvaluationManager';
import { categoriesAPI, studentsAPI, removeToken } from '../utils/api';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', max_score: 100 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [categoriesData, studentsData] = await Promise.all([
        categoriesAPI.getAll(),
        studentsAPI.getAll()
      ]);
      setCategories(categoriesData);
      setStudents(studentsData);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    if (!newCategory.name.trim()) {
      alert('카테고리 이름을 입력해주세요.');
      return;
    }

    if (newCategory.max_score <= 0) {
      alert('만점은 0보다 커야 합니다.');
      return;
    }

    try {
      const created = await categoriesAPI.create(newCategory);
      setCategories([...categories, created]);
      setNewCategory({ name: '', max_score: 100 });
      setShowCategoryModal(false);
      navigate(`/category/${created.id}`);
    } catch (error) {
      alert(error.message || '카테고리 생성에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      removeToken();
      window.location.href = '/login';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <h1 className="dashboard-title">학생 평가 관리</h1>
            <button onClick={handleLogout} className="btn btn-outline">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">
              <h2>평가 카테고리</h2>
              <button 
                className="btn-icon"
                onClick={() => setShowCategoryModal(true)}
                title="새 카테고리 추가"
              >
                +
              </button>
            </div>

            <nav className="category-nav">
              {categories.length === 0 ? (
                <div className="empty-state">
                  <p>카테고리가 없습니다</p>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowCategoryModal(true)}
                  >
                    첫 카테고리 만들기
                  </button>
                </div>
              ) : (
                categories.map(category => (
                  <button
                    key={category.id}
                    className="category-nav-item"
                    onClick={() => navigate(`/category/${category.id}`)}
                  >
                    <span className="category-name">{category.name}</span>
                    <span className="category-max-score">{category.max_score}점</span>
                  </button>
                ))
              )}
            </nav>
          </div>

          <div className="sidebar-footer">
            <div className="student-count">
              총 학생 수: <strong>{students.length}명</strong>
            </div>
          </div>
        </aside>

        <main className="dashboard-main">
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="welcome-screen">
                  <div className="welcome-content">
                    <h2>환영합니다!</h2>
                    <p>
                      {categories.length === 0 
                        ? '왼쪽 사이드바에서 평가 카테고리를 생성해주세요.'
                        : '왼쪽 사이드바에서 평가 카테고리를 선택하세요.'}
                    </p>
                  </div>
                </div>
              } 
            />
            <Route 
              path="/category/:categoryId" 
              element={
                <EvaluationManager 
                  students={students}
                  categories={categories}
                  onCategoryUpdate={loadData}
                />
              } 
            />
          </Routes>
        </main>
      </div>

      {/* 카테고리 생성 모달 */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>새 평가 카테고리</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCategoryModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="modal-form">
              <div className="form-group">
                <label className="label">카테고리 이름</label>
                <input
                  type="text"
                  className="input"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  placeholder="예: 줄넘기, 받아쓰기, 수학단원평가"
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">만점</label>
                <input
                  type="number"
                  className="input"
                  value={newCategory.max_score}
                  onChange={(e) => setNewCategory({...newCategory, max_score: parseInt(e.target.value) || 0})}
                  placeholder="100"
                  min="1"
                  required
                />
                <p className="hint">평가의 만점 기준을 입력하세요 (예: 받아쓰기 10점, 수학 100점)</p>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setShowCategoryModal(false)}
                >
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
