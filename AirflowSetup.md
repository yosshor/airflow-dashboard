# Apache Airflow (2.9.1) Setup Guide (No Auth)

This guide installs Apache Airflow with public API access enabled (`auth_backends = airflow.api.auth.backend.default`) and no authentication headers required for frontend calls.

---

## 📦 Requirements

* Python 3.8–3.11
* pip
* virtualenv (`pip install virtualenv`)
* SQLite (default DB)

---

## 🔧 Install Steps

### 1. Set up virtual environment

```bash
python3 -m venv airflow_venv
source airflow_venv/bin/activate
```

### 2. Install Airflow with constraints

```bash
export AIRFLOW_VERSION=2.9.1
export PYTHON_VERSION=3.10
export CONSTRAINT_URL="https://raw.githubusercontent.com/apache/airflow/constraints-${AIRFLOW_VERSION}/constraints-${PYTHON_VERSION}.txt"

pip install --upgrade pip setuptools wheel
pip install "apache-airflow==${AIRFLOW_VERSION}" --constraint "$CONSTRAINT_URL"
```

---

## ⚙️ Initial Setup

### 3. Initialize database and create admin user

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

### 4. Update `airflow.cfg` to disable API auth

In `[api]` section:

```ini
[api]
auth_backends = airflow.api.auth.backend.default
access_control_allow_origins = http://localhost:3000
access_control_allow_headers = Content-Type
access_control_allow_methods = GET,POST,PUT,OPTIONS,DELETE
access_control_allow_credentials = False
```

---

## ▶️ Run Airflow

```bash
airflow webserver --port 8080
```

In another terminal:

```bash
airflow scheduler
```

---

## 🧪 Test API

### List DAGs:

```bash
curl http://localhost:8080/api/v1/dags
```

### Trigger a DAG:

```bash
curl -X POST http://localhost:8080/api/v1/dags/test_hello_world/dagRuns \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 💻 Example React API (no auth)

```js
// api/airflowApi.js
const BASE_URL = 'http://localhost:8080/api/v1';

export async function triggerDag(dagId, conf = {}) {
  const response = await fetch(`${BASE_URL}/dags/${dagId}/dagRuns`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conf })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.title || 'Failed to trigger DAG');
  }

  return await response.json();
}

export async function listDagRuns(dagId) {
  const response = await fetch(`${BASE_URL}/dags/${dagId}/dagRuns`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.title || 'Failed to list DAG runs');
  }

  return await response.json();
}
```

> ⚠️ No headers or credentials required — this works only because `auth_backends = default`.

---

## 👨‍📄 Example DAG

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

---

## 🌐 React `package.json`

```json
"proxy": "http://localhost:8080"
```

This allows fetch calls like `/api/v1/dags` from `localhost:3000`.

---

## ✅ All Set

* Start Airflow
* Visit [http://localhost:8080](http://localhost:8080)
* Connect your React app
* No login or auth required

Great for dev. Not secure for production. ⚠️
