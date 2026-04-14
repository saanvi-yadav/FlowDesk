# FlowDesk - Complete Project Setup Guide

## Overview

FlowDesk is a comprehensive company management system built with React (frontend), Flask (backend), and MySQL (database).

## Prerequisites

- **MySQL Server** (8.0 or higher) - Download from https://dev.mysql.com/downloads/mysql/
- **Python 3.8+** - Download from https://python.org
- **Node.js 16+** - Download from https://nodejs.org
- **Git** - For cloning the repository

## Quick Setup (For Teammates)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd FlowDesk
```

### 2. Database Setup

```bash
# Make sure MySQL is running, then run:
mysql -u root -p < database/database_setup.sql
```

When prompted, enter your MySQL root password.

**What this does:**

- Creates `company_management_system` database
- Creates all required tables with proper relationships
- Inserts sample data for testing
- Sets up default users with login credentials

### 3. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On macOS/Linux

# Install dependencies
pip install flask flask-cors mysql-connector-python werkzeug python-dotenv

# Create .env file with database configuration
# Copy and modify the following:
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=company_management_system

# Run the backend server
python app.py
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Default Login Credentials

After running the database setup, you can login with these accounts:

| Role     | Email                 | Password    |
| -------- | --------------------- | ----------- |
| Admin    | admin@flowdesk.com    | password123 |
| Manager  | manager@flowdesk.com  | password123 |
| Employee | employee@flowdesk.com | password123 |

## Application URLs

- **Frontend**: http://localhost:5173 (or next available port)
- **Backend API**: http://127.0.0.1:5000

## Project Structure

```
FlowDesk/
├── backend/                 # Flask API server
│   ├── app.py              # Main Flask application
│   ├── db.py               # Database connection utilities
│   └── ...                 # Other backend files
├── frontend/                # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── theme.js       # Material-UI theme configuration
│   │   └── ...
│   └── package.json
├── database/                # Database files
│   ├── database_setup.sql  # Complete setup script (NEW!)
│   ├── company_management_system_schema.sql
│   ├── flowdesk_dump.sql
│   └── migrations/         # Database migration scripts
└── README.md
```

## Features Included

- **User Management**: Authentication, roles (Admin/Manager/Employee)
- **Employee Management**: CRUD operations, department assignments
- **Project Management**: Create projects, assign team members
- **Task Management**: Create, assign, and track tasks
- **Attendance Tracking**: Daily check-in/check-out
- **Leave Management**: Request and approve leave
- **Payroll System**: Salary calculations and payments
- **Notifications**: System notifications
- **Audit Logs**: Track all system activities

## Troubleshooting

### Database Connection Issues

1. Ensure MySQL server is running
2. Check your `.env` file has correct credentials
3. Verify database `company_management_system` exists

### Port Conflicts

- Frontend may run on port 5174, 5175, etc. if 5173 is busy
- Backend runs on port 5000 by default

### Python Virtual Environment

If you encounter import errors:

```bash
# Recreate virtual environment
cd backend
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

## Development Notes

- The application uses Material-UI for consistent styling
- Dark/light theme support is implemented
- Responsive design for mobile and desktop
- RESTful API architecture
- Connection pooling for database efficiency

## Need Help?

If you encounter any issues:

1. Check the console/terminal for error messages
2. Verify all prerequisites are installed
3. Ensure ports 5173 and 5000 are available
4. Check database credentials in `.env` file

The `database_setup.sql` file contains everything needed to get a working database with sample data for immediate testing.
