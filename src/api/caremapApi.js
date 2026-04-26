const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function searchCareMap(query, topK = 10) {
  return request('/api/query', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK }),
  });
}

export function askGenie(question, conversationId) {
  return request('/api/genie', {
    method: 'POST',
    body: JSON.stringify({ question, conversation_id: conversationId || null }),
  });
}

export function getDeserts() {
  return request('/api/deserts');
}

export function getQuality() {
  return request('/api/quality');
}

export function getSummary() {
  return request('/api/summary');
}
