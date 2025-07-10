/**
 * @fileoverview DagRunExplorer component for exploring DAG runs and viewing task logs
 * @author Airflow Dashboard Team
 * @version 1.0.0
 * @requires react
 */

import React, { useState } from 'react';

/**
 * DagRunExplorer Component
 * 
 * Provides a comprehensive interface for exploring DAG runs, viewing task details,
 * and accessing task logs. Features include DAG run listing, task selection,
 * and log viewing with download capabilities.
 * 
 * @component
 * @example
 * <DagRunExplorer />
 */
export default function DagRunExplorer() {
  // State for managing DAG exploration
  const [dagId, setDagId] = useState(''); // DAG identifier
  const [dagRuns, setDagRuns] = useState([]); // List of DAG runs
  const [taskList, setTaskList] = useState([]); // Available tasks in DAG
  const [selectedTaskId, setSelectedTaskId] = useState(''); // Currently selected task
  const [error, setError] = useState(''); // Error message display
  const [selectedRun, setSelectedRun] = useState(null); // Selected DAG run
  const [logContent, setLogContent] = useState(null); // Task log content
  const [isLoading, setIsLoading] = useState(false); // Loading state for better UX
  const [isLoadingTasks, setIsLoadingTasks] = useState(false); // Task loading state

  /**
   * Fetches DAG runs for the specified DAG ID
   * @async
   * @function fetchDagRuns
   */
  const fetchDagRuns = async () => {
    // Validate required fields
    if (!dagId.trim()) {
      setError('❌ Error: DAG ID is required');
      return;
    }

    setIsLoading(true);
    setError('');
    setDagRuns([]);
    setSelectedRun(null);
    setLogContent(null);
    setTaskList([]);
    setSelectedTaskId('');

    try {
      const res = await fetch(`http://localhost:8080/api/v1/dags/${encodeURIComponent(dagId.trim())}/dagRuns`);
      
      if (!res.ok) {
        const body = await res.json();
        let errorMessage = 'Failed to fetch DAG runs';
        
        if (res.status === 404) {
          errorMessage = '❌ Error: DAG not found. Please check the DAG ID.';
        } else {
          errorMessage = `❌ Error: ${body.title || 'Unknown error occurred'}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      setDagRuns(data.dag_runs || []);
      
      if (data.dag_runs && data.dag_runs.length > 0) {
        fetchTasks();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches tasks for the specified DAG
   * @async
   * @function fetchTasks
   */
  const fetchTasks = async () => {
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`http://localhost:8080/api/v1/dags/${encodeURIComponent(dagId.trim())}/tasks`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const data = await res.json();
      const tasks = data.tasks.map(t => t.task_id);
      setTaskList(tasks);
      
      if (tasks.length > 0) {
        setSelectedTaskId(tasks[0]);
      }
    } catch (err) {
      setError('Could not fetch tasks for selected DAG');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  /**
   * Fetches logs for a specific task in a DAG run
   * @async
   * @function fetchLogs
   * @param {string} runId - DAG run ID
   */
  const fetchLogs = async (runId) => {
    if (!selectedTaskId) {
      setError('❌ Error: Please select a task first');
      return;
    }

    setLogContent(null);
    setError('');
    
    try {
      const logUrl = `http://localhost:8080/api/v1/dags/${encodeURIComponent(dagId.trim())}/dagRuns/${encodeURIComponent(runId)}/taskInstances/${encodeURIComponent(selectedTaskId)}/logs/1`;
      
      const res = await fetch(logUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!res.ok) {
        const body = await res.json();
        let errorMessage = 'Failed to fetch logs';
        
        if (res.status === 404) {
          errorMessage = '❌ Error: Task logs not found for this run.';
        } else {
          errorMessage = `❌ Error: ${body.title || 'Unknown error occurred'}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      const parsed = data.content
        .replace(/^\[.*?,\s*"/, '')
        .replace(/"\]$/, '')
        .replace(/\\"/g, '"')
        .replace(/\\n/g, '\n');

      setLogContent({ dagRunId: runId, content: parsed });
    } catch (err) {
      setError(err.message);
    }
  };

  /**
   * Downloads the current log content as a file
   * @function downloadLog
   */
  const downloadLog = () => {
    if (!logContent) return;
    
    const blob = new Blob([logContent.content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${dagId}-${logContent.dagRunId}-${selectedTaskId}-log.log`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  /**
   * Copies log content to clipboard
   * @async
   * @function copyLog
   */
  const copyLog = async () => {
    if (!logContent) return;
    
    try {
      await navigator.clipboard.writeText(logContent.content);
      // Show temporary success message
      const originalContent = logContent.content;
      setLogContent({ ...logContent, content: '✅ Log copied to clipboard!' });
      setTimeout(() => setLogContent({ ...logContent, content: originalContent }), 2000);
    } catch (err) {
      setError('❌ Failed to copy log to clipboard');
    }
  };

  /**
   * Resets the form to initial state
   * @function handleReset
   */
  const handleReset = () => {
    setDagId('');
    setDagRuns([]);
    setTaskList([]);
    setSelectedTaskId('');
    setError('');
    setSelectedRun(null);
    setLogContent(null);
  };

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
        <h1 style={styles.title}>🔍 DAG Run Explorer</h1>
        <p style={styles.subtitle}>
          Explore DAG runs, view task details, and access execution logs
        </p>

        <form onSubmit={(e) => { e.preventDefault(); fetchDagRuns(); }} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="dagId" style={styles.label}>
              DAG ID *
            </label>
            <div style={styles.inputGroup}>
              <input
                id="dagId"
                type="text"
                value={dagId}
                onChange={(e) => setDagId(e.target.value)}
                placeholder="Enter DAG ID (e.g., test_hello_world)"
                style={styles.input}
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.button,
                  ...styles.primaryButton,
                  ...(isLoading && styles.disabledButton)
                }}
              >
                {isLoading ? '⏳ Fetching...' : '🔍 Explore Runs'}
              </button>
            </div>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div style={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Task Selection */}
        {taskList.length > 0 && (
          <div style={styles.taskSection}>
            <label htmlFor="taskSelect" style={styles.label}>
              Select Task:
            </label>
            <select
              id="taskSelect"
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              style={styles.select}
              disabled={isLoadingTasks}
            >
              {taskList.map(task => (
                <option key={task} value={task}>{task}</option>
              ))}
            </select>
            {isLoadingTasks && <span style={styles.loadingText}>Loading tasks...</span>}
          </div>
        )}

        {/* DAG Runs List */}
        {dagRuns.length > 0 && (
          <div style={styles.runsSection}>
            <h3 style={styles.sectionTitle}>
              📊 DAG Runs ({dagRuns.length})
            </h3>
            <div style={styles.runsGrid}>
              {dagRuns.map(run => (
                <div
                  key={run.dag_run_id.split('T')[0]}
                  onClick={() => {
                    setSelectedRun(run);
                    fetchLogs(run.dag_run_id);
                  }}
                  style={{
                    ...styles.runCard,
                    ...(selectedRun?.dag_run_id === run.dag_run_id && styles.selectedRunCard)
                  }}
                >
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
                      <span style={styles.infoValue}>
                        {new Date(run.start_date).toLocaleString()}
                      </span>
                    </div>
                    {run.end_date && (
                      <div style={styles.runInfo}>
                        <span style={styles.infoLabel}>End:</span>
                        <span style={styles.infoValue}>
                          {new Date(run.end_date).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Run Details */}
        {selectedRun && (
          <div style={styles.detailsSection}>
            <div style={styles.detailsHeader}>
              <h3 style={styles.detailsTitle}>
                📋 Selected DAG Run: {selectedRun.dag_run_id}
              </h3>
              <button
                onClick={handleReset}
                style={{
                  ...styles.button,
                  ...styles.secondaryButton
                }}
              >
                🔄 Reset
              </button>
            </div>
            
            <div style={styles.runDetailsCard}>
              <pre style={styles.jsonDisplay}>
                {JSON.stringify(selectedRun, null, 2)}
              </pre>
            </div>

            {/* Log Content */}
            {logContent && (
              <div style={styles.logSection}>
                <div style={styles.logHeader}>
                  <h4 style={styles.logTitle}>
                    📄 Task Log ({selectedTaskId})
                  </h4>
                  <div style={styles.logActions}>
                    <button
                      onClick={copyLog}
                      style={{
                        ...styles.button,
                        ...styles.smallButton,
                        ...styles.secondaryButton
                      }}
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={downloadLog}
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
                
                <div style={styles.logContent}>
                  <pre style={styles.logText}>
                    {logContent.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div style={styles.helpSection}>
          <h3 style={styles.helpTitle}>💡 How to use:</h3>
          <ul style={styles.helpList}>
            <li>Enter a DAG ID to explore its runs</li>
            <li>Select a task from the dropdown to view its logs</li>
            <li>Click on any DAG run to view details and logs</li>
            <li>Use the copy/download buttons to save logs</li>
            <li>View detailed run information in JSON format</li>
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
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
  inputGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },
  input: {
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    flex: '1',
    ':focus': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
  },
  select: {
    padding: '12px 16px',
    fontSize: '1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    outline: 'none',
    background: 'white',
    ':focus': {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    }
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
  taskSection: {
    marginTop: '24px',
    padding: '20px',
    background: '#f7fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  loadingText: {
    fontSize: '0.9rem',
    color: '#718096',
    fontStyle: 'italic',
    marginLeft: '12px'
  },
  runsSection: {
    marginTop: '32px'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: '20px'
  },
  runsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    justifyItems: 'center',
    alignItems: 'stretch',
  },
  runCard: {
    background: 'white',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    maxWidth: '380px',
    width: '100%',
    boxSizing: 'border-box',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
      borderColor: '#667eea'
    }
  },
  selectedRunCard: {
    borderColor: '#667eea',
    background: '#f0f4ff',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
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
    fontWeight: '500'
  },
  detailsSection: {
    marginTop: '32px'
  },
  detailsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  detailsTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0'
  },
  runDetailsCard: {
    background: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px'
  },
  jsonDisplay: {
    margin: '0',
    fontSize: '0.9rem',
    lineHeight: '1.5',
    color: '#4a5568',
    fontFamily: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxHeight: '300px',
    overflow: 'auto'
  },
  logSection: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  logHeader: {
    background: '#f7fafc',
    padding: '16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px'
  },
  logTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#2d3748',
    margin: '0'
  },
  logActions: {
    display: 'flex',
    gap: '8px'
  },
  logContent: {
    maxHeight: '400px',
    overflow: 'auto',
    background: '#1a202c'
  },
  logText: {
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
