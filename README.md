# Airflow Dashboard

A modern React-based web application for managing and monitoring Apache Airflow DAGs through an intuitive dashboard interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Airflow Setup](#airflow-setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Airflow Dashboard provides a user-friendly web interface for interacting with Apache Airflow. It allows users to trigger DAGs, monitor task runs, view logs, and explore DAG execution history without needing to use the Airflow CLI or web UI directly.

### Key Benefits

- **Intuitive Interface**: Clean, modern React-based UI
- **Real-time Monitoring**: Track DAG runs and task status
- **Easy DAG Triggering**: Simple form-based DAG execution
- **Log Viewing**: Access task logs directly from the dashboard
- **No Authentication Required**: Simplified setup for development

## ✨ Features

### Core Functionality

- **Add Task**: Trigger Airflow DAGs with custom parameters
- **Task List**: View and manage all DAG runs
- **All DAGs**: Browse and explore available DAGs
- **Task Logs**: Access detailed task execution logs
- **DAG Run Explorer**: Comprehensive DAG run analysis

### Technical Features

- **React Router**: Single-page application with client-side routing
- **Axios Integration**: Robust HTTP client for API communication
- **Error Handling**: Comprehensive error management and user feedback
- **Responsive Design**: Works on desktop and mobile devices
- **Modern JavaScript**: ES6+ features and async/await patterns

## 🔧 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v14 or higher)
- **npm** (v6 or higher)
- **Python** (3.8-3.11)
- **Apache Airflow** (2.9.1)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yosshor/airflow-dashboard.git
cd airflow-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start the Development Server

```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## 🔧 Airflow Setup

### Quick Setup

1. **Create Virtual Environment**:
   ```bash
   python3 -m venv airflow_venv
   source airflow_venv/bin/activate  # On Windows: airflow_venv\Scripts\activate
   ```

2. **Install Airflow**:
   ```bash
   export AIRFLOW_VERSION=2.9.1
   export PYTHON_VERSION=3.10
   export CONSTRAINT_URL="https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"
   
   pip install --upgrade pip setuptools wheel
   pip install "apache-airflow==${AIRFLOW_VERSION}" --constraint "$CONSTRAINT_URL"
   ```

3. **Initialize Airflow**:
   ```bash
   export AIRFLOW_HOME=~/airflow
   airflow db init
   
   airflow users create \
     --username admin \
     --password admin \
     --firstname Admin \
     --lastname User \
     --role Admin \
     --email admin@example.com
   ```

4. **Configure Airflow** (Edit `~/airflow/airflow.cfg`):
   ```ini
   [api]
   auth_backends = airflow.api.auth.backend.default
   access_control_allow_origins = http://localhost:3000
   access_control_allow_headers = Content-Type
   access_control_allow_methods = GET,POST,PUT,OPTIONS,DELETE
   access_control_allow_credentials = False
   ```

5. **Start Airflow Services**:
   ```bash
   # Terminal 1: Start Web Server
   airflow webserver --port 8080
   
   # Terminal 2: Start Scheduler
   airflow scheduler
   ```

### Example DAG

Create a test DAG in `~/airflow/dags/test_hello_world.py`:

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime

def hello():
    print("Hello from Airflow!")

with DAG(
    dag_id="test_hello_world",
    start_date=datetime(2023, 1, 1),
    schedule_interval=None,
    catchup=False
) as dag:
    PythonOperator(
        task_id="print_hello",
        python_callable=hello
    )
```

## 📖 Usage

### Navigation

The dashboard includes five main sections:

1. **Add Task** (`/`): Trigger DAGs with parameters
2. **Task List** (`/tasks`): View all DAG runs
3. **All DAGs** (`/all-dags`): Browse available DAGs
4. **Task Logs** (`/logs`): Access task execution logs
5. **Explore DAG Runs** (`/explorer`): Detailed DAG run analysis

### Triggering a DAG

1. Navigate to the "Add Task" page
2. Enter the DAG ID (default: `test_hello_world`)
3. Provide any required parameters
4. Click "Trigger" to execute the DAG
5. View success/error messages

### Viewing Logs

1. Go to the "Task Logs" page
2. Enter DAG ID and task ID
3. View detailed execution logs
4. Monitor task status and output

## 📁 Project Structure

```
airflow-dashboard/
├── public/                 # Static assets
├── src/
│   ├── api/
│   │   └── airflowApi.js  # Airflow API integration
│   ├── pages/
│   │   ├── AddTask.js     # DAG trigger component
│   │   ├── AllDagRuns.js  # DAG listing component
│   │   ├── DagRunExplorer.js # DAG run analysis
│   │   ├── ShowTaskLogs.js # Log viewing component
│   │   └── TaskList.js    # Task list component
│   ├── App.js             # Main application component
│   └── index.js           # Application entry point
├── .cursorrules           # Code documentation standards
├── AirflowSetup.md        # Detailed Airflow setup guide
├── package.json           # Project dependencies
└── README.md             # This file
```

## 🔌 API Documentation

### Base Configuration

The application communicates with Airflow's REST API at `http://localhost:8080/api/v1`.

### Available Endpoints

#### Trigger DAG
```javascript
POST /api/v1/dags/{dagId}/dagRuns
Content-Type: application/json

{
  "conf": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

#### List DAG Runs
```javascript
GET /api/v1/dags/{dagId}/dagRuns
```

#### Get DAG Details
```javascript
GET /api/v1/dags/{dagId}
```

#### Get Task Logs
```javascript
GET /api/v1/dags/{dagId}/dagRuns/{dagRunId}/taskInstances/{taskId}/logs
```

### Error Handling

The API includes comprehensive error handling:

- **404**: DAG not found
- **400**: Invalid request parameters
- **500**: Server error
- **Network Errors**: Connection issues

## 🛠️ Development

### Available Scripts

- `npm start`: Start development server
- `npm test`: Run test suite
- `npm run build`: Build for production
- `npm run eject`: Eject from Create React App

### Code Standards

This project follows strict documentation standards defined in `.cursorrules`:

- **JSDoc Comments**: All functions and components documented
- **Component Documentation**: Props, state, and usage examples
- **Error Handling**: Comprehensive error documentation
- **Performance Notes**: Optimization considerations
- **Security Guidelines**: Authentication and validation requirements

### Adding New Features

1. **Create Component**: Add new React components in `src/pages/`
2. **Update Router**: Add routes in `src/App.js`
3. **API Integration**: Extend `src/api/airflowApi.js`
4. **Documentation**: Follow `.cursorrules` standards
5. **Testing**: Add appropriate test cases

### Environment Variables

Create a `.env` file for configuration:

```env
REACT_APP_AIRFLOW_API_URL=http://localhost:8080/api/v1
REACT_APP_AIRFLOW_WEBSERVER_URL=http://localhost:8080
```

## 🤝 Contributing

### Development Workflow

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/new-feature`
3. **Follow Code Standards**: Adhere to `.cursorrules`
4. **Add Documentation**: Include JSDoc comments
5. **Test Changes**: Ensure all functionality works
6. **Submit Pull Request**: Include detailed description

### Code Quality Checklist

- [ ] JSDoc comments for all functions/components
- [ ] Clear variable and function names
- [ ] Error handling documented
- [ ] Usage examples provided
- [ ] File header comments added
- [ ] Complex logic explained
- [ ] Performance considerations noted
- [ ] Security considerations documented

## 🔧 Troubleshooting

### Common Issues

#### Airflow Connection Issues

**Problem**: Cannot connect to Airflow API
**Solution**: 
1. Verify Airflow is running on port 8080
2. Check `airflow.cfg` configuration
3. Ensure CORS settings are correct

#### React App Won't Start

**Problem**: Development server fails to start
**Solution**:
1. Check Node.js version (v14+ required)
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and reinstall: `npm install`

#### DAG Triggering Fails

**Problem**: DAG trigger returns error
**Solution**:
1. Verify DAG ID exists in Airflow
2. Check DAG is not paused
3. Ensure scheduler is running
4. Review DAG configuration

#### CORS Errors

**Problem**: Browser shows CORS errors
**Solution**:
1. Verify `access_control_allow_origins` in `airflow.cfg`
2. Restart Airflow webserver
3. Clear browser cache

### Debug Mode

Enable debug logging in Airflow:

```bash
export AIRFLOW__LOGGING__LOGGING_LEVEL=DEBUG
airflow webserver --port 8080
```

### API Testing

Test Airflow API directly:

```bash
# List DAGs
curl http://localhost:8080/api/v1/dags

# Trigger DAG
curl -X POST http://localhost:8080/api/v1/dags/test_hello_world/dagRuns \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Apache Airflow](https://airflow.apache.org/) - Workflow management platform
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Create React App](https://create-react-app.dev/) - React application boilerplate

---

**Note**: This setup is configured for development use without authentication. For production deployment, implement proper authentication and security measures.
