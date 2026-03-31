# Creighton Method Tracker

A web app for tracking the Creighton Model FertilityCare System chart. Built with React, Node.js, and PostgreSQL, deployable via Docker.

## Features

- **Visual fertility map** — 35-day grid with color-coded Creighton stamps
- **Day entry modal** — stamp picker, observation codes (0–10 + letters), sensation, peak day marker
- **Multiple cycles** — create and browse all past cycles
- **Role-based access** — wife, husband, practitioner, and admin roles
- **Practitioner notes** — practitioners can annotate any cycle
- **Admin user management** — admin creates and manages all accounts

## Stamp Types

| Stamp | Color | Meaning |
|---|---|---|
| H / M / L / VL | 🔴 Red | Menstruation (Heavy / Moderate / Light / Very Light) |
| B | 🟤 Brown | Brown discharge / spotting |
| — | 🟢 Green | Dry day (no mucus) |
| 👶 | ⚪ White + baby | Mucus present — potentially fertile |
| 👶 | 🟢 Green + baby | Post-peak days 1–3 |
| — | 🟡 Yellow | Special / unusual discharge |

Observation codes follow the standard Creighton format: a number (`0`, `2`, `4`, `6`, `8`, `10`) optionally followed by letters (`C`, `K`, `L`, `CK`, `KL`, `CKL`, `AD`, `B`). Peak Day is marked with **P**.

## Tech Stack

- **Frontend** — React 18, Vite, Tailwind CSS
- **Backend** — Node.js, Express
- **Database** — PostgreSQL 16
- **Auth** — JWT (email + password)
- **Deployment** — Docker Compose

## Getting Started

### Prerequisites

- Docker and Docker Compose installed on your server

### 1. Clone the repository

```bash
git clone https://github.com/nelsonandreproton/CreightonMethod.git
cd CreightonMethod
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your own values:

```env
DB_PASSWORD=your_strong_password
JWT_SECRET=your_very_long_random_secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=Admin
FRONTEND_URL=https://yourdomain.com
PORT=80
```

### 3. Start the app

```bash
docker compose up -d
```

The app will be available at `http://your-server-ip`.

On first startup, the admin account is automatically created using the values from your `.env` file.

### 4. Create users

1. Log in with the admin account
2. Go to **Users** in the top navigation
3. Create accounts for wife, husband, and/or practitioner

## Project Structure

```
CreightonMethod/
├── backend/
│   ├── src/
│   │   ├── db/           # PostgreSQL pool, migrations, schema
│   │   ├── middleware/   # JWT auth middleware
│   │   └── routes/       # auth, users, cycles, observations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Layout, stamp, modal, notes panel
│   │   ├── context/      # Auth context
│   │   └── pages/        # Login, Dashboard, Chart, Admin
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Roles

| Role | Can enter observations | Can view charts | Can add practitioner notes | Can manage users |
|---|:---:|:---:|:---:|:---:|
| Wife | ✅ | ✅ | — | — |
| Husband | ✅ | ✅ | — | — |
| Practitioner | — | ✅ | ✅ | — |
| Admin | ✅ | ✅ | ✅ | ✅ |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users` | List users (admin) |
| POST | `/api/users` | Create user (admin) |
| PUT | `/api/users/:id` | Update user (admin) |
| DELETE | `/api/users/:id` | Delete user (admin) |
| GET | `/api/cycles` | List all cycles |
| POST | `/api/cycles` | Create cycle |
| GET | `/api/cycles/:id` | Get cycle with observations and notes |
| DELETE | `/api/cycles/:id` | Delete cycle |
| POST | `/api/observations` | Save/update an observation |
| DELETE | `/api/observations/:id` | Delete an observation |
| POST | `/api/observations/:id/notes` | Add practitioner note to a day |
| POST | `/api/observations/cycle/:id/notes` | Add practitioner note to a cycle |
