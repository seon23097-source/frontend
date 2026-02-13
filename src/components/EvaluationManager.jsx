import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { evaluationsAPI, categoriesAPI } from '../utils/api';
import StudentDetail from './StudentDetail';
import './EvaluationManager.css';

function EvaluationManager({ students, categories, onCategoryUpdate }) {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dates, setDates] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [inputDate, setInputDate] = useState('');

  useEffect(() => {
    if (categoryId) {
      loadCategoryData();
    }
  }, [categoryId]);

  const loadCategoryData = async () => {
    setLoading(true);
    try {
      const cat = categories.find(c => c.id === parseInt(categoryId));
      setCategory(cat);

      const evals = await evaluationsAPI.getByCategory(categoryId);
      setEvaluations(evals);
      
      // 날짜 목록 추출 (최신순)
      const uniqueDates = [...new Set(evals.map(e => e.evaluation_date))]
        .sort((a, b) => new Date(b) - new Date(a));
      setDates(uniqueDates);
    } catch (error) {
      console.error('평가 데이터 로드 실패:', error);
      alert('평가 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getScore = (studentId, date) => {
    return evaluations.find(
      e => e.student_id === studentId && e.evaluation_date === date
    );
  };

  const getAverage = (studentId) => {
    const studentEvals = evaluations.filter(e => e.student_id === studentId);
    if (studentEvals.length === 0) return null;
    
    const sum = studentEvals.reduce((acc, e) => acc + parseFloat(e.score), 0);
    return (sum / studentEvals.length).toFixed(1);
  };

  const getMinMaxScores = (studentId) => {
    const studentEvals = evaluations.filter(e => e.student_id === studentId);
    if (studentEvals.length === 0) return { min: null, max: null };
    
    const scores = studentEvals.map(e => parseFloat(e.score));
    return {
      min: Math.min(...scores),
      max: Math.max(...scores)
    };
  };

  const handleCellClick = (studentId, date) => {
    const existingScore = getScore(studentId, date);
    setEditingCell({ studentId, date });
    setInputValue(existingScore ? existingScore.score : '');
    setInputDate(date);
  };

  const handleAddNewDate = () => {
    const today = new Date().toISOString().split('T')[0];
    setDates([today, ...dates]);
  };

  const handleDateChange = (oldDate, newDate) => {
    const index = dates.indexOf(oldDate);
    if (index > -1) {
      const newDates = [...dates];
      newDates[index] = newDate;
      setDates(newDates.sort((a, b) => new Date(b) - new Date(a)));
      setInputDate(newDate);
    }
  };

  const handleSaveScore = async () => {
    if (!editingCell) return;

    const { studentId, date } = editingCell;
    const score = parseFloat(inputValue);

    if (isNaN(score) || score < 0 || score > category.max_score) {
      alert(`점수는 0에서 ${category.max_score} 사이여야 합니다.`);
      return;
    }

    try {
      const existingScore = getScore(studentId, date);
      
      if (existingScore) {
        // 수정
        await evaluationsAPI.update(existingScore.id, {
          score,
          evaluation_date: inputDate
        });
      } else {
        // 새로 생성
        await evaluationsAPI.create({
          student_id: studentId,
          category_id: parseInt(categoryId),
          score,
          evaluation_date: inputDate
        });
      }

      await loadCategoryData();
      setEditingCell(null);
      setInputValue('');
    } catch (error) {
      alert(error.message || '점수 저장에 실패했습니다.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveScore();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setInputValue('');
    }
  };

  const handleDeleteCategory = async () => {
    if (!confirm(`'${category.name}' 카테고리를 삭제하시겠습니까?\n평가 기록이 있으면 삭제할 수 없습니다.`)) {
      return;
    }

    try {
      await categoriesAPI.delete(categoryId);
      alert('카테고리가 삭제되었습니다.');
      onCategoryUpdate();
      window.location.href = '/';
    } catch (error) {
      alert(error.message || '카테고리 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="evaluation-loading">
        <div className="spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="evaluation-error">
        <p>카테고리를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="evaluation-manager">
      <div className="evaluation-header">
        <div>
          <h2>{category.name}</h2>
          <p className="category-info">만점: {category.max_score}점</p>
        </div>
        <div className="evaluation-actions">
          <button className="btn btn-primary" onClick={handleAddNewDate}>
            + 새 평가 추가
          </button>
          <button className="btn btn-danger" onClick={handleDeleteCategory}>
            카테고리 삭제
          </button>
        </div>
      </div>

      <div className="evaluation-table-container">
        <table className="evaluation-table">
          <thead>
            <tr>
              <th className="th-sticky">이름</th>
              <th className="th-sticky">평균</th>
              {dates.map(date => (
                <th key={date}>
                  <input
                    type="date"
                    className="date-input"
                    value={date}
                    onChange={(e) => handleDateChange(date, e.target.value)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map(student => {
              const avg = getAverage(student.id);
              const { min, max } = getMinMaxScores(student.id);

              return (
                <tr key={student.id}>
                  <td 
                    className="td-sticky student-name-cell"
                    onClick={() => setSelectedStudent(student)}
                  >
                    {student.student_number}. {student.name}
                  </td>
                  <td className="td-sticky average-cell">
                    {avg || '-'}
                  </td>
                  {dates.map(date => {
                    const scoreData = getScore(student.id, date);
                    const score = scoreData ? parseFloat(scoreData.score) : null;
                    const isEditing = editingCell?.studentId === student.id && 
                                    editingCell?.date === date;
                    
                    let cellClass = 'score-cell';
                    if (score !== null) {
                      if (score === max && max !== min) cellClass += ' max-score';
                      if (score === min && max !== min) cellClass += ' min-score';
                    }

                    return (
                      <td 
                        key={date} 
                        className={cellClass}
                        onClick={() => !isEditing && handleCellClick(student.id, date)}
                      >
                        {isEditing ? (
                          <input
                            type="number"
                            className="score-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleSaveScore}
                            autoFocus
                            min="0"
                            max={category.max_score}
                            step="0.1"
                          />
                        ) : (
                          score !== null ? score : '-'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 학생 상세 모달 */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          categories={categories}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

export default EvaluationManager;
