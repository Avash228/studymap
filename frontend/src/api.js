const API_BASE = 'https://studymap-yrde.onrender.com';

export async function fetchSubjects() {
  const response = await fetch(`${API_BASE}/subjects/`);
  return response.json();
}

export async function fetchTopics(subjectId) {
  const response = await fetch(`${API_BASE}/topics/?subject_id=${subjectId}`);
  return response.json();
}

export async function analyzeScores(subjectId, scores) {
  const response = await fetch(`${API_BASE}/analyze/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subject_id: subjectId,
      scores,
    }),
  });

  return response.json();
}