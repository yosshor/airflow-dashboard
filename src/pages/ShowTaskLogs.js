import React, { useState } from 'react';

function ShowTaskLogs() {
  const [dagId, setDagId] = useState('');
  const [runId, setRunId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [tryNum, setTryNum] = useState(1);
  const [logs, setLogs] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setError('');
    setLogs('');
    const url = `http://localhost:8080/api/v1/dags/${dagId}/dagRuns/${encodeURIComponent(runId)}/taskInstances/${taskId}/logs/${tryNum}`;

    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include', // or omit if using header auth
        // If using basic auth:
        // headers: {
        //   'Accept': 'application/json',
        //   'Authorization': 'Basic ' + btoa('admin:admin'),
        // }
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(`${res.status}: ${body.title}`);
      }

      const data = await res.json(); // response has { content: '...' }
      setLogs(data.content);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Fetch Airflow Task Logs</h2>
      <input placeholder="DAG ID" value={dagId} onChange={(e) => setDagId(e.target.value)} />
      <input placeholder="DagRun ID" value={runId} onChange={(e) => setRunId(e.target.value)} />
      <input placeholder="Task ID" value={taskId} onChange={(e) => setTaskId(e.target.value)} />
      <input type="number" placeholder="Try #" value={tryNum} onChange={(e) => setTryNum(e.target.value)} />
      <button onClick={fetchLogs}>Load Logs</button>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {logs && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f4f4f4', padding: '10px' }}>
          {logs}
        </pre>
      )}
    </div>
  );
}

export default ShowTaskLogs;
