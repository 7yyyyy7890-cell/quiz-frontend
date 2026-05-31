import { useState, useEffect } from 'react';
import { uploadPdf, fetchMaterials } from '../api/client';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL || 'https://quiz-backend-ten-theta.vercel.app';

async function deleteMaterial(id) {
  return fetch(`${API_BASE}/api/v1/materials/${id}`, { method: 'DELETE' });
}

async function resumeMaterial(id) {
  return fetch(`${API_BASE}/api/v1/upload/resume/${id}`, { method: 'POST' });
}

async function pauseMaterial(id) {
  return fetch(`${API_BASE}/api/v1/upload/pause/${id}`, { method: 'POST' });
}

export default function Admin() {
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [uploadMessage, setUploadMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);

  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id to confirm delete

  const [activities, setActivities] = useState([]);

  const [activeTab, setActiveTab] = useState('upload'); // upload | library | activity

  const loadActivities = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data);
      }
    } catch {}
  };

  const loadMaterials = async () => {
    try {
      const data = await fetchMaterials();
      setMaterials(data);
    } catch {
      // ignore
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Load data once on mount, user can click refresh manually
  useEffect(() => {
    loadMaterials();
    loadActivities();
  }, []);

  // AUTOMATIC EXTRACTION SYSTEM (Vercel Compatibility Fix)
  // Automatically resume pending extractions, and recover stuck processing states
  useEffect(() => {
    // We consider it pending if it's explicitly 'pending', OR if it's 'processing' 
    // because on Vercel, 'processing' means the request was sent. If the effect runs, 
    // it means the previous request finished (either success or 504 timeout).
    // We only want to trigger this if we aren't currently waiting for a fetch to return.
    const needsResume = materials.find(m => m.status === 'pending' || m.status === 'processing');
    
    if (needsResume && uploadStatus !== 'uploading_chunk') {
      console.log('Auto-resuming extraction for:', needsResume.id);
      
      // Mark that we are currently processing a chunk to avoid duplicate requests
      setUploadStatus('uploading_chunk');
      
      const timer = setTimeout(async () => {
        try {
          await resumeMaterial(needsResume.id);
        } catch (e) {
          console.error("Resume failed, likely Vercel timeout", e);
        } finally {
          setUploadStatus('idle'); // Free the lock
          loadMaterials(); // Load updated state from DB to trigger the next chunk
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [materials, uploadStatus]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploadStatus('uploading');
    setUploadMessage('');

    try {
      const result = await uploadPdf(file);
      setUploadStatus('success');
      setUploadMessage(`✅ ${result.message}`);
      setFile(null);
      await loadMaterials();
      setActiveTab('library'); // Switch to library automatically to see the new upload!
    } catch (err) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'فشل في رفع الملف.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaterial(id);
      setDeleteConfirm(null);
      await loadMaterials();
    } catch {
      alert('فشل في حذف الملزمة.');
    }
  };

  const handleResume = async (id) => {
    try {
      const res = await resumeMaterial(id);
      if (res.ok) {
        await loadMaterials();
      }
    } catch {
      alert('فشل استئناف الاستخراج.');
    }
  };

  const handlePause = async (id) => {
    try {
      const res = await pauseMaterial(id);
      if (res.ok) {
        await loadMaterials();
      }
    } catch {
      alert('فشل إيقاف الاستخراج.');
    }
  };

  return (
    <section className="page admin-page" dir="rtl">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            لوحة الإدارة 🛠️
          </h1>
          <p style={{ color: 'var(--gray-muted)', fontSize: '1rem' }}>
            إدارة شاملة للمنصة: الرفع، الملازم، وسجل نشاط الطلاب
          </p>
        </div>

        {/* Tabs Navigation */}
        <div style={{ 
          display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap',
          background: 'var(--white)', padding: '0.5rem', borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1, padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem',
              background: activeTab === 'upload' ? 'var(--olive)' : 'transparent',
              color: activeTab === 'upload' ? 'var(--white)' : 'var(--gray-muted)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📤 رفع واستخراج
          </button>
          <button
            onClick={() => setActiveTab('library')}
            style={{
              flex: 1, padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem',
              background: activeTab === 'library' ? 'var(--olive)' : 'transparent',
              color: activeTab === 'library' ? 'var(--white)' : 'var(--gray-muted)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📚 مكتبة الملازم
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            style={{
              flex: 1, padding: '1rem', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.1rem',
              background: activeTab === 'activity' ? 'var(--olive)' : 'transparent',
              color: activeTab === 'activity' ? 'var(--white)' : 'var(--gray-muted)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            📊 سجل النشاط
          </button>
        </div>

        {/* Upload Section */}
        {activeTab === 'upload' && (
          <div style={{
            background: 'var(--white)', padding: '2rem', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)', borderTop: '4px solid var(--olive)',
            animation: 'fadeIn 0.4s ease'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--black)' }}>
              📤 رفع ملزمة جديدة لاستخراج الأسئلة
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('admin-file-upload').click()}
                style={{
                  border: `2px dashed ${isDragActive ? 'var(--gold)' : file ? 'var(--olive)' : 'var(--gray-muted)'}`,
                  backgroundColor: isDragActive ? 'rgba(201, 162, 39, 0.06)' : file ? 'rgba(86, 111, 65, 0.05)' : '#fafafa',
                  borderRadius: '10px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
              >
                <input
                  id="admin-file-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => { setFile(e.target.files?.[0] ?? null); setUploadStatus('idle'); setUploadMessage(''); }}
                  style={{ display: 'none' }}
                />
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                  {file ? '📄' : '☁️'}
                </div>
                <p style={{ fontWeight: '600', fontSize: '1.1rem', margin: 0, color: file ? 'var(--olive-dark)' : 'var(--black)' }}>
                  {file ? file.name : 'اسحب وأفلت ملف PDF هنا'}
                </p>
                {!file && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--gray-muted)', margin: '0.5rem 0 0' }}>
                    أو انقر لاختيار ملف من جهازك
                  </p>
                )}
                {file && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--gray-muted)', margin: '0.5rem 0 0' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || uploadStatus === 'uploading'}
                style={{
                  width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: '700', borderRadius: '8px',
                  border: 'none', cursor: !file || uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
                  backgroundColor: uploadStatus === 'uploading' ? 'var(--gray-muted)' : 'var(--gold)',
                  color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(201, 162, 39, 0.3)', transition: 'all 0.2s'
                }}
              >
                {uploadStatus === 'uploading' ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    جاري رفع الملف للسيرفر...
                  </>
                ) : '🚀 بدء الرفع والمعالجة التلقائية'}
              </button>
            </form>

            {uploadMessage && (
              <div style={{
                marginTop: '1.25rem', padding: '1rem 1.25rem', borderRadius: '8px',
                backgroundColor: uploadStatus === 'error' ? '#fff5f5' : '#f0f7ed',
                color: uploadStatus === 'error' ? '#c0392b' : '#2d6a4f',
                border: `1px solid ${uploadStatus === 'error' ? '#fbb' : '#b7e0c3'}`,
                fontSize: '1rem', fontWeight: '500', lineHeight: '1.6'
              }}>
                {uploadMessage}
              </div>
            )}
          </div>
        )}

        {/* Materials Library */}
        {activeTab === 'library' && (
          <div style={{
            background: 'var(--white)', padding: '2rem', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)', borderTop: '4px solid var(--gold)',
            animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                📚 الملازم المرفوعة
              </h2>
              <button
                onClick={loadMaterials}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--gray-muted)',
                  background: 'transparent', cursor: 'pointer', fontSize: '0.875rem',
                  color: 'var(--olive-dark)', fontWeight: '600'
                }}
              >
                🔄 تحديث
              </button>
            </div>

            {loadingMaterials && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-muted)' }}>
                جاري تحميل الملازم...
              </div>
            )}

            {!loadingMaterials && materials.length === 0 && (
              <div style={{
                textAlign: 'center', padding: '3rem', color: 'var(--gray-muted)',
                border: '2px dashed var(--gray-muted)', borderRadius: '8px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
                <p style={{ margin: 0, fontWeight: '500' }}>لا توجد ملازم بعد. اذهب لقسم الرفع أولاً!</p>
              </div>
            )}

            {!loadingMaterials && materials.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {materials.map((m) => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.25rem', border: '1px solid #e8e8e8', borderRadius: '8px',
                    borderInlineStart: '4px solid var(--olive)', background: '#fafafa', gap: '1rem', flexWrap: 'wrap'
                  }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <p style={{ margin: 0, fontWeight: '700', color: 'var(--black)', fontSize: '1.1rem' }}>
                        📄 {m.title}
                      </p>
                      <p style={{ margin: '0.4rem 0 0', color: 'var(--olive-dark)', fontSize: '0.9rem', fontWeight: '600' }}>
                        {m.question_pool_size} سؤال تم استخراجه وحفظه
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '700',
                        backgroundColor: m.status === 'completed' ? '#e6f4ea' : (m.status === 'failed' ? '#fff5f5' : (m.status === 'paused' ? '#e9ecef' : '#fff8e1')),
                        color: m.status === 'completed' ? '#2d6a4f' : (m.status === 'failed' ? '#c0392b' : (m.status === 'paused' ? '#495057' : '#856404'))
                      }}>
                        {m.status === 'completed' ? '✅ الاستخراج مكتمل' : (m.status === 'failed' ? '❌ فشل الاستخراج' : (m.status === 'paused' ? '⏸️ متوقف مؤقتاً' : '⏳ جاري الاستخراج...'))}
                      </span>
                      {(m.status === 'paused' || m.status === 'failed' || m.status === 'pending') && (
                        <button
                          onClick={() => handleResume(m.id)}
                          style={{
                            padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--olive)',
                            color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                          }}
                        >
                          ▶️ استئناف الاستخراج
                        </button>
                      )}
                      {m.status === 'processing' && (
                        <button
                          onClick={() => handlePause(m.id)}
                          style={{
                            padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#f39c12',
                            color: '#fff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                          }}
                        >
                          ⏸️ إيقاف مؤقت
                        </button>
                      )}
                      {deleteConfirm === m.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(m.id)}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#c0392b',
                              color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem'
                            }}
                          >
                            تأكيد الحذف النهائي
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{
                              padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--gray-muted)',
                              background: 'transparent', cursor: 'pointer', fontSize: '0.85rem'
                            }}
                          >
                            إلغاء
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          style={{
                            padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid #fbb',
                            background: '#fff5f5', color: '#c0392b', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem'
                          }}
                        >
                          🗑️ حذف الملزمة
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Logs */}
        {activeTab === 'activity' && (
          <div style={{
            background: 'var(--white)', padding: '2rem', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.07)', borderTop: '4px solid var(--gold)',
            animation: 'fadeIn 0.4s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
                📊 سجل نشاط الطلاب
              </h2>
              <button
                onClick={loadActivities}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--gray-muted)',
                  background: 'transparent', cursor: 'pointer', fontSize: '0.875rem',
                  color: 'var(--olive-dark)', fontWeight: '600'
                }}
              >
                🔄 تحديث السجل
              </button>
            </div>
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e8e8e8' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: 'var(--olive)', color: 'var(--white)' }}>
                    <th style={{ padding: '1rem' }}>اسم الطالب</th>
                    <th style={{ padding: '1rem' }}>نوع النشاط</th>
                    <th style={{ padding: '1rem' }}>الملزمة</th>
                    <th style={{ padding: '1rem' }}>النتيجة المكتسبة</th>
                    <th style={{ padding: '1rem' }}>التاريخ والوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map(act => (
                    <tr key={act.id} style={{ borderBottom: '1px solid #e8e8e8', background: '#fafafa' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>🧑‍🎓 {act.student_name}</td>
                      <td style={{ padding: '1rem' }}>{act.activity_type}</td>
                      <td style={{ padding: '1rem' }}>📚 {act.material_name}</td>
                      <td style={{ padding: '1rem', color: 'var(--gold)', fontWeight: 'bold', direction: 'ltr', textAlign: 'right' }}>🏆 {act.score_text}</td>
                      <td style={{ padding: '1rem', color: 'var(--gray-muted)', fontSize: '0.85rem' }}>
                        🕒 {new Date(act.timestamp).toLocaleString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                  {activities.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-muted)', fontWeight: '500' }}>
                        لا توجد نشاطات مسجلة بعد. سيظهر نشاط الطلاب هنا عند بدء المنافسة!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
