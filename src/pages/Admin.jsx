import { useState, useEffect } from 'react';
import { uploadPdf, fetchMaterials } from '../api/client';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

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

  // Poll every 5 seconds to update the question pool size dynamically
  useEffect(() => {
    loadMaterials();
    loadActivities();
    const interval = setInterval(() => {
      loadMaterials();
      loadActivities();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            لوحة الإدارة
          </h1>
          <p style={{ color: 'var(--gray-muted)', fontSize: '1rem' }}>
            ارفع ملزمة PDF وسيقوم الذكاء الاصطناعي باستخراج جميع الأسئلة تلقائياً وحفظها للطلاب.
          </p>
        </div>

        {/* Upload Section */}
        <div style={{
          background: 'var(--white)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          borderTop: '4px solid var(--olive)',
          marginBottom: '2.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', color: 'var(--black)' }}>
            📤 رفع ملزمة جديدة
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('admin-file-upload').click()}
              style={{
                border: `2px dashed ${isDragActive ? 'var(--gold)' : file ? 'var(--olive)' : 'var(--gray-muted)'}`,
                backgroundColor: isDragActive ? 'rgba(201, 162, 39, 0.06)' : file ? 'rgba(86, 111, 65, 0.05)' : '#fafafa',
                borderRadius: '10px',
                padding: '3rem 2rem',
                textAlign: 'center',
                cursor: 'pointer',
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
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>
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
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                fontWeight: '700',
                borderRadius: '8px',
                border: 'none',
                cursor: !file || uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
                backgroundColor: uploadStatus === 'uploading' ? 'var(--gray-muted)' : 'var(--olive)',
                color: 'var(--white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  جاري رفع الملف للسيرفر...
                </>
              ) : '🚀 بدء معالجة الملف في الخلفية'}
            </button>
          </form>

          {/* Upload Result */}
          {uploadMessage && (
            <div style={{
              marginTop: '1.25rem',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              backgroundColor: uploadStatus === 'error' ? '#fff5f5' : '#f0f7ed',
              color: uploadStatus === 'error' ? '#c0392b' : '#2d6a4f',
              border: `1px solid ${uploadStatus === 'error' ? '#fbb' : '#b7e0c3'}`,
              fontSize: '1rem',
              fontWeight: '500',
              lineHeight: '1.6'
            }}>
              {uploadMessage}
            </div>
          )}
        </div>

        {/* Materials Library */}
        <div style={{
          background: 'var(--white)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          borderTop: '4px solid var(--gold)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
              📚 مكتبة الملازم
            </h2>
            <button
              onClick={loadMaterials}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--gray-muted)',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--olive-dark)',
                fontWeight: '600'
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
              textAlign: 'center',
              padding: '3rem',
              color: 'var(--gray-muted)',
              border: '2px dashed var(--gray-muted)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📭</div>
              <p style={{ margin: 0, fontWeight: '500' }}>لا توجد ملازم بعد. ارفع أول ملزمة من الأعلى!</p>
            </div>
          )}

          {!loadingMaterials && materials.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              {materials.map((m) => (
                <div key={m.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  border: '1px solid #e8e8e8',
                  borderRadius: '8px',
                  borderInlineStart: '4px solid var(--olive)',
                  background: '#fafafa',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <p style={{ margin: 0, fontWeight: '700', color: 'var(--black)', fontSize: '1rem' }}>
                      📄 {m.title}
                    </p>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--olive-dark)', fontSize: '0.875rem', fontWeight: '600' }}>
                      {m.question_pool_size} سؤال محفوظ
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      backgroundColor: m.status === 'completed' ? '#e6f4ea' : (m.status === 'failed' ? '#fff5f5' : (m.status === 'paused' ? '#e9ecef' : '#fff8e1')),
                      color: m.status === 'completed' ? '#2d6a4f' : (m.status === 'failed' ? '#c0392b' : (m.status === 'paused' ? '#495057' : '#856404'))
                    }}>
                      {m.status === 'completed' ? '✅ مكتمل' : (m.status === 'failed' ? '❌ فشل الاستخراج' : (m.status === 'paused' ? '⏸️ متوقف مؤقتاً' : '⏳ جاري الاستخراج...'))}
                    </span>
                    {(m.status === 'paused' || m.status === 'failed' || m.status === 'pending') && (
                      <button
                        onClick={() => handleResume(m.id)}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'var(--olive)',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        ▶️ استئناف
                      </button>
                    )}
                    {m.status === 'processing' && (
                      <button
                        onClick={() => handlePause(m.id)}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#f39c12',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
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
                            padding: '0.4rem 0.875rem',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#c0392b',
                            color: '#fff',
                            fontWeight: '700',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          تأكيد الحذف
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          style={{
                            padding: '0.4rem 0.875rem',
                            borderRadius: '6px',
                            border: '1px solid var(--gray-muted)',
                            background: 'transparent',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(m.id)}
                        style={{
                          padding: '0.4rem 0.875rem',
                          borderRadius: '6px',
                          border: '1px solid #fbb',
                          background: '#fff5f5',
                          color: '#c0392b',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        🗑️ حذف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Logs */}
        <div style={{
          background: 'var(--white)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          borderTop: '4px solid var(--gold)',
          marginTop: '2.5rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--black)', marginBottom: '1.5rem' }}>
            📊 سجل النشاطات
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                  <th style={{ padding: '1rem', color: 'var(--olive-dark)' }}>اسم الطالب</th>
                  <th style={{ padding: '1rem', color: 'var(--olive-dark)' }}>نوع النشاط</th>
                  <th style={{ padding: '1rem', color: 'var(--olive-dark)' }}>الملزمة</th>
                  <th style={{ padding: '1rem', color: 'var(--olive-dark)' }}>النتيجة</th>
                  <th style={{ padding: '1rem', color: 'var(--olive-dark)' }}>التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody>
                {activities.map(act => (
                  <tr key={act.id} style={{ borderBottom: '1px solid #e8e8e8' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{act.student_name}</td>
                    <td style={{ padding: '1rem' }}>{act.activity_type}</td>
                    <td style={{ padding: '1rem' }}>{act.material_name}</td>
                    <td style={{ padding: '1rem', color: 'var(--gold)', fontWeight: 'bold', direction: 'ltr', textAlign: 'right' }}>{act.score_text}</td>
                    <td style={{ padding: '1rem', color: 'var(--gray-muted)', fontSize: '0.85rem' }}>
                      {new Date(act.timestamp).toLocaleString('ar-EG')}
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray-muted)' }}>لا توجد نشاطات مسجلة بعد</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
