# HR Management System - Backend API Server

A production-ready enterprise Node.js & Express RESTful API backend featuring JWT authentication, Role-Based Access Control (RBAC), MySQL / Sequelize ORM with migrations, real-time WebSockets (Socket.IO), Nodemailer email services, background Cron jobs, rate-limiting, and an automated test suite.

---

## Architecture Overview

```
server/
├── src/
│   ├── config/
│   │   ├── env.js                     # Environment variable validation & exports
│   │   ├── db.js                      # Sequelize connection pool (MySQL + SQLite test support)
│   │   ├── mailer.js                  # Nodemailer transporter & email helpers
│   │   ├── websocket.js               # Socket.IO setup, JWT handshake, room management
│   │   ├── cron.js                    # Node-cron background jobs (attendance, reminders, cleanup)
│   │   └── logger.js                  # Formatted terminal logger
│   ├── constants/
│   │   ├── roles.js                   # System roles: admin, hr, manager, employee
│   │   └── status.js                  # User statuses: active, inactive, suspended
│   ├── controllers/
│   │   ├── auth.controller.js         # Register, Login, Refresh token, Profile, Password reset
│   │   ├── user.controller.js         # User CRUD, pagination, filtering, avatar uploads
│   │   └── notification.controller.js # WebSocket broadcasts and direct employee alerts
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT Bearer token authentication
│   │   ├── role.middleware.js         # Role-based access control (RBAC)
│   │   ├── validate.middleware.js     # Request payload validation via Joi
│   │   ├── rateLimiter.middleware.js  # DDoS & brute-force rate limiter
│   │   ├── upload.middleware.js       # Multer multipart file uploader
│   │   └── error.middleware.js        # Centralized error & 404 handler
│   ├── migrations/
│   │   ├── 20261001000000-create-users-table.js # MySQL User table migration
│   │   └── migrationRunner.js         # Automatic database & migration runner
│   ├── models/
│   │   ├── index.js                   # Sequelize registry & model export
│   │   └── User.js                    # User model with hooks, bcrypt, JWT helpers
│   ├── routes/
│   │   ├── index.js                   # Master router & /health endpoint
│   │   ├── auth.routes.js             # /api/v1/auth
│   │   ├── user.routes.js             # /api/v1/users
│   │   └── notification.routes.js     # /api/v1/notifications
│   ├── services/
│   │   ├── auth.service.js            # Authentication business logic & token lifecycle
│   │   ├── email.service.js           # HTML email templates (Welcome, Reset, Alerts)
│   │   └── socket.service.js          # Socket.IO event dispatchers (User/Role/Dept/Broadcast)
│   ├── utils/
│   │   ├── apiResponse.js             # Uniform JSON response utility
│   │   └── apiError.js                # Custom HTTP error hierarchy
│   ├── validators/
│   │   ├── auth.validator.js          # Joi schemas for auth routes
│   │   └── user.validator.js          # Joi schemas for user routes
│   └── app.js                         # Express application setup
├── tests/
│   ├── auth.test.js                   # Registration, login, JWT verification tests
│   ├── user.test.js                   # RBAC, CRUD, pagination tests
│   ├── health.test.js                 # API health and 404 route tests
│   └── setupEnv.js                    # In-memory test environment setup
├── .env.example                       # Documented environment variable template
├── .env                               # Active configuration file
├── jest.config.js                     # Jest testing configuration
├── migrate.js                         # Database migration CLI runner
├── seed.js                            # Seed initial Admin, HR, and Employee users
├── package.json
└── server.js                          # HTTP & WebSocket entry point
```

---

## Getting Started

### 1. Environment Configuration

Create or modify `.env`:
```env
PORT=5000
NODE_ENV=development

# MySQL Database
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3308
DB_NAME=hr_management_db
DB_USER=root
DB_PASSWORD=

# JWT Secrets
JWT_SECRET=super_secret_jwt_access_key_hr_mgmt_2026_x!99$a
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=super_secret_jwt_refresh_key_hr_mgmt_2026_z!77$b
JWT_REFRESH_EXPIRES_IN=7d

# SMTP Email (defaults to Ethereal test inbox in development if empty)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="HR Management Portal <no-reply@hrmanagement.com>"

# Scheduled Cron Jobs
CRON_ENABLED=true
```

---

## Database Migrations & Seeding

### Run Migrations
Creates the database if it doesn't exist, builds the `users` table with indexes, constraints, and audit timestamps:
```bash
npm run migrate
```

### Rollback Migration
Reverts the last applied migration:
```bash
npm run migrate:undo
```

### Seed Default Users
Populates initial Admin, HR Manager, and Employee test accounts:
```bash
npm run seed
```

**Default Seeded Credentials:**
| Role | Email | Password |
|---|---|---|
| Admin | `admin@hrmanagement.com` | `AdminPassword@123` |
| HR Manager | `hr@hrmanagement.com` | `HrPassword@123` |
| Employee | `john.doe@hrmanagement.com` | `UserPassword@123` |

---

## Running the Application

### Development (Live Reload via Nodemon):
```bash
npm run dev
```

### Production:
```bash
npm start
```

---

## Running Automated Tests

Run the full Jest test suite with 100% automated in-memory SQLite isolation:
```bash
npm test
```
All 15 tests covering authentication, RBAC, input validation, and system endpoints will execute and pass without requiring external database dependencies.

---

## API Documentation

### Base URL: `http://localhost:5000/api/v1`

### 1. Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new employee/user | No |
| `POST` | `/api/v1/auth/login` | Login with email and password | No |
| `POST` | `/api/v1/auth/refresh` | Refresh access token using refresh token | No |
| `POST` | `/api/v1/auth/forgot-password` | Send password reset token via email | No |
| `POST` | `/api/v1/auth/reset-password` | Set new password using token | No |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer JWT |
| `PUT` | `/api/v1/auth/me` | Update authenticated user profile | Bearer JWT |
| `POST` | `/api/v1/auth/change-password` | Change user password | Bearer JWT |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token | Bearer JWT |

### 2. User Management (`/api/v1/users`)
| Method | Endpoint | Description | Auth & Roles |
|---|---|---|---|
| `GET` | `/api/v1/users` | List users (supports `?page=1&limit=10&search=john&role=employee&department=Engineering`) | Admin, HR |
| `GET` | `/api/v1/users/:id` | Get user details by ID | Bearer JWT |
| `POST` | `/api/v1/users` | Create user directly | Admin, HR |
| `PUT` | `/api/v1/users/:id` | Update user details/role/status | Admin, HR |
| `DELETE` | `/api/v1/users/:id` | Delete user | Admin only |
| `POST` | `/api/v1/users/:id/avatar` | Upload user profile picture | Bearer JWT |

### 3. Employee Management (`/api/v1/employees`)
| Method | Endpoint | Description | Auth & Roles |
|---|---|---|---|
| `POST` | `/api/v1/employees` | Register new employee (Validation + auto-generated code + initial leave quotas + activity log) | Admin, HR |
| `GET` | `/api/v1/employees` | List employees (Pagination + Search + Filter by Department, Designation, Branch, Status, Gender) | Admin, HR, Manager |
| `GET` | `/api/v1/employees/:id` | Complete 360° Profile View (Department, Branch, Manager, Reportees, Leave Balances, Assets, Documents, Salary Structure) | Admin, HR, Manager, Self |
| `PUT` | `/api/v1/employees/:id` | Update employee details (Prevents self-manager, validates unique email/code) | Admin, HR |
| `PATCH` | `/api/v1/employees/:id/status` | Status transition (`active`, `probation`, `suspended`, `terminated`, `resigned`) with mandatory reason | Admin, HR |
| `GET` | `/api/v1/employees/:id/status` | Real-time pulse check (`clocked_in`, `clocked_out`, `on_leave`, `holiday`, `not_clocked_in`) + today's attendance | Admin, HR, Manager, Self |

### 4. Notifications & Realtime (`/api/v1/notifications`)
| Method | Endpoint | Description | Auth & Roles |
|---|---|---|---|
| `POST` | `/api/v1/notifications/broadcast` | Broadcast announcement via WebSocket & optional email | Admin, HR |
| `POST` | `/api/v1/notifications/user/:userId` | Send direct WebSocket notification | Bearer JWT |
| `GET` | `/api/v1/notifications/status` | Real-time WebSocket connection count & active users | Bearer JWT |

### 4. Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Service uptime, database connectivity status |

---

## WebSockets (Socket.IO)

Clients connect to the WebSocket server using:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_ACCESS_TOKEN' }
});

// Presence updates
socket.on('user:presence', (data) => console.log('User presence:', data));

// Real-time Announcements
socket.on('notification:announcement', (data) => console.log('Announcement:', data));

// Direct Notifications
socket.on('notification:direct', (data) => console.log('Direct alert:', data));
```

---

## Scheduled Background Cron Jobs

Configured in [src/config/cron.js](src/config/cron.js):
1. **Attendance Reminder**: Every weekday at 09:00 AM (`0 9 * * 1-5`)
2. **HR Leave & Activity Alert**: Every weekday at 06:00 PM (`0 18 * * 1-5`)
3. **Database Token Cleanup**: Every Sunday at midnight (`0 0 * * 0`)
