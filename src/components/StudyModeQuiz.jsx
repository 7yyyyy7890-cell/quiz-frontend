import { useState, useEffect } from 'react';

export default function StudyModeQuiz({ material, start, end, studentName, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/materials/${material.id}/range?start=${start}&end=${end}`)
      .then(res => res.json())
      .then(data => {
        setQuestions(data);
        setLoading(false);
      });
  }, [material.id, start, end]);

  const handleSelect = (key) => {
    if (showAnswer) return;
    setSelectedChoice(key);
    setShowAnswer(true);
    if (key === questions[currentIndex].correct_choice) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedChoice(null);
      setShowAnswer(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setFinished(true);
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          activity_type: 'مذاكرة',
          material_name: material.title,
          score_text: `${score}/${questions.length}`
        })
      });
    } catch (e) {}
  };

  if (loading) return <div style={{textAlign: 'center', padding: '2rem'}}>جاري تحميل الأسئلة...</div>;
  if (questions.length === 0) return <div style={{textAlign: 'center', padding: '2rem'}}>لا توجد أسئلة في هذا النطاق. <button onClick={onExit} className="btn btn--outline">عودة</button></div>;

  if (finished) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: 'var(--black)' }}>نتيجة المذاكرة</h2>
        <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--olive)', margin: '1rem 0' }}>
          {score} / {questions.length}
        </div>
        <p style={{ fontSize: '1.1rem', color: '#c0392b', fontWeight: '600' }}>الأخطاء: {questions.length - score}</p>
        <button className="btn btn--gold" onClick={onExit} style={{ marginTop: '2rem', padding: '1rem 2rem', fontSize: '1.1rem' }}>رجوع للمكتبة</button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div style={{ background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: '700', color: 'var(--olive)', fontSize: '1.1rem' }}>السؤال {currentIndex + 1} من {questions.length}</div>
        <button className="btn btn--outline" onClick={finishQuiz} style={{ borderColor: '#c0392b', color: '#c0392b', padding: '0.5rem 1rem' }}>إنهاء المذاكرة مبكراً</button>
      </div>
      
      <h2 style={{ marginBottom: '2.5rem', lineHeight: '1.6', color: 'var(--black)', fontSize: '1.5rem' }}>{currentQ.question_text}</h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {currentQ.choices.map(c => {
          let bg = '#f8f9fa';
          let border = '2px solid #e9ecef';
          if (showAnswer) {
            if (c.key === currentQ.correct_choice) {
              bg = '#e6f4ea'; border = '2px solid #2d6a4f';
            } else if (c.key === selectedChoice) {
              bg = '#fff5f5'; border = '2px solid #c0392b';
            }
          } else if (c.key === selectedChoice) {
            bg = '#e9ecef'; border = '2px solid var(--olive)';
          }

          return (
            <button 
              key={c.key} 
              onClick={() => handleSelect(c.key)}
              style={{
                textAlign: 'right', padding: '1.25rem', borderRadius: '8px',
                background: bg, border: border, cursor: showAnswer ? 'default' : 'pointer',
                transition: 'all 0.2s', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', gap: '1rem'
              }}
            >
              <span style={{ fontWeight: 'bold', background: '#fff', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid #ddd' }}>{c.key}</span>
              {c.label}
            </button>
          );
        })}
      </div>

      {showAnswer && (
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: selectedChoice === currentQ.correct_choice ? '#2d6a4f' : '#c0392b' }}>
            {selectedChoice === currentQ.correct_choice ? 'إجابة صحيحة! 🎉' : 'إجابة خاطئة! ❌'}
          </div>
          <button className="btn btn--gold" onClick={handleNext} style={{ width: '100%', padding: '1rem', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {currentIndex < questions.length - 1 ? 'السؤال التالي ➡️' : 'إنهاء ومعرفة النتيجة 🏁'}
          </button>
        </div>
      )}
    </div>
  );
}
