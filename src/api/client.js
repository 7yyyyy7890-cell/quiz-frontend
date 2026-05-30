import { ar } from '../i18n/ar';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function formatApiError(body, fallback) {
  const detail = body?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'string' ? item : item.msg || JSON.stringify(item)))
      .join(' ');
  }
  return fallback;
}

export async function fetchMaterials() {
  const res = await fetch(`${API_BASE}/api/v1/materials`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body, ar.errors.loadMaterials));
  }
  return res.json();
}

export async function fetchQuiz(materialId, limit = 20) {
  const res = await fetch(`${API_BASE}/api/v1/materials/${materialId}/quiz?limit=${limit}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body, 'فشل في تحميل الاختبار'));
  }
  return res.json();
}

export async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/v1/upload/pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatApiError(body, ar.upload.failed));
  }

  return res.json();
}

export function getWsBase() {
  const env = import.meta.env.VITE_WS_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}
