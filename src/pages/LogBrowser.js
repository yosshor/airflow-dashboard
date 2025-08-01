/**
 * @fileoverview LogBrowser component for exploring and downloading Airflow task logs using the Airflow REST API
 * @author Airflow Dashboard Team
 * @version 1.2.0
 * @requires react
 * @requires @mui/material
 *
 * This component builds a log tree using the Airflow REST API endpoints:
 * - /api/v1/dags
 * - /api/v1/dags/{dag_id}/dagRuns
 * - /api/v1/dags/{dag_id}/dagRuns/{dag_run_id}/taskInstances
 *
 * When a log file is selected, it fetches the log content using:
 * - /api/v1/dags/{dag_id}/dagRuns/{dag_run_id}/taskInstances/{task_id}/logs/{try_number}
 *
 * The download button uses Material-UI for a modern look and shows a loading spinner while downloading.
 */

import React, { useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';

/**
 * LogBrowser Component
 *
 * Allows users to browse, view, and download Airflow log files grouped by DAG/run/task.
 * Includes search functionality to filter DAGs by name.
 *
 * @component
 * @example
 * <LogBrowser />
 */
export default function LogBrowser() {
  // State for log tree, selected log, log content, loading, and errors
  const [logTree, setLogTree] = useState([]); // Log tree structure
  const [filteredLogTree, setFilteredLogTree] = useState([]); // Filtered log tree based on search
  const [expanded, setExpanded] = useState({}); // Collapsed/expanded state
  const [selectedLog, setSelectedLog] = useState(null); // Selected log file object
  const [logContent, setLogContent] = useState(''); // Content of selected log
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingLog, setLoadingLog] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false); // Download loading state
  const [searchTerm, setSearchTerm] = useState(''); // Search term for filtering DAGs

  // Fetch log tree on mount
  useEffect(() => {
    async function fetchLogTree() {
      setLoadingTree(true);
      setError('');
      try {
        // 1. Get all DAGs
        const dagsRes = await fetch('/api/v1/dags');
        if (!dagsRes.ok) throw new Error('Failed to fetch DAGs');
        const dagsData = await dagsRes.json();
        const dags = dagsData.dags || [];

        // 2. For each DAG, get its runs
        const dagTrees = await Promise.all(
          dags.map(async (dag) => {
            const dag_id = dag.dag_id;
            const url = `/api/v1/dags/${encodeURIComponent(dag_id)}/dagRuns`
            const runsRes = await fetch(url);
            if (!runsRes.ok) {
              console.log(`Failed to fetch runs for DAG ${dag_id}`);
              return { dag_id, runs: [] };
            }
            const runsData = await runsRes.json();
            const runs = runsData.dag_runs || [];

            // 3. For each run, get its task instances
            const runTrees = await Promise.all(
              runs.map(async (run) => {
                const run_id = run.dag_run_id;
                const tasksRes = await fetch(`/api/v1/dags/${encodeURIComponent(dag_id)}/dagRuns/${encodeURIComponent(run_id)}/taskInstances`);
                if (!tasksRes.ok) {
                  console.log(`Failed to fetch tasks for DAG ${dag_id}, run ${run_id}`);
                  return { run_id, tasks: [] };
                }
                const tasksData = await tasksRes.json();
                const tasks = tasksData.task_instances || [];

                // 4. For each task, create an "attempts" array
                const taskTrees = tasks.map((task) => {
                  const attempts = [];
                  const maxTry = task.try_number || 1;
                  for (let i = 1; i <= maxTry; i++) {
                    attempts.push({
                      filename: `attempt=${i}.log`,
                      dag_id,
                      run_id,
                      task_id: task.task_id,
                      try_number: i,
                    });
                  }
                  return {
                    task_id: task.task_id,
                    attempts,
                  };
                });
                return {
                  run_id,
                  tasks: taskTrees,
                };
              })
            );
            return {
              dag_id,
              runs: runTrees,
            };
          })
        );
        setLogTree(dagTrees);
        setFilteredLogTree(dagTrees); // Initially show all DAGs
      } catch (err) {
        setError(err.message || 'Error loading log tree');
        console.error('Error in fetchLogTree:', err);
      } finally {
        setLoadingTree(false);
      }
    }
    fetchLogTree();
  }, []);

  /**
   * Filters the log tree based on search term
   * @param {string} term - Search term to filter DAGs
   */
  const filterLogTree = (term) => {
    if (!term.trim()) {
      setFilteredLogTree(logTree);
      return;
    }
    
    const filtered = logTree.filter(dag => 
      dag.dag_id.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredLogTree(filtered);
  };

  /**
   * Handles search input changes
   * @param {Event} e - Input change event
   */
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    filterLogTree(term);
  };

  /**
   * Handles expanding/collapsing tree nodes
   * @param {string} key - Unique key for the node
   */
  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * Handles selecting a log file to view
   * @param {Object} logFile - Log file object with dag_id, run_id, task_id, try_number
   */
  const handleSelectLog = async (logFile) => {
    setSelectedLog(logFile);
    setLogContent('');
    setLoadingLog(true);
    setError('');
    try {
      const url = `/api/v1/dags/${encodeURIComponent(logFile.dag_id)}/dagRuns/${encodeURIComponent(logFile.run_id)}/taskInstances/${encodeURIComponent(logFile.task_id)}/logs/${logFile.try_number}`;
      const res = await fetch(url);
      const text = await res.text();
      let content = '';
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data.content)) {
          content = data.content.join('\n');
        } else {
          content = data.content;
        }
      } catch (jsonErr) {
        // Not JSON, treat as plain text
        content = text;
      }
      setLogContent(content);
    } catch (err) {
      setLogContent('');
      setError(err.message || 'Error loading log file');
      console.error('Error in handleSelectLog:', err);
    } finally {
      setLoadingLog(false);
    }
  };

  /**
   * Handles downloading the selected log file
   */
  const handleDownload = () => {
    if (!selectedLog) return;
    setDownloading(true);
    const url = `/api/v1/dags/${encodeURIComponent(selectedLog.dag_id)}/dagRuns/${encodeURIComponent(selectedLog.run_id)}/taskInstances/${encodeURIComponent(selectedLog.task_id)}/logs/${selectedLog.try_number}`;
    fetch(url)
      .then(res => res.text())
      .then(text => {
        let content = '';
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data.content)) {
            content = data.content.join('\n');
          } else {
            content = data.content;
          }
        } catch (jsonErr) {
          // Not JSON, treat as plain text
          content = text;
        }
        const blob = new Blob([content], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = selectedLog.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(err => {
        console.error('Error in handleDownload:', err);
      })
      .finally(() => {
        setDownloading(false);
      });
  };

  /**
   * Renders the log tree recursively
   * @param {Array} tree - Current tree level
   * @param {string} prefix - Key prefix for expansion
   */
  const renderTree = (tree, prefix = '') => {
    return (
      <ul style={styles.treeList}>
        {tree.map((dag) => (
          <li key={dag.dag_id}>
            <div style={styles.treeNode}>
              <span
                style={styles.expandIcon}
                onClick={() => toggleExpand(prefix + dag.dag_id)}
                title={expanded[prefix + dag.dag_id] ? 'Collapse' : 'Expand'}
              >
                {expanded[prefix + dag.dag_id] ? '▼' : '▶'}
              </span>
              <span
                style={styles.dagName}
                onClick={() => toggleExpand(prefix + dag.dag_id)}
                title={expanded[prefix + dag.dag_id] ? 'Collapse' : 'Expand'}
              >
                {dag.dag_id}
              </span>
            </div>
            {expanded[prefix + dag.dag_id] && dag.runs && (
              <ul style={styles.treeList}>
                {dag.runs.map((run) => (
                  <li key={run.run_id}>
                    <div style={styles.treeNode}>
                      <span
                        style={styles.expandIcon}
                        onClick={() => toggleExpand(prefix + dag.dag_id + run.run_id)}
                        title={expanded[prefix + dag.dag_id + run.run_id] ? 'Collapse' : 'Expand'}
                      >
                        {expanded[prefix + dag.dag_id + run.run_id] ? '▼' : '▶'}
                      </span>
                      <span
                        style={styles.runId}
                        onClick={() => toggleExpand(prefix + dag.dag_id + run.run_id)}
                        title={expanded[prefix + dag.dag_id + run.run_id] ? 'Collapse' : 'Expand'}
                      >
                        {run.run_id}
                      </span>
                    </div>
                    {expanded[prefix + dag.dag_id + run.run_id] && run.tasks && (
                      <ul style={styles.treeList}>
                        {run.tasks.map((task) => (
                          <li key={task.task_id}>
                            <div style={styles.treeNode}>
                              <span
                                style={styles.expandIcon}
                                onClick={() => toggleExpand(prefix + dag.dag_id + run.run_id + task.task_id)}
                                title={expanded[prefix + dag.dag_id + run.run_id + task.task_id] ? 'Collapse' : 'Expand'}
                              >
                                {expanded[prefix + dag.dag_id + run.run_id + task.task_id] ? '▼' : '▶'}
                              </span>
                              <span
                                style={styles.taskId}
                                onClick={() => toggleExpand(prefix + dag.dag_id + run.run_id + task.task_id)}
                                title={expanded[prefix + dag.dag_id + run.run_id + task.task_id] ? 'Collapse' : 'Expand'}
                              >
                                {task.task_id}
                              </span>
                            </div>
                            {expanded[prefix + dag.dag_id + run.run_id + task.task_id] && task.attempts && (
                              <ul style={styles.treeList}>
                                {task.attempts.map((attempt) => (
                                  <li key={attempt.filename}>
                                    <span
                                      style={styles.logFile}
                                      onClick={() => handleSelectLog(attempt)}
                                    >
                                      {attempt.filename}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🗂️ Airflow Log Browser</h1>
        <p style={styles.subtitle}>Browse, view, and download Airflow task logs grouped by DAG, run, and task.</p>
        
        {/* Search Input */}
        <div style={styles.searchContainer}>
          <div style={styles.searchInputWrapper}>
            <SearchIcon style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search DAGs..."
              value={searchTerm}
              onChange={handleSearchChange}
              style={styles.searchInput}
            />
          </div>
          {searchTerm && (
            <div style={styles.searchResults}>
              Found {filteredLogTree.length} DAG{filteredLogTree.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {loadingTree ? (
          <div style={styles.loadingSpinnerContainer}>
            <CircularProgress size={40} color="primary" />
            <div style={styles.loadingText}>Loading log tree...</div>
          </div>
        ) : error ? (
          <div style={styles.error}>{error}</div>
        ) : (
          <div style={styles.treeContainer}>
            {filteredLogTree.length === 0 && searchTerm ? (
              <div style={styles.noResults}>
                No DAGs found matching "{searchTerm}"
              </div>
            ) : (
              renderTree(filteredLogTree)
            )}
          </div>
        )}
      </div>
      <div style={styles.viewerCard}>
        <h2 style={styles.viewerTitle}>Log Viewer</h2>
        {selectedLog ? (
          <>
            <div style={styles.viewerHeader}>
              <span style={styles.viewerPath}>{`DAG: ${selectedLog.dag_id} | Run: ${selectedLog.run_id} | Task: ${selectedLog.task_id} | Attempt: ${selectedLog.try_number}`}</span>
              <button
                style={{
                  ...styles.downloadButton,
                  ...(downloading ? styles.downloadButtonLoading : {}),
                }}
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <span style={styles.downloadSpinner}><CircularProgress size={22} color="inherit" /></span>
                ) : (
                  <>
                    <DownloadIcon style={{ marginRight: 6, verticalAlign: 'middle' }} />
                    Download
                  </>
                )}
              </button>
            </div>
            <div style={styles.logBox}>
              {loadingLog ? (
                <div style={styles.loading}>Loading log...</div>
              ) : (
                <pre style={styles.logContent}>{logContent}</pre>
              )}
            </div>
          </>
        ) : (
          <div style={styles.emptyViewer}>Select a log file to view its contents.</div>
        )}
      </div>
    </div>
  );
}

// Styles for the LogBrowser component
const styles = {
  container: {
    display: 'flex',
    gap: '2rem',
    padding: '2rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
    minHeight: '100vh',
    fontFamily: 'Segoe UI, Arial, sans-serif',
  },
  card: {
    flex: 1,
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    padding: '2rem',
    minWidth: '350px',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
    color: '#4f46e5',
  },
  subtitle: {
    color: '#555',
    marginBottom: '1.5rem',
  },
  searchContainer: {
    marginBottom: '1.5rem',
  },
  searchInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    color: '#9ca3af',
    fontSize: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'inherit',
  },
  searchResults: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  noResults: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    padding: '2rem',
  },
  treeContainer: {
    overflowY: 'auto',
    maxHeight: '60vh',
    paddingRight: '1rem',
  },
  treeList: {
    listStyle: 'none',
    paddingLeft: '1.2em',
    margin: 0,
  },
  treeNode: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.2em',
    cursor: 'pointer',
  },
  expandIcon: {
    width: '1.2em',
    display: 'inline-block',
    cursor: 'pointer',
    color: '#6366f1',
    fontWeight: 'bold',
    marginRight: '0.2em',
    userSelect: 'none',
  },
  dagName: {
    color: '#1e293b',
    fontWeight: 'bold',
    fontSize: '1.1em',
  },
  runId: {
    color: '#334155',
    fontWeight: '500',
    fontSize: '1em',
  },
  taskId: {
    color: '#6366f1',
    fontWeight: '500',
    fontSize: '0.98em',
  },
  logFile: {
    color: '#0ea5e9',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.97em',
    marginLeft: '0.5em',
  },
  loading: {
    color: '#6366f1',
    fontWeight: 'bold',
    margin: '1em 0',
  },
  error: {
    color: 'crimson',
    fontWeight: 'bold',
    margin: '1em 0',
  },
  viewerCard: {
    flex: 2,
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    padding: '2rem',
    minWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  viewerTitle: {
    fontSize: '1.4rem',
    color: '#4f46e5',
    marginBottom: '1rem',
  },
  viewerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  viewerPath: {
    fontFamily: 'monospace',
    color: '#64748b',
    fontSize: '0.98em',
    wordBreak: 'break-all',
  },
  downloadButton: {
    background: 'linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '0.4em 1.5em',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1em',
    transition: 'background 0.2s',
    display: 'flex',
    alignItems: 'center',
    minWidth: '120px',
    justifyContent: 'center',
    position: 'relative',
    boxShadow: '0 2px 8px rgba(99,102,241,0.08)',
  },
  downloadButtonLoading: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  downloadSpinner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  logBox: {
    background: '#f1f5f9',
    borderRadius: '8px',
    padding: '1em',
    minHeight: '300px',
    maxHeight: '60vh',
    overflowY: 'auto',
    marginTop: '0.5em',
    fontFamily: 'Fira Mono, monospace',
    fontSize: '0.98em',
    color: '#222',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  logContent: {
    whiteSpace: 'pre-wrap',
    margin: 0,
  },
  emptyViewer: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: '2em',
    textAlign: 'center',
  },
  loadingSpinnerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  loadingText: {
    marginTop: '1em',
    color: '#6366f1',
    fontWeight: 'bold',
    fontSize: '1.1em',
  },
}; 