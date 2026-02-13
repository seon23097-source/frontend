import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { evaluationsAPI } from '../utils/api';
import './StudentDetail.css';

function StudentDetail({ student, categories, onClose }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    loadStudentData();
  }, [student.id]);

  useEffect(() => {
    // 초기에 모든 카테고리 선택
    setSelectedCategories(categories.map(c => c.id));
  }, [categories]);

  const loadStudentData = async () => {
    try {
      const data = await evaluationsAPI.getByStudent(student.id);
      setEvaluations(data);
    } catch (error) {
      console.error('학생 평가 데이터 로드 실패:', error);
      alert('학생 평가 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // 꺾은선 그래프 데이터 준비
  const getLineChartData = () => {
    // 날짜별로 그룹화
    const dateMap = {};
    evaluations.forEach(eval => {
      if (!dateMap[eval.evaluation_date]) {
        dateMap[eval.evaluation_date] = { date: eval.evaluation_date };
      }
      // 백분율로 변환
      const percentage = (parseFloat(eval.score) / eval.max_score) * 100;
      dateMap[eval.evaluation_date][eval.category_name] = percentage;
    });

    return Object.values(dateMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  };

  // 방사형 그래프 데이터 준비
  const getRadarChartData = () => {
    const categoryData = {};

    // 카테고리별로 데이터 수집
    evaluations.forEach(eval => {
      if (!selectedCategories.includes(eval.category_id)) return;

      if (!categoryData[eval.category_name]) {
        categoryData[eval.category_name] = {
          category: eval.category_name,
          scores: []
        };
      }

      // 백분율로 변환하여 저장
      const percentage = (parseFloat(eval.score) / eval.max_score) * 100;
      categoryData[eval.category_name].scores.push({
        value: percentage,
        date: eval.evaluation_date
      });
    });

    return Object.values(categoryData);
  };

  // 색상 생성 함수
  const getColorForIndex = (index, total, opacity = 1) => {
    const hue = (index * 360) / total;
    return `hsla(${hue}, 70%, 50%, ${opacity})`;
  };

  const getOldestToNewestOpacity = (scores) => {
    return scores.map((score, index) => {
      const opacity = 0.2 + (0.8 * index) / (scores.length - 1);
      return { ...score, opacity };
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="student-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="student-detail-loading">
            <div className="spinner"></div>
            <p>로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const lineChartData = getLineChartData();
  const radarData = getRadarChartData();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="student-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{student.student_number}번 {student.name}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="student-detail-content">
          {evaluations.length === 0 ? (
            <div className="no-data">
              <p>평가 기록이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 카테고리 필터 */}
              <div className="category-filter">
                <h4>카테고리 선택</h4>
                <div className="category-checkboxes">
                  {categories.map(category => (
                    <label key={category.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleCategory(category.id)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 꺾은선 그래프 */}
              <div className="chart-section">
                <h4>시간에 따른 변화</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E6ED" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#5A5A5A"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="#5A5A5A"
                      tick={{ fontSize: 12 }}
                      domain={[0, 100]}
                      label={{ value: '백분율 (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#FFF', 
                        border: '2px solid #E0E6ED',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    {categories
                      .filter(cat => selectedCategories.includes(cat.id))
                      .map((category, index) => (
                        <Line
                          key={category.id}
                          type="monotone"
                          dataKey={category.name}
                          stroke={getColorForIndex(index, selectedCategories.length)}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 방사형 그래프 */}
              <div className="chart-section">
                <h4>카테고리별 전체 기록</h4>
                <p className="chart-description">
                  각 축의 점들은 해당 카테고리의 모든 평가 기록입니다. 
                  진한 색일수록 최근 기록입니다.
                </p>
                
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart>
                    <PolarGrid stroke="#E0E6ED" />
                    <PolarAngleAxis 
                      dataKey="category"
                      tick={{ fontSize: 13, fill: '#1A1A1A' }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div style={{
                            background: 'white',
                            padding: '8px 12px',
                            border: '2px solid #E0E6ED',
                            borderRadius: '8px',
                            fontSize: '13px'
                          }}>
                            <div><strong>{data.category}</strong></div>
                            <div>{data.date}</div>
                            <div>{data.value?.toFixed(1)}%</div>
                          </div>
                        );
                      }}
                    />
                    
                    {radarData.map((categoryData, catIndex) => {
                      const scoresWithOpacity = getOldestToNewestOpacity(categoryData.scores);
                      const baseColor = getColorForIndex(catIndex, radarData.length, 1);
                      
                      return scoresWithOpacity.map((scoreData, scoreIndex) => (
                        <Radar
                          key={`${categoryData.category}-${scoreIndex}`}
                          name={`${categoryData.category} (${scoreData.date})`}
                          dataKey="value"
                          data={[{
                            category: categoryData.category,
                            value: scoreData.value,
                            date: scoreData.date
                          }]}
                          fill={baseColor.replace('1)', `${scoreData.opacity})`)}
                          stroke={baseColor}
                          strokeWidth={2}
                          fillOpacity={0}
                          dot={{ r: 4 }}
                        />
                      ));
                    })}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentDetail;
