# CareMap India UI

React frontend plus a FastAPI Databricks gateway for CareMap AI.

## Frontend

```bash
npm install
npm start
```

Optional frontend env:

```bash
REACT_APP_API_BASE_URL=http://localhost:8000
```

## Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

Fill `.env` with Databricks values:

- `DATABRICKS_HOST`
- `DATABRICKS_TOKEN`
- `DATABRICKS_WAREHOUSE_ID`
- `DATABRICKS_GENIE_SPACE_ID`
- `DATABRICKS_VECTOR_ENDPOINT`
- `DATABRICKS_VECTOR_INDEX`

The frontend never stores Databricks credentials. It calls the backend, and the backend calls Databricks SQL, Mosaic AI Vector Search, and Genie Conversation APIs.
