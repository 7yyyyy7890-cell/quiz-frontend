import { useState, useEffect } from 'react';
import '../styles/pages.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export default function ApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadKeysStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/keys/status`);
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadKeysStatus();
  }, []);

  return (
    <section className="page admin-page" dir="rtl">
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h1 style={{ color: 'var(--gold)', fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            إدارة الحسابات (API Keys) 🔑
          </h1>
          <p style={{ color: 'var(--gray-muted)', fontSize: '1rem' }}>
            راقب حالة المفاتيح والموديلات المتاحة فيها فورياً للتأكد من توفر الحد المجاني
          </p>
        </div>

        <div style={{
          background: 'var(--white)',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
          borderTop: '4px solid var(--olive)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--black)', margin: 0 }}>
              📊 حالة الحسابات
            </h2>
            <button
              onClick={loadKeysStatus}
              disabled={refreshing}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--olive)',
                background: refreshing ? '#e9ecef' : 'var(--olive)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                color: refreshing ? '#6c757d' : 'var(--white)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
            >
              {refreshing ? 'جاري الفحص... ⏳' : 'تحديث وفحص الحالة 🔄'}
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-muted)' }}>
              جاري فحص جميع المفاتيح والموديلات...
            </div>
          ) : keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-muted)' }}>
              لا توجد مفاتيح مسجلة في النظام. الرجاء إضافتها في ملف .env
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '2px solid #e8e8e8' }}>
                    <th style={{ padding: '1rem', color: 'var(--olive-dark)', width: '60px' }}>#</th>
                    <th style={{ padding: '1rem', color: 'var(--olive-dark)', width: '200px' }}>المفتاح (مموه)</th>
                    <th style={{ padding: '1rem', color: 'var(--olive-dark)', width: '150px' }}>الحالة</th>
                    <th style={{ padding: '1rem', color: 'var(--olive-dark)' }}>الموديلات المتوفرة</th>
                    <th style={{ padding: '1rem', color: 'var(--olive-dark)', width: '250px' }}>الرسالة</th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map(key => (
                    <tr key={key.index} style={{ borderBottom: '1px solid #e8e8e8' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{key.index}</td>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', direction: 'ltr', textAlign: 'right' }}>
                        {key.masked_key}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.3rem 0.8rem',
                          borderRadius: '999px',
                          fontSize: '0.85rem',
                          fontWeight: '700',
                          backgroundColor: key.status === 'active' ? '#e6f4ea' : (key.status === 'rate_limited' ? '#fff8e1' : '#fff5f5'),
                          color: key.status === 'active' ? '#2d6a4f' : (key.status === 'rate_limited' ? '#856404' : '#c0392b')
                        }}>
                          {key.status === 'active' ? '✅ فعال ومتاح' : (key.status === 'rate_limited' ? '⚠️ محدود (نفذ المجاني)' : '❌ غير صالح')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {key.models.length > 0 ? key.models.map(m => (
                            <span key={m} style={{
                              background: '#f1f3f5',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                              border: '1px solid #dee2e6'
                            }}>
                              {m}
                            </span>
                          )) : (
                            <span style={{ color: 'var(--gray-muted)', fontSize: '0.85rem' }}>لا توجد موديلات</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gray-muted)', lineHeight: '1.4' }}>
                        {key.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
