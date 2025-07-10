/**
 * @fileoverview ShowTaskLogs component for fetching and displaying Airflow task logs
 * @author Airflow Dashboard Team
 * @version 1.0.0
 * @requires react
 */

import React, { useState } from 'react';

/**
 * ShowTaskLogs Component
 * 
 * Allows users to fetch and display Airflow task execution logs.
 * Provides a beautiful interface for viewing detailed task logs with
 * proper error handling and loading states.
 * 
 * @component
 * @example
 * <ShowTaskLogs />
 */
export default function ShowTaskLogs() {
  // State for managing log fetching form
  const [dagId, setDagId] = useState(''); // DAG identifier
  const [runId, setRunId] = useState(''); // DAG run identifier
  const [taskId, setTaskId] = useState(''); // Task identifier
  const [tryNum, setTryNum] = useState(1); // Try number for task execution
  const [logs, setLogs] = useState(''); // Retrieved log content
  const [error, setError] = useState(''); // Error message display
  const [isLoading, setIsLoading] = useState(false); // Loading state for better UX
  const [logCount, setLogCount] = useState(0); // Character count for logs

  /**
   * Fetches task logs from Airflow API
   * @async
   * @function fetchLogs
   */
  const fetchLogs = async () => {
    // Validate required fields
    if (!dagId.trim() || !runId.trim() || !taskId.trim()) {
      setError('❌ Error: DAG ID, Run ID, and Task ID are required');
      return;
    }

    setIsLoading(true);
    setError('');
    setLogs('');
    setLogCount(0);

    const url = `http://localhost:8080/api/v1/dags/${encodeURIComponent(dagId.trim())}/dagRuns/${encodeURIComponent(runId.trim())}/taskInstances/${encodeURIComponent(taskId.trim())}/logs/${tryNum}`;

    try {
      const res = await fetch(url, {
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const body = await res.json();
        let errorMessage = 'Failed to fetch logs';
        
        if (res.status === 404) {
          errorMessage = '❌ Error: Task logs not found. Please check your DAG ID, Run ID, and Task ID.';
        } else if (res.status === 400) {
          errorMessage = '❌ Error: Invalid parameters. Please check your input values.';
        } else {
          errorMessage = `❌ Error: ${body.title || 'Unknown error occurred'}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await res.json();
      setLogs(data.content || 'No logs available');
      setLogCount(data.content ? data.content.length : 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets the form to initial state
   * @function handleReset
   */
  const handleReset = () => {
    setDagId('');
    setRunId('');
    setTaskId('');
    setTryNum(1);
    setLogs('');
    setError('');
    setLogCount(0);
  };

  /**
   * Copies logs to clipboard
   * @function copyLogs
   */
  const copyLogs = async () => {
    if (logs) {
      try {
        await navigator.clipboard.writeText(logs);
        // Show temporary success message
        const originalLogs = logs;
        setLogs('✅ Logs copied to clipboard!');
        setTimeout(() => setLogs(originalLogs), 2000);
      } catch (err) {
        setError('❌ Failed to copy logs to clipboard');
      }
    }
  };

  /**
   * Downloads logs as a text file
   * @function downloadLogs
   */
  const downloadLogs = () => {
    if (logs) {
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dagId}_${taskId}_logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>📋 Task Logs Viewer</h1>
        <p style={styles.subtitle}>
          Fetch and view detailed execution logs for Airflow tasks
        </p>

        <form onSubmit={(e) => { e.preventDefault(); fetchLogs(); }} style={styles.form}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="dagId" style={styles.label}>
                DAG ID *
              </label>
              <input
                id="dagId"
                type="text"
                value={dagId}
                onChange={(e) => setDagId(e.target.value)}
                placeholder="Enter DAG ID"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="runId" style={styles.label}>
                Run ID *
              </label>
              <input
                id="runId"
                type="text"
                value={runId}
                onChange={(e) => setRunId(e.target.value)}
                placeholder="Enter DAG Run ID"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label htmlFor="taskId" style={styles.label}>
                Task ID *
              </label>
              <input
                id="taskId"
                type="text"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                placeholder="Enter Task ID"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label htmlFor="tryNum" style={styles.label}>
                Try Number
              </label>
              <input
                id="tryNum"
                type="number"
                min="1"
                value={tryNum}
                onChange={(e) => setTryNum(parseInt(e.target.value) || 1)}
                placeholder="Try number (default: 1)"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.buttonGroup}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(isLoading && styles.disabledButton)
              }}
            >
              {isLoading ? '⏳ Fetching...' : '📋 Fetch Logs'}
            </button>
            
            <button
              type="button"
              onClick={handleReset}
              style={{
                ...styles.button,
                ...styles.secondaryButton
              }}
            >
              🔄 Reset
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Logs Display */}
        {logs && (
          <div style={styles.logsContainer}>
            <div style={styles.logsHeader}>
              <h3 style={styles.logsTitle}>📄 Task Logs</h3>
              <div style={styles.logsStats}>
                <span style={styles.statItem}>📊 {logCount} characters</span>
                <button
                  onClick={copyLogs}
                  style={{
                    ...styles.button,
                    ...styles.smallButton,
                    ...styles.secondaryButton
                  }}
                >
                  📋 Copy
                </button>
                <button
                  onClick={downloadLogs}
                  style={{
                    ...styles.button,
                    ...styles.smallButton,
                    ...styles.secondaryButton
                  }}
                >
                  💾 Download
                </button>
              </div>
            </div>
            
            <div style={styles.logsContent}>
              <pre style={styles.logsText}>
                {logs}
              </pre>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div style={styles.helpSection}>
          <h3 style={styles.helpTitle}>💡 How to use:</h3>
          <ul style={styles.helpList}>
            <li>Enter the DAG ID, Run ID, and Task ID to fetch logs</li>
            <li>Run ID can be found in the DAG runs list</li>
            <li>Task ID is the specific task within the DAG</li>
            <li>Try number defaults to 1 (first attempt)</li>
            <li>Use the copy/download buttons to save logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

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
    maxWidth: '1000px',
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: '4px'
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    ':focus': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '16px'
  },
  button: {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    flex: '1'
  },
  smallButton: {
    padding: '8px 16px',
    fontSize: '0.9rem',
    flex: 'none'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
    }
  },
  secondaryButton: {
    background: '#f7fafc',
    color: '#4a5568',
    border: '2px solid #e2e8f0',
    ':hover': {
      background: '#edf2f7',
      borderColor: '#cbd5e0'
    }
  },
  disabledButton: {
    opacity: '0.6',
    cursor: 'not-allowed',
    transform: 'none'
  },
  errorMessage: {
    background: '#fed7d7',
    color: '#742a2a',
    border: '1px solid #feb2b2',
    padding: '16px',
    borderRadius: '8px',
    marginTop: '24px',
    fontSize: '1rem',
    fontWeight: '500'
  },
  logsContainer: {
    marginTop: '32px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  logsHeader: {
    background: '#f7fafc',
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  logsTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0'
  },
  logsStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statItem: {
    fontSize: '0.9rem',
    color: '#718096',
    fontWeight: '500'
  },
  logsContent: {
    maxHeight: '500px',
    overflow: 'auto',
    background: '#1a202c'
  },
  logsText: {
    margin: '0',
    padding: '20px',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    color: '#e2e8f0',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
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
  }
};
