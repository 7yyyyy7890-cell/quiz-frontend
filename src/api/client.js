import { ar } from '../i18n/ar';

const API_BASE = import.meta.env.VITE_API_URL || 'https://quiz-backend-ten-theta.vercel.app';

export function getApiBase() {
  return API_BASE;
}

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
  const chunkSize = 3 * 1024 * 1024; // 3 MB chunks to bypass Vercel 4.5MB limit
  const totalChunks = Math.ceil(file.size / chunkSize);
  const fileId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  let lastRes = null;
  for (let i = 0; i < totalChunks; i++) {
    const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('file_id', fileId);
    formData.append('chunk_index', i);
    formData.append('total_chunks', totalChunks);
    formData.append('filename', file.name);

    const res = await fetch(`${API_BASE}/api/v1/upload/chunk`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(formatApiError(body, ar.upload.failed));
    }
    lastRes = res;
  }
  
  return lastRes.json();
}

export function getWsBase() {
  const env = import.meta.env.VITE_WS_URL;
  if (env) return env.replace(/\/$/, '');
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}`;
}
