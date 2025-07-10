import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import AddTask from './pages/AddTask';
import TaskList from './pages/TaskList';
import AllDagRuns from './pages/AllDagRuns';
import ShowTaskLogs from './pages/ShowTaskLogs';
import DagRunExplorer from './pages/DagRunExplorer';

function App() {
  return (
    <Router> {/* ✅ Wrap in Router */}
      <nav style={styles.nav}>
        <Link to="/" style={styles.link}>Add Task</Link>
        <Link to="/tasks" style={styles.link}>Task List</Link>
        <Link to="/all-dags" style={styles.link}>All DAGs</Link>
        <Link to="/logs" style={styles.link}>Task Logs</Link>
        <Link to="/explorer" style={styles.link}>Explore DAG Runs</Link>

      </nav>

      <Routes>
        <Route path="/" element={<AddTask />} />
        <Route path="/tasks" element={<TaskList />} />
        <Route path="/all-dags" element={<AllDagRuns />} />
        <Route path="/logs" element={<ShowTaskLogs />} />
        <Route path="/explorer" element={<DagRunExplorer />} />

      </Routes>
    </Router>
  );
}

export default App;

const styles = {
  nav: {
    padding: '1rem',
    background: '#f4f4f4',
    marginBottom: '2rem'
  },
  link: {
    marginRight: '1rem',
    textDecoration: 'none',
    fontWeight: 'bold',
    color: '#007acc'
  }
};
