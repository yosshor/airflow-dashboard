// Base URL: make sure to use relative path if you're using React proxy
const BASE_URL = 'http://localhost:8080/api/v1';

export async function triggerDag(dagId, conf = {}) {
  const response = await fetch(`${BASE_URL}/dags/${dagId}/dagRuns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conf })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.title || 'Failed to trigger DAG');
  }

  return await response.json();
}

export async function listDagRuns(dagId) {
  const response = await fetch(`${BASE_URL}/dags/${dagId}/dagRuns`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.title || 'Failed to list DAG runs');
  }

  return await response.json();
}
