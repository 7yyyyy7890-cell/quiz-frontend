import { useEffect, useState } from 'react';
import { fetchMaterials } from '../api/client';
import { useLobbySocket } from '../hooks/useLobbySocket';
import { ar, format } from '../i18n/ar';
import SinglePlayerQuiz from '../components/SinglePlayerQuiz';
import StudyModeQuiz from '../components/StudyModeQuiz';
import '../styles/pages.css';
import '../styles/competition.css';

function statusLabel(status) {
  return ar.status[status] || status;
}

// ─── Quiz Config Modal ───────────────────────────────────────────────────────
function QuizConfigModal({ isOpen, material, mode, onClose, onStart }) {
  if (!isOpen || !material) return null;
  
  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '1rem'
  };
  const modalStyle = {
    backgroundColor: '#fff', borderRadius: '12px', padding: '2rem',
    maxWidth: '420px', width: '100%', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    textAlign: 'center'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--olive-dark)' }}>
          {mode === 'singleplayer' ? '🎓 إعدادات التدريب الفردي' : '⚔️ إعدادات التحدي الجماعي'}
        </h3>
        <p style={{ color: 'var(--gray-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          حدد عدد الأسئلة للاختبار في ملزمة:<br/>
          <strong style={{ color: 'var(--black)' }}>{material.title}</strong>
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button 
            className="btn btn--gold" 
            disabled={!material.supports_20} 
            onClick={() => onStart(material, 20, mode)}
            style={{ fontSize: '1.1rem', padding: '0.875rem' }}
          >
            20 سؤال
          </button>
          <button 
            className="btn btn--gold" 
            disabled={!material.supports_50} 
            onClick={() => onStart(material, 50, mode)}
            style={{ fontSize: '1.1rem', padding: '0.875rem' }}
          >
            50 سؤال
          </button>
          {mode === 'singleplayer' && (
             <button 
                className="btn btn--gold" 
                onClick={() => onStart(material, 0, mode)}
                style={{ fontSize: '1.1rem', padding: '0.875rem' }}
             >
                كل الأسئلة ({material.question_pool_size})
             </button>
          )}
          <button 
            className="btn btn--outline" 
            onClick={onClose} 
            style={{ marginTop: '0.5rem', border: 'none', color: '#c0392b' }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Material Modes Selector ───────────────────────────────────────────────
function MaterialModesSelector({ materials, loading, displayName, onStartSingle, onStartStudy, onStartMulti }) {
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activeTab, setActiveTab] = useState(null); // 'training' | 'study_multi'
  const [studySubTab, setStudySubTab] = useState(null); // 'study' | 'multi'

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-muted)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⏳</div>
        <p style={{ fontWeight: '500' }}>جاري تحميل الملازم الدراسية...</p>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem', border: '2px dashed var(--gray-muted)',
        borderRadius: '10px', marginTop: '1.5rem', color: 'var(--gray-muted)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
        <p style={{ fontWeight: '600', color: 'var(--black)' }}>لا توجد ملازم متاحة بعد</p>
      </div>
    );
  }

  const renderRanges = (material, mode) => {
    const total = material.question_pool_size;
    if (total === 0) return <p>لا توجد أسئلة.</p>;
    const ranges = [];
    for (let i = 1; i <= total; i += 50) {
      ranges.push({ start: i, end: Math.min(i + 49, total) });
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
        {ranges.map(r => (
          <button
            key={`${r.start}-${r.end}`}
            className="btn btn--outline"
            style={{ padding: '0.5rem', fontSize: '0.9rem', borderColor: mode === 'study' ? 'var(--olive)' : 'var(--gold)', color: mode === 'study' ? 'var(--olive-dark)' : 'var(--gold)' }}
            onClick={() => mode === 'study' ? onStartStudy(material, r.start, r.end) : onStartMulti(material, r.start, r.end)}
          >
            {r.start} إلى {r.end}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="materials-list">
      {materials.map((material) => (
        <article key={material.id} className="material-card" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.25rem', fontSize: '1.2rem' }}>📄 {material.title}</h2>
              <p className="material-card__meta">🗃 {material.question_pool_size} سؤال</p>
            </div>
          </div>

          {!selectedMaterial || selectedMaterial.id !== material.id ? (
            <button 
              className="btn btn--gold" 
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={!displayName.trim()}
              onClick={() => { setSelectedMaterial(material); setActiveTab(null); setStudySubTab(null); }}
            >
              {!displayName.trim() ? 'أدخل اسمك أولاً بالأسفل' : 'اختيار الملزمة'}
            </button>
          ) : (
            <div style={{ background: '#fafafa', padding: '1rem', borderRadius: '8px', border: '1px solid #e9ecef' }}>
              {!activeTab && (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn--gold" style={{ flex: 1 }} onClick={() => setActiveTab('training')}>🎓 تدريب فردي</button>
                  <button className="btn btn--olive" style={{ flex: 1 }} onClick={() => setActiveTab('study_multi')}>📚 مذاكرة وتحدي جماعي</button>
                  <button className="btn btn--outline" onClick={() => setSelectedMaterial(null)}>✖</button>
                </div>
              )}

              {activeTab === 'training' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--olive-dark)' }}>اختر عدد الأسئلة:</h4>
                    <button className="btn btn--outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setActiveTab(null)}>رجوع</button>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                    <button className="btn btn--gold" onClick={() => onStartSingle(material, 20)}>20 سؤال عشوائي</button>
                    <button className="btn btn--gold" onClick={() => onStartSingle(material, 50)}>50 سؤال عشوائي</button>
                    <button className="btn btn--gold" onClick={() => onStartSingle(material, 0)}>كل الأسئلة عشوائي</button>
                  </div>
                </div>
              )}

              {activeTab === 'study_multi' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--olive-dark)' }}>اختر النمط:</h4>
                    <button className="btn btn--outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => { setActiveTab(null); setStudySubTab(null); }}>رجوع</button>
                  </div>
                  {!studySubTab ? (
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button className="btn btn--outline" style={{ flex: 1, borderColor: 'var(--olive)', color: 'var(--olive-dark)' }} onClick={() => setStudySubTab('study')}>📖 مذاكرة</button>
                      <button className="btn btn--outline" style={{ flex: 1, borderColor: 'var(--gold)', color: 'var(--gold)' }} onClick={() => setStudySubTab('multi')}>⚔️ تحدي جماعي</button>
                    </div>
                  ) : (
                    <div>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>اختر نطاق الأسئلة ({studySubTab === 'study' ? 'المذاكرة' : 'التحدي'}):</h5>
                      {renderRanges(material, studySubTab)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

// ─── Multiplayer Lobby ──────────────────────────────────────────────────────
function MultiplayerLobby({ status, activeMaterial, activeQuizSize, playerCount, players, countdown, error, onLeave }) {
  return (
    <div className="room-panel">
      <div className="status-badge" data-status={status}>
        {statusLabel(status)}
      </div>
      {activeMaterial && (
        <p className="lobby-material">
          {format(ar.competition.materialQuiz, { title: activeMaterial.title, count: activeQuizSize })}
        </p>
      )}
      <p className="lobby-player-count" aria-live="polite">
        {ar.competition.lobbyPlayers} <strong>{playerCount}</strong>
      </p>
      {countdown !== null && countdown > 0 && (
        <div className="countdown" aria-live="polite">
          {format(ar.competition.waitSeconds, { seconds: countdown })}
        </div>
      )}
      <ul className="player-list">
        {players.map((p) => (
          <li key={p.id} className="player-slot player-slot--filled">
            <span className="player-slot__name">{p.name}</span>
          </li>
        ))}
      </ul>
      {error && <p className="error-msg">{error}</p>}
      <button type="button" className="btn btn--outline" onClick={onLeave}>
        {ar.competition.leaveLobby}
      </button>
    </div>
  );
}

// ─── Multiplayer Quiz ───────────────────────────────────────────────────────
function MultiplayerQuiz({ 
  currentQuestion, currentQIndex, questionCount, timeout, 
  myAnswerAck, whoAnswered, roundResult, leaderboard, 
  onSelect, selectedChoice, onSubmit 
}) {
  const [timeLeft, setTimeLeft] = useState(timeout);

  useEffect(() => {
    setTimeLeft(timeout);
    if (timeout <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentQuestion, timeout]);

  if (!currentQuestion) return null;

  return (
    <div className="quiz-panel">
      <div className="quiz-progress" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{format(ar.competition.questionProgress, { current: currentQIndex + 1, total: questionCount })}</span>
        <span style={{ color: timeLeft <= 5 ? '#c0392b' : 'var(--olive)', fontWeight: 'bold' }}>
          ⏱️ {timeLeft} ثانية
        </span>
      </div>
      <div style={{ height: '4px', background: '#e9ecef', borderRadius: '2px', marginBottom: '1.25rem' }}>
        <div style={{
          height: '100%',
          width: `${Math.round((currentQIndex / questionCount) * 100)}%`,
          background: 'linear-gradient(90deg, var(--olive), var(--gold))',
          borderRadius: '2px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <h2 className="quiz-question">{currentQuestion.text}</h2>
      
      <div className="quiz-choices">
        {currentQuestion.choices.map((choice) => {
          let bg = 'var(--white)';
          let border = '1px solid var(--gray-muted)';
          
          if (roundResult) {
            // End of round: show actual correctness
            if (choice.key === roundResult.correct_choice) {
              bg = '#e6f4ea'; border = '2px solid #2d6a4f';
            } else if (choice.key === selectedChoice) {
              bg = '#fff5f5'; border = '2px solid #c0392b';
            }
          } else {
            // During round
            if (myAnswerAck && choice.key === selectedChoice) {
              // I answered
              bg = myAnswerAck.correct ? '#e6f4ea' : '#fff5f5';
              border = myAnswerAck.correct ? '2px solid #2d6a4f' : '2px solid #c0392b';
            } else if (choice.key === selectedChoice) {
              bg = '#fffbea'; border = '2px solid var(--gold)';
            }
          }

          return (
            <button
              key={choice.key}
              type="button"
              className="quiz-choice"
              disabled={Boolean(myAnswerAck) || Boolean(roundResult)}
              onClick={() => {
                onSelect(choice.key);
                onSubmit(choice.key); // Submit instantly on click
              }}
              style={{ background: bg, border: border, textAlign: 'right' }}
            >
              <span className="quiz-choice__key" style={{ fontWeight: 'bold' }}>{choice.key}</span>
              <span>{choice.label}</span>
              {roundResult && choice.key === roundResult.correct_choice && <span style={{ marginRight: 'auto', color: '#2d6a4f' }}>✓ الصحيحة</span>}
            </button>
          );
        })}
      </div>

      {!roundResult && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#555' }}>
          👥 الأشخاص الذين أجابوا حتى الآن: {whoAnswered.length} 
        </div>
      )}

      {myAnswerAck && !roundResult && (
        <div style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 'bold', color: myAnswerAck.correct ? '#2d6a4f' : '#c0392b' }}>
          {myAnswerAck.correct ? 'إجابتك صحيحة! بانتظار البقية...' : 'إجابتك خاطئة! بانتظار البقية...'}
        </div>
      )}

      {leaderboard.length > 0 && (
        <aside className="live-leaderboard" style={{ marginTop: '2rem' }}>
          <h3>النقاط الحالية</h3>
          <ol>
            {leaderboard.map((entry) => (
              <li key={entry.id}>
                <span className="live-leaderboard__rank">#{entry.rank}</span>
                <span className="live-leaderboard__name">{entry.name}</span>
                <span className="live-leaderboard__score">{entry.score} نقطة</span>
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}

// ─── Multiplayer Results ────────────────────────────────────────────────────
function MultiplayerResults({ leaderboard, onLeave }) {
  const winner = leaderboard[0];
  return (
    <div className="results-panel">
      {winner && (
        <div style={{
          background: 'linear-gradient(135deg, var(--olive), var(--olive-dark))',
          color: '#fff',
          borderRadius: '12px',
          padding: '2rem',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '2rem' }}>الفائز 🏆</h2>
          <div style={{ fontSize: '3rem', fontWeight: '900', margin: '0.5rem 0' }}>{winner.name}</div>
          <div style={{ fontSize: '1.25rem' }}>بمجموع {winner.score} نقطة!</div>
        </div>
      )}
      
      {leaderboard.length > 0 && (
        <aside className="live-leaderboard live-leaderboard--final">
          <h3>{ar.competition.finalLeaderboard}</h3>
          <ol>
            {leaderboard.map((entry) => (
              <li key={entry.id}>
                <span className="live-leaderboard__rank">#{entry.rank}</span>
                <span className="live-leaderboard__name">{entry.name}</span>
                <span className="live-leaderboard__score">{entry.score} نقطة</span>
              </li>
            ))}
          </ol>
        </aside>
      )}

      <button type="button" className="btn btn--outline" onClick={onLeave} style={{ marginTop: '2rem' }}>
        {ar.competition.backToMaterials}
      </button>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function Competition() {
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [displayName, setDisplayName] = useState('');
  
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [activeQuizSize, setActiveQuizSize] = useState(null);
  const [quizMode, setQuizMode] = useState(null); // null | 'singleplayer' | 'study' | 'multiplayer'
  
  const [studyRange, setStudyRange] = useState({ start: 0, end: 0 });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState(null);

  const {
    status, playerCount, players, countdown, 
    questionCount, currentQuestion, currentQIndex, timeout,
    myAnswerAck, whoAnswered, roundResult,
    leaderboard, error,
    connect, disconnect, submitAnswer, isConnected,
  } = useLobbySocket();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMaterials();
        if (!cancelled) setMaterials(data);
      } catch {
        if (!cancelled) setMaterials([]);
      } finally {
        if (!cancelled) setLoadingMaterials(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStartSingle = (material, limit) => {
    setActiveMaterial(material);
    setActiveQuizSize(limit);
    setQuizMode('singleplayer');
  };

  const handleStartStudy = (material, start, end) => {
    setActiveMaterial(material);
    setStudyRange({ start, end });
    setQuizMode('study');
  };

  const handleStartMulti = (material, start, end) => {
    setActiveMaterial(material);
    setActiveQuizSize(`${start}-${end}`); // Just a visual placeholder for now
    setQuizMode('multiplayer');
    setCurrentIndex(0);
    setSelectedChoice(null);
    connect(material.id, `${start}-${end}`, displayName.trim()); // will need to update useLobbySocket
  };

  const handleLeave = () => {
    if (quizMode === 'multiplayer') disconnect();
    setActiveMaterial(null);
    setQuizMode(null);
    setActiveQuizSize(null);
    setCurrentIndex(0);
    setSelectedChoice(null);
  };

  const handleSubmitAnswer = (key) => {
    if (!currentQuestion || myAnswerAck || roundResult) return;
    submitAnswer(key);
  };

  const inLobby = isConnected && ['lobby', 'countdown', 'connecting'].includes(status);
  const inQuiz   = status === 'live' && currentQuestion && quizMode === 'multiplayer';
  const inResults = status === 'finished' && quizMode === 'multiplayer';
  const showMaterialList = !quizMode && !isConnected;

  return (
    <section className="page competition-page" dir="rtl">
      <h1>{ar.competition.title}</h1>
      <p className="subtitle">{ar.competition.subtitle}</p>

      {/* Name input — always visible unless in single-player quiz */}
      {quizMode !== 'singleplayer' && (
        <div style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.875rem', fontWeight: '600' }}>
            {ar.competition.displayName}
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={ar.competition.displayNamePlaceholder}
              disabled={isConnected}
              style={{
                padding: '0.625rem 0.875rem',
                borderRadius: '6px',
                border: '1px solid var(--gray-muted)',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </label>
          {!displayName.trim() && (
            <p style={{ fontSize: '0.8rem', color: 'var(--gray-muted)', marginTop: '0.375rem' }}>
              أدخل اسمك أولاً لتفعيل التحدي الجماعي
            </p>
          )}
        </div>
      )}

      {/* Material Selection */}
      {showMaterialList && (
        <MaterialModesSelector
          materials={materials}
          loading={loadingMaterials}
          displayName={displayName}
          onStartSingle={handleStartSingle}
          onStartStudy={handleStartStudy}
          onStartMulti={handleStartMulti}
        />
      )}

      {/* Single Player Quiz */}
      {quizMode === 'singleplayer' && activeMaterial && (
        <SinglePlayerQuiz
          material={activeMaterial}
          limit={activeQuizSize}
          studentName={displayName.trim()}
          onExit={handleLeave}
        />
      )}

      {/* Study Mode Quiz */}
      {quizMode === 'study' && activeMaterial && (
        <StudyModeQuiz
          material={activeMaterial}
          start={studyRange.start}
          end={studyRange.end}
          studentName={displayName.trim()}
          onExit={handleLeave}
        />
      )}

      {/* Multiplayer: Lobby */}
      {inLobby && (
        <MultiplayerLobby
          status={status}
          activeMaterial={activeMaterial}
          activeQuizSize={activeQuizSize}
          playerCount={playerCount}
          players={players}
          countdown={countdown}
          error={error}
          onLeave={handleLeave}
        />
      )}

      {/* Multiplayer: Live Quiz */}
      {inQuiz && !inResults && currentQuestion && (
        <MultiplayerQuiz
          currentQuestion={currentQuestion}
          currentQIndex={currentQIndex}
          questionCount={questionCount}
          timeout={timeout}
          myAnswerAck={myAnswerAck}
          whoAnswered={whoAnswered}
          roundResult={roundResult}
          leaderboard={leaderboard}
          selectedChoice={selectedChoice}
          onSelect={setSelectedChoice}
          onSubmit={handleSubmitAnswer}
        />
      )}

      {/* Multiplayer: Results */}
      {inResults && (
        <MultiplayerResults
          leaderboard={leaderboard}
          onLeave={handleLeave}
        />
      )}
    </section>
  );
}
