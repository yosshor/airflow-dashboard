/**
 * @fileoverview AllDagRuns component for displaying all DAGs and their runs in a beautiful, modern layout
 * @author Airflow Dashboard Team
 * @version 1.0.0
 * @requires react
 */

import React, { useEffect, useState } from 'react';

/**
 * AllDagRuns Component
 * 
 * Lists all DAGs and their runs in a card-based, responsive layout with color-coded status badges.
 * Handles loading, error, and empty states gracefully.
 * 
 * @component
 * @example
 * <AllDagRuns />
 */
const AllDagRuns = () => {
  const [dagData, setDagData] = useState([]); // [{ dagId, runs: [], error }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'withRuns', 'withConf', 'success', 'failed'

  useEffect(() => {
    async function fetchAll() {
      try {
        const baseUrl = 'http://localhost:8080';
        // fetch DAGs
        const dagsRes = await fetch(`${baseUrl}/api/v1/dags`);
        if (!dagsRes.ok) throw new Error(`Failed to fetch DAGs: ${dagsRes.status}`);
        const { dags } = await dagsRes.json();

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
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  // Filter logic for DAGs and runs
  const filteredDagData = dagData
    .map(dag => {
      let filteredRuns = dag.runs;
      if (filter === 'withConf') {
        filteredRuns = dag.runs.filter(run => run.conf && Object.keys(run.conf).length > 0);
      } else if (filter === 'success') {
        filteredRuns = dag.runs.filter(run => run.state && run.state.toLowerCase() === 'success');
      } else if (filter === 'failed') {
        filteredRuns = dag.runs.filter(run => run.state && run.state.toLowerCase() === 'failed');
      } else if (filter === 'withRuns') {
        filteredRuns = dag.runs;
      }
      return { ...dag, runs: filteredRuns };
    })
    .filter(dag => {
      if (filter === 'withRuns') {
        return dag.runs.length > 0;
      }
      if (filter === 'withConf' || filter === 'success' || filter === 'failed') {
        return dag.runs.length > 0;
      }
      return true;
    });

  /**
   * Gets the status color for DAG run states
   * @function getStatusColor
   * @param {string} state - DAG run state
   * @returns {string} CSS color value
   */
  const getStatusColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'success':
        return '#48bb78';
      case 'failed':
        return '#f56565';
      case 'running':
        return '#4299e1';
      case 'queued':
        return '#ed8936';
      default:
        return '#718096';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📚 All DAGs & Their Runs</h1>
        <p style={styles.subtitle}>
          Browse all available DAGs and their execution history
        </p>

        {/* Filter Buttons */}
        <div style={styles.filterBar}>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'all' && styles.activeFilterButton)
            }}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'withRuns' && styles.activeFilterButton)
            }}
            onClick={() => setFilter('withRuns')}
          >
            With Runs
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'withConf' && styles.activeFilterButton)
            }}
            onClick={() => setFilter('withConf')}
          >
            With Conf
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'success' && styles.activeFilterButton)
            }}
            onClick={() => setFilter('success')}
          >
            Success
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'failed' && styles.activeFilterButton)
            }}
            onClick={() => setFilter('failed')}
          >
            Failed
          </button>
        </div>

        {loading && <p style={styles.loadingText}>Loading DAGs...</p>}
        {error && <div style={styles.errorMessage}>❌ {error}</div>}
        {!loading && filteredDagData.length === 0 && <p style={styles.emptyText}>No DAGs found for this filter.</p>}

        <div style={styles.dagGrid}>
          {filteredDagData.map(dag => (
            <div key={dag.dagId} style={styles.dagCard}>
              <h2 style={styles.dagTitle}>{dag.dagId}</h2>
              {dag.error && <div style={styles.errorMessage}>❌ Could not load DAG runs.</div>}
              {dag.runs.length === 0 && <p style={styles.emptyText}>No runs found.</p>}
              <div style={styles.runsGrid}>
                {dag.runs.map(run => (
                  <div key={run.dag_run_id} style={styles.runCard}>
                    <div style={styles.runHeader}>
                      <strong style={styles.runId}>{run.dag_run_id.split('T')[0]}</strong>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(run.state)
                      }}>
                        {run.state}
                      </span>
                    </div>
                    <div style={styles.runDetails}>
                      <div style={styles.runInfo}>
                        <span style={styles.infoLabel}>Start:</span>
                        <span style={styles.infoValue}>{new Date(run.start_date).toLocaleString()}</span>
                      </div>
                      {run.end_date && (
                        <div style={styles.runInfo}>
                          <span style={styles.infoLabel}>End:</span>
                          <span style={styles.infoValue}>{new Date(run.end_date).toLocaleString()}</span>
                        </div>
                      )}
                      <div style={styles.runInfo}>
                        <span style={styles.infoLabel}>Conf:</span>
                        <span style={styles.infoValue}><pre style={styles.confPre}>{JSON.stringify(run.conf, null, 2)}</pre></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Help Section */}
        <div style={styles.helpSection}>
          <h3 style={styles.helpTitle}>💡 How to use:</h3>
          <ul style={styles.helpList}>
            <li>Browse all DAGs and their execution history</li>
            <li>Use the filter buttons to quickly find DAGs/runs of interest</li>
            <li>View run status, start/end times, and configuration</li>
            <li>Status badges indicate the state of each run</li>
            <li>Use the search in other pages to filter by DAG</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Styles object for component styling
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    maxWidth: '1200px',
    width: '100%',
    marginTop: '20px'
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '8px',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#718096',
    textAlign: 'center',
    marginBottom: '40px'
  },
  loadingText: {
    fontSize: '1.1rem',
    color: '#718096',
    textAlign: 'center',
    margin: '32px 0'
  },
  errorMessage: {
    background: '#fed7d7',
    color: '#742a2a',
    border: '1px solid #feb2b2',
    padding: '16px',
    borderRadius: '8px',
    margin: '24px 0',
    fontSize: '1rem',
    fontWeight: '500',
    textAlign: 'center'
  },
  emptyText: {
    fontSize: '1.1rem',
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
    margin: '32px 0'
  },
  dagGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '40px',
    marginTop: '32px'
  },
  dagCard: {
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.08)'
  },
  dagTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#007acc',
    marginBottom: '20px',
    textAlign: 'left'
  },
  runsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    justifyItems: 'center',
    alignItems: 'stretch',
    marginTop: '12px'
  },
  runCard: {
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    maxWidth: '380px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
  },
  runHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  runId: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: '#2d3748'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase'
  },
  runDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  runInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: '0.9rem',
    color: '#718096',
    fontWeight: '500'
  },
  infoValue: {
    fontSize: '0.9rem',
    color: '#4a5568',
    fontWeight: '500',
    wordBreak: 'break-word',
    maxWidth: '220px',
    overflow: 'auto'
  },
  confPre: {
    margin: 0,
    fontSize: '0.9rem',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    background: '#f4f4f4',
    borderRadius: '6px',
    padding: '8px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '120px',
    overflow: 'auto'
  },
  helpSection: {
    marginTop: '40px',
    padding: '24px',
    background: '#f7fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  helpTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '16px'
  },
  helpList: {
    color: '#4a5568',
    lineHeight: '1.6',
    paddingLeft: '20px'
  },
  filterBar: {
    display: 'flex',
    gap: '12px',
    margin: '0 auto 32px auto',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 20px',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    background: '#f7fafc',
    color: '#4a5568',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none',
  },
  activeFilterButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderColor: '#667eea',
  },
};

export default AllDagRuns;
