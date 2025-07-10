/**
 * @fileoverview AddTask component for triggering Airflow DAGs
 * @author Airflow Dashboard Team
 * @version 1.0.0
 * @requires react
 * @requires ../api/airflowApi
 */

import React, { useState } from 'react';
import { triggerDag } from '../api/airflowApi';

/**
 * AddTask Component
 * 
 * Allows users to trigger Airflow DAGs by providing parameters.
 * Handles form submission, displays success/error messages, and provides
 * a beautiful, responsive interface for DAG execution.
 * 
 * @component
 * @example
 * <AddTask />
 */
export default function AddTask() {
  // State for managing DAG trigger form
  const [dagId, setDagId] = useState('test_hello_world'); // Default DAG ID
  const [param1, setParam1] = useState(''); // User input parameter
  const [param2, setParam2] = useState(''); // Additional parameter
  const [message, setMessage] = useState(''); // Success/error message display
  const [isLoading, setIsLoading] = useState(false); // Loading state for better UX
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  /**
   * Handles form submission and triggers the DAG
   * @async
   * @function handleSubmit
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    
    // Validate required fields
    if (!dagId.trim()) {
      setMessage('Error: DAG ID is required');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Prepare configuration object with non-empty parameters
      const conf = {};
      if (param1.trim()) conf.param1 = param1.trim();
      if (param2.trim()) conf.param2 = param2.trim();

      const res = await triggerDag(dagId, conf);
      setMessage(`✅ Success: DAG triggered with ID ${res.dag_run_id}`);
      setMessageType('success');
      
      // Clear form on success
      setParam1('');
      setParam2('');
    } catch (err) {
      // Handle specific error types
      if (err.message.includes('404')) {
        setMessage('❌ Error: DAG not found. Please check the DAG ID.');
      } else if (err.message.includes('400')) {
        setMessage('❌ Error: Invalid parameters. Please check your input.');
      } else {
        setMessage('❌ Error: Failed to trigger DAG. Please try again.');
      }
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resets the form to initial state
   * @function handleReset
   */
  const handleReset = () => {
    setDagId('test_hello_world');
    setParam1('');
    setParam2('');
    setMessage('');
    setMessageType('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🚀 Trigger Airflow DAG</h1>
        <p style={styles.subtitle}>
          Execute your Airflow DAGs with custom parameters
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="dagId" style={styles.label}>
              DAG ID *
            </label>
            <input
              id="dagId"
              type="text"
              value={dagId}
              onChange={(e) => setDagId(e.target.value)}
              placeholder="Enter DAG ID (e.g., test_hello_world)"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="param1" style={styles.label}>
              Parameter 1
            </label>
            <input
              id="param1"
              type="text"
              value={param1}
              onChange={(e) => setParam1(e.target.value)}
              placeholder="Enter parameter 1 (optional)"
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="param2" style={styles.label}>
              Parameter 2
            </label>
            <input
              id="param2"
              type="text"
              value={param2}
              onChange={(e) => setParam2(e.target.value)}
              placeholder="Enter parameter 2 (optional)"
              style={styles.input}
            />
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
              {isLoading ? '⏳ Triggering...' : '🚀 Trigger DAG'}
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

        {/* Message Display */}
        {message && (
          <div style={{
            ...styles.message,
            ...(messageType === 'success' ? styles.successMessage : styles.errorMessage)
          }}>
            {message}
          </div>
        )}

        {/* Help Section */}
        <div style={styles.helpSection}>
          <h3 style={styles.helpTitle}>💡 How to use:</h3>
          <ul style={styles.helpList}>
            <li>Enter the DAG ID you want to trigger</li>
            <li>Add optional parameters if your DAG requires them</li>
            <li>Click "Trigger DAG" to execute</li>
            <li>Monitor the success/error message below</li>
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
    maxWidth: '600px',
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
  message: {
    padding: '16px',
    borderRadius: '8px',
    marginTop: '24px',
    fontSize: '1rem',
    fontWeight: '500'
  },
  successMessage: {
    background: '#f0fff4',
    color: '#22543d',
    border: '1px solid #9ae6b4'
  },
  errorMessage: {
    background: '#fed7d7',
    color: '#742a2a',
    border: '1px solid #feb2b2'
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
