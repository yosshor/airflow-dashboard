import React, { useEffect, useState } from 'react';
import { listDagRuns } from '../api/airflowApi';

const TaskList = () => {
  const [runs, setRuns] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const dagId = 'test_hello_world';

  useEffect(() => {
    async function fetchRuns() {
      try {
        const res = await listDagRuns(dagId);
        setRuns(res.dag_runs || []);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error loading task runs.');
      } finally {
        setLoading(false);
      }
    }

    fetchRuns();
  }, []);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>DAG Runs for: <span style={styles.dag}>{dagId}</span></h2>

      {loading && <p style={styles.loading}>Loading...</p>}
      {error && <p style={styles.error}>❌ {error}</p>}

      {!loading && runs.length === 0 && <p style={styles.empty}>No DAG runs found.</p>}

      <ul style={styles.list}>
        {runs.map(run => (
          <li key={run.dag_run_id} style={styles.card}>
            <div><strong>Run ID:</strong> {run.dag_run_id}</div>
            <div><strong>State:</strong> <span style={styles.state(run.state)}>{run.state}</span></div>
            <div><strong>Execution Date:</strong> {run.execution_date}</div>
            <div><strong>Conf:</strong> {JSON.stringify(run.conf)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskList;

const styles = {
  container: {
    padding: '2rem',
    fontFamily: 'Arial, sans-serif',
    background: '#f9f9f9',
    minHeight: '100vh'
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '1rem',
    color: '#333'
  },
  dag: {
    color: '#007acc'
  },
  loading: {
    color: '#888'
  },
  error: {
    color: 'crimson',
    fontWeight: 'bold'
  },
  empty: {
    color: '#666',
    fontStyle: 'italic'
  },
  list: {
    listStyle: 'none',
    padding: 0
  },
  card: {
    background: 'white',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)'
  },
  state: (value) => ({
    color:
      value === 'success' ? 'green' :
      value === 'failed' ? 'crimson' :
      value === 'running' ? 'orange' : 'black',
    fontWeight: 'bold'
  })
};
