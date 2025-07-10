import React, { useEffect, useState } from 'react';

const AllDagRuns = () => {
  const [dagData, setDagData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchAll() {
      try {
        const baseUrl = 'http://localhost:8080';
        // const auth = `Basic ${btoa('airflow:airflow')}`;

        // fetch DAGs
        const dagsRes = await fetch(`${baseUrl}/api/v1/dags`);
        if (!dagsRes.ok) throw new Error(`Failed to fetch DAGs: ${dagsRes.status}`);
        const { dags } = await dagsRes.json();
        console.log(dags)

        // fetch each DAG's runs
        const dagRunResults = await Promise.all(
          dags.map(async ({ dag_id }) => {
            const res = await fetch(`${baseUrl}/api/v1/dags/${dag_id}/dagRuns`);

            if (!res.ok) return { dagId: dag_id, runs: [], error: true };
            const data = await res.json();
            return { dagId: dag_id, runs: data.dag_runs || [] };
          })
        );

        setDagData(dagRunResults);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);


  return (
    <div style={{ padding: '2rem' }}>
      <h2>All DAGs & Their Parameters</h2>

      {loading && <p>Loading DAGs...</p>}
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}

      {!loading && dagData.length === 0 && <p>No DAGs found.</p>}

      {dagData.map(dag => (
        <div key={dag.dagId} style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#007acc' }}>{dag.dagId}</h3>

          {dag.error && <p style={{ color: 'crimson' }}>❌ Could not load DAG runs.</p>}

          {dag.runs.length === 0 && <p style={{ fontStyle: 'italic' }}>No runs found.</p>}

          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {dag.runs.map(run => (
              <li key={run.dag_run_id} style={{
                background: '#f9f9f9',
                border: '1px solid #ccc',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div><strong>Run ID:</strong> {run.dag_run_id}</div>
                <div><strong>State:</strong> {run.state}</div>
                <div><strong>Conf:</strong> <pre>{JSON.stringify(run.conf, null, 2)}</pre></div>
              </li>

            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default AllDagRuns;
