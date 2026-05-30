import { useState, useEffect, useCallback } from 'react';
import { fetchQuiz } from '../api/client';
import { ar, format } from '../i18n/ar';

export default function SinglePlayerQuiz({ material, limit, studentName, onExit }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [answers, setAnswers] = useState({}); // questionId -> { selected, correct, correct_choice }
  const [finished, setFinished] = useState(false);

  const loadQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedChoice(null);
    setAnswers({});
    setFinished(false);
    try {
      const data = await fetchQuiz(material.id, limit);
      setQuestions(data);
    } catch (err) {
      setError(err.message || 'فشل في تحميل الاختبار');
    } finally {
      setLoading(false);
    }
  }, [material.id, limit]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !selectedChoice || currentAnswer) return;
    const isCorrect = selectedChoice === currentQuestion.correct_choice;
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { selected: selectedChoice, correct: isCorrect }
    }));
  };

  const handleNext = async () => {
    if (isLastQuestion) {
      setFinished(true);
      const score = Object.values(answers).filter(a => a.correct).length;
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8001'}/api/v1/activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_name: studentName,
            activity_type: 'تدريب فردي',
            material_name: material.title,
            score_text: `${score}/${questions.length}`
          })
        });
      } catch (e) {}
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedChoice(null);
    }
  };

  const score = Object.values(answers).filter(a => a.correct).length;
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="quiz-panel" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>⏳</div>
        <p style={{ color: 'var(--gray-muted)', fontWeight: '500' }}>جاري تحميل الأسئلة...</p>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="quiz-panel">
        <p className="error-msg" style={{ marginBottom: '1.5rem' }}>⚠️ {error}</p>
        <button onClick={loadQuiz} className="btn btn--olive" style={{ marginLeft: '0.75rem' }}>إعادة المحاولة</button>
        <button onClick={onExit} className="btn btn--outline">العودة</button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (questions.length === 0) {
    return (
      <div className="quiz-panel" style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
        <p style={{ fontWeight: '500' }}>لا توجد أسئلة كافية في هذه الملزمة بعد.</p>
        <button onClick={onExit} className="btn btn--outline" style={{ marginTop: '1.25rem' }}>العودة</button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (finished) {
    const wrongQuestions = questions.filter(q => !answers[q.id]?.correct);
    return (
      <div className="results-panel">
        {/* Score Card */}
        <div style={{
          background: percentage >= 70 ? 'linear-gradient(135deg, #2d6a4f, #40916c)' : percentage >= 50 ? 'linear-gradient(135deg, #856404, #b8860b)' : 'linear-gradient(135deg, #922b21, #c0392b)',
          color: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{ fontSize: '4rem', fontWeight: '900', lineHeight: 1 }}>{percentage}%</div>
          <div style={{ fontSize: '1.25rem', marginTop: '0.5rem', opacity: 0.9 }}>
            {score} صحيحة من {questions.length} سؤال
          </div>
          <div style={{ fontSize: '1.5rem', marginTop: '0.75rem' }}>
            {percentage >= 90 ? '🏆 ممتاز!' : percentage >= 70 ? '✅ جيد جداً' : percentage >= 50 ? '⚠️ مقبول' : '❌ يحتاج مراجعة'}
          </div>
        </div>

        {/* Error Report */}
        {wrongQuestions.length > 0 && (
          <section className="error-report">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 تقرير الأخطاء ({wrongQuestions.length} سؤال)
            </h3>
            <ul className="error-report__list">
              {wrongQuestions.map((q, idx) => {
                const userAns = q.choices.find(c => c.key === answers[q.id]?.selected);
                const correctAns = q.choices.find(c => c.key === q.correct_choice);
                return (
                  <li key={idx} className="error-report__item">
                    <p className="error-report__question">{idx + 1}. {q.question_text}</p>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '700', color: '#c0392b' }}>إجابتك: </span>
                      {userAns ? `${userAns.key}. ${userAns.label}` : 'لم يتم الإجابة'}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                      <span style={{ fontWeight: '700', color: '#2d6a4f' }}>الصحيحة: </span>
                      {correctAns ? `${correctAns.key}. ${correctAns.label}` : q.correct_choice}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {wrongQuestions.length === 0 && (
          <p className="success-msg" style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: '600' }}>
            🎉 إجاباتك كلها صحيحة! أحسنت!
          </p>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={loadQuiz} className="btn btn--gold" style={{ flex: 1, minWidth: '140px' }}>
            🔁 إعادة الاختبار (أسئلة مختلفة)
          </button>
          <button onClick={onExit} className="btn btn--outline" style={{ flex: 1, minWidth: '140px' }}>
            العودة للقائمة
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ──────────────────────────────────────────────────────────────────
  const progressPct = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="quiz-panel">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div className="quiz-progress">
          {format(ar.competition.questionProgress, { current: currentIndex + 1, total: questions.length })}
        </div>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-muted)', fontSize: '0.85rem' }}>
          ✖ خروج
        </button>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '4px', background: '#e9ecef', borderRadius: '2px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'linear-gradient(90deg, var(--olive), var(--gold))',
          borderRadius: '2px',
          transition: 'width 0.4s ease'
        }} />
      </div>

      {/* Material title chip */}
      <div style={{ marginBottom: '0.75rem' }}>
        <span style={{
          fontSize: '0.75rem',
          background: 'var(--olive)',
          color: '#fff',
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontWeight: '600'
        }}>
          {material.title}
        </span>
      </div>

      {/* Question */}
      <h2 className="quiz-question" style={{ marginBottom: '1.5rem', fontSize: '1.2rem', lineHeight: 1.6 }}>
        {currentQuestion.question_text}
      </h2>

      {/* Choices */}
      <div className="quiz-choices">
        {currentQuestion.choices.map((choice) => {
          const isSelected = selectedChoice === choice.key;
          const isAnswered = Boolean(currentAnswer);
          const isCorrectChoice = choice.key === currentQuestion.correct_choice;
          const isWrongSelected = isAnswered && choice.key === currentAnswer.selected && !currentAnswer.correct;

          let borderColor = 'var(--gray-muted)';
          let bgColor = 'var(--white)';
          let textColor = 'var(--black)';

          if (isAnswered) {
            if (isCorrectChoice) { borderColor = '#2d6a4f'; bgColor = '#f0faf4'; }
            else if (isWrongSelected) { borderColor = '#c0392b'; bgColor = '#fff5f5'; textColor = '#c0392b'; }
          } else if (isSelected) {
            borderColor = 'var(--gold)';
            bgColor = '#fffbea';
          }

          return (
            <button
              key={choice.key}
              type="button"
              className={`quiz-choice${isSelected && !isAnswered ? ' quiz-choice--selected' : ''}`}
              disabled={isAnswered}
              onClick={() => setSelectedChoice(choice.key)}
              style={{
                borderColor,
                backgroundColor: bgColor,
                color: textColor,
                transition: 'all 0.2s',
                fontWeight: isAnswered && isCorrectChoice ? '700' : '400'
              }}
            >
              <span className="quiz-choice__key" style={{
                color: isAnswered && isCorrectChoice ? '#2d6a4f' : isWrongSelected ? '#c0392b' : 'var(--olive-dark)',
                fontWeight: '800'
              }}>
                {choice.key}
              </span>
              <span>{choice.label}</span>
              {isAnswered && isCorrectChoice && <span style={{ marginInlineStart: 'auto', color: '#2d6a4f' }}>✓</span>}
              {isWrongSelected && <span style={{ marginInlineStart: 'auto', color: '#c0392b' }}>✗</span>}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!currentAnswer ? (
        <button
          type="button"
          className="btn btn--gold"
          disabled={!selectedChoice}
          onClick={handleSubmitAnswer}
          style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem', fontSize: '1rem' }}
        >
          {ar.competition.submitAnswer}
        </button>
      ) : (
        <div style={{ marginTop: '1rem' }}>
          <p style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontWeight: '700',
            backgroundColor: currentAnswer.correct ? '#f0faf4' : '#fff5f5',
            color: currentAnswer.correct ? '#2d6a4f' : '#c0392b',
            marginBottom: '0.75rem',
            textAlign: 'center'
          }}>
            {currentAnswer.correct ? '🎉 إجابة صحيحة!' : '❌ إجابة خاطئة'}
          </p>
          <button
            type="button"
            className="btn btn--olive"
            onClick={handleNext}
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', fontWeight: '700' }}
          >
            {isLastQuestion ? '📊 عرض النتيجة النهائية' : 'السؤال التالي →'}
          </button>
        </div>
      )}
    </div>
  );
}
