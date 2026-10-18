# Full-Stack Todo Application

A classroom friendly CRUD app built with React + Vite, Django REST Framework, and SQLite. React manages the interface and sends HTTP requests with `fetch()`. Django validates each request and reads or writes Todo records in SQLite.

**Live browser demo:** https://damnsunnyy.github.io/TODO-APP/  
The Pages demo uses browser `localStorage` so its create, edit, complete, search, and delete flows work without a server. Those demo tasks stay in the current browser and are separate from the SQLite-backed API mode used locally.

## Features

- Create, list, edit, complete, and delete tasks
- Data persists in SQLite when the page is refreshed
- Loading and error messages
- Task totals, All/Pending/Completed filters, and title search
- Clear completed tasks and show each task's creation date
- Responsive layout

## Run locally

Use two terminals from the project folder.

### 1. Start Django

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Django serves the API at `http://127.0.0.1:8000/api/todos/`. The SQLite database is created at `backend/todo_data.sqlite3`.

### 2. Start React + Vite

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. Vite proxies `/api` requests to Django. CORS is also configured for the local development hostnames.

## GitHub Pages deployment

The `deploy-pages.yml` workflow builds the React client with `VITE_DEMO_MODE=true` and publishes `frontend/dist` whenever changes reach `main`. The Django API remains a local deployment and is not hosted by GitHub Pages.

## API endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/todos/` | List todos, newest first |
| POST | `/api/todos/` | Create a todo with `title` |
| GET | `/api/todos/<id>/` | Retrieve one todo |
| PATCH | `/api/todos/<id>/` | Change `title` or `completed` |
| PUT | `/api/todos/<id>/` | Replace a todo |
| DELETE | `/api/todos/<id>/` | Delete a todo |

Todo JSON contains `id`, `title`, `completed`, and `created_at`. The server trims titles and rejects blank values.

## Project layout

```text
backend/    Django settings, Todo model, serializer, API views and URLs
frontend/   React interface, styles and Vite configuration
```

## How the request reaches the database

1. A React event handler sends an HTTP request and JSON to `/api/todos/`.
2. Django matches the URL to a generic REST view.
3. The serializer validates JSON and converts it to or from a Todo model.
4. Django reads or writes the SQLite database and returns JSON.
5. React updates state, and React redraws the changed list.
