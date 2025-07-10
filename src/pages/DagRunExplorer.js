import React, { useState } from 'react';

export default function DagRunExplorer() {
    const [dagId, setDagId] = useState('');
    const [dagRuns, setDagRuns] = useState([]);
    const [taskList, setTaskList] = useState([]);
    const [selectedTaskId, setSelectedTaskId] = useState('');
    const [error, setError] = useState('');
    const [selectedRun, setSelectedRun] = useState(null);
    const [logContent, setLogContent] = useState(null);

    const fetchDagRuns = async () => {
        setError('');
        setDagRuns([]);
        setSelectedRun(null);
        setLogContent(null);
        setTaskList([]);
        setSelectedTaskId('');

        try {
            const res = await fetch(`http://localhost:8080/api/v1/dags/${dagId}/dagRuns`);
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.title || 'Failed to fetch DAG runs');
            }
            const data = await res.json();
            setDagRuns(data.dag_runs || []);
            fetchTasks();
        } catch (err) {
            setError(err.message);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/v1/dags/${dagId}/tasks`, {
                headers: {
                    'Authorization': 'Basic ' + btoa('admin:admin'),
                }
            });
            if (!res.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const data = await res.json();
            const tasks = data.tasks.map(t => t.task_id);
            setTaskList(tasks);
            if (tasks.length > 0) setSelectedTaskId(tasks[0]);
        } catch (err) {
            setError('Could not fetch tasks for selected DAG');
        }
    };

    const fetchLogs = async (runId) => {
        if (!selectedTaskId) return;
        setLogContent(null);
        setError('');
        try {
            const logUrl = `http://localhost:8080/api/v1/dags/${dagId}/dagRuns/${encodeURIComponent(runId)}/taskInstances/${selectedTaskId}/logs/1`;
            console.log(logUrl)
            const res = await fetch(logUrl, {
                headers: {
                    'Authorization': 'Basic ' + btoa('admin:admin'),
                    'Accept': 'application/json',
                },
            });
            if (!res.ok) {
                const body = await res.json();
                throw new Error(body.title || 'Failed to fetch logs');
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

    const downloadLog = () => {
        if (!logContent) return;
        const blob = new Blob([
            logContent.content
        ], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${dagId}-${logContent.dagRunId}-${selectedTaskId}-log.log`;
        link.click();
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h2>DAG Run Explorer & Log Viewer</h2>

            <input
                placeholder="Enter DAG ID (e.g. test_hello_world)"
                value={dagId}
                onChange={(e) => setDagId(e.target.value)}
                style={{ padding: '0.5rem', width: '300px' }}
            />
            <button onClick={fetchDagRuns} style={{ marginLeft: '1rem' }}>Fetch Runs</button>

            {error && <p style={{ color: 'red' }}>❌ {error}</p>}

            {taskList.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                    <label>Select Task: </label>
                    <select value={selectedTaskId} onChange={(e) => setSelectedTaskId(e.target.value)}>
                        {taskList.map(task => (
                            <option key={task} value={task}>{task}</option>
                        ))}
                    </select>
                </div>
            )}

            {dagRuns.length > 0 && (
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '2rem' }}>
                    {dagRuns.map(run => (
                        <li
                            key={run.dag_run_id}
                            onClick={() => {
                                setSelectedRun(run);
                                fetchLogs(run.dag_run_id);
                            }}
                            style={{
                                cursor: 'pointer',
                                padding: '1rem',
                                marginBottom: '1rem',
                                background: '#f9f9f9',
                                border: '1px solid #ccc',
                                borderRadius: '6px'
                            }}
                        >
                            <strong>{run.dag_run_id}</strong> – {run.state}
                            <br />
                            <small>Start: {run.start_date}</small>
                        </li>
                    ))}
                </ul>
            )}

            {selectedRun && (
                <div style={{ marginTop: '2rem', background: '#e8f5e9', padding: '1rem', borderRadius: '5px' }}>
                    <h3>Selected DAG Run: {selectedRun.dag_run_id}</h3>
                    <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selectedRun, null, 2)}</pre>

                    {logContent && (
                        <>
                            <h4>Task Log ({selectedTaskId})</h4>
                            <pre style={{ background: '#f4f4f4', padding: '1rem', whiteSpace: 'pre-wrap' }}>
                                {logContent.content}
                            </pre>
                            <button onClick={downloadLog}>Download Log as .log</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
