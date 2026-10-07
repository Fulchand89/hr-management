# 📱 HRMS Mobile & Web App API Documentation (Swagger / OpenAPI 3.0)

> **Backend Version:** 1.0.0  
> **OpenAPI Specification:** 3.0.3  
> **API Base URL:** `http://localhost:5000/api/v1`  
> **Swagger UI URL:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs) or [http://localhost:5000/docs](http://localhost:5000/docs)  
> **Raw JSON Specification:** [http://localhost:5000/api/docs.json](http://localhost:5000/api/docs.json)

---

## 🚀 Quick Setup for App Developers

### 1. How to Test & Explore in Browser
1. Start the HRMS backend server:
   ```bash
   cd server
   npm run dev
   ```
2. Open your browser and navigate to:
   👉 **`http://localhost:5000/api/docs`**
3. Click the green **Authorize** button at the top right, enter your JWT token (`Bearer <your_token>`), and you can test all endpoints live!

### 2. How to Import into Postman / Insomnia
1. Open **Postman**.
2. Click **Import** (top left).
3. Select **Link / URL** and paste:
   ```
   http://localhost:5000/api/docs.json
   ```
4. Click **Import**. Postman will generate all folders, requests, parameters, headers, and schemas automatically!

### 3. Base URLs for Mobile Development
| Environment | Base URL |
| :--- | :--- |
| **Local Web Browser / React / Next.js** | `http://localhost:5000/api/v1` |
| **Android Emulator** | `http://10.0.2.2:5000/api/v1` |
| **iOS Simulator** | `http://localhost:5000/api/v1` |
| **Physical Phone (via Wi-Fi)** | `http://<YOUR_COMPUTER_LOCAL_IP>:5000/api/v1` *(e.g. `http://192.168.1.100:5000/api/v1`)* |

---

## 🔐 Authentication & Authorization

All protected routes require an HTTP Authorization header formatted with standard Bearer token:

```http
Authorization: Bearer <jwt_access_token>
```

### Standard API Response Format

#### Success Response:
```json
{
  "success": true,
  "message": "Action completed successfully",
  "data": { ... }
}
```

#### Error Response:
```json
{
  "success": false,
  "message": "Human readable error message",
  "errors": []
}
```

---

## 📋 Comprehensive Endpoint Reference

### 1. 🔑 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/login` | Login with email & password, returns JWT token & user profile | ❌ No |
| `POST` | `/auth/refresh-token` | Exchange refresh token for a new access token | ❌ No |
| `GET` | `/auth/me` | Fetch active logged-in user profile, roles, and employee data | ✅ Bearer |
| `PUT` | `/auth/profile` | Update personal profile details (firstName, lastName, phone, etc.) | ✅ Bearer |
| `PUT` | `/auth/change-password` | Update current password | ✅ Bearer |
| `POST` | `/auth/logout` | Invalidate current session and tokens | ✅ Bearer |

#### Login Request Body:
```json
{
  "email": "employee@hrms.com",
  "password": "Password@123"
}
```

#### Login Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid-v4",
      "email": "employee@hrms.com",
      "role": "employee",
      "employeeId": "uuid-v4",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

---

### 2. ⏱️ Attendance System (`/api/v1/attendance`)
Designed for mobile geolocation check-ins, multi-break tracking, and live gross/net duration computation.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/attendance/today` | **Mobile Home Dashboard:** Current status, punch times, active breaks, net minutes | ✅ Bearer |
| `POST` | `/attendance/punch-in` | Punch in (start workday) with optional GPS coords & note | ✅ Bearer |
| `POST` | `/attendance/break-start` | Start break / lunch | ✅ Bearer |
| `POST` | `/attendance/break-end` | End break and resume work | ✅ Bearer |
| `POST` | `/attendance/punch-out` | Punch out (finish workday) | ✅ Bearer |
| `GET` | `/attendance/my-history` | Attendance history for logged-in employee (`?startDate=&endDate=&page=`) | ✅ Bearer |
| `POST` | `/attendance/corrections` | Submit punch correction request if an employee forgot to punch | ✅ Bearer |
| `GET` | `/attendance/corrections/my` | View all attendance correction requests submitted by logged-in user | ✅ Bearer |
| `GET` | `/attendance/daily` | *(Admin/HR)* Daily team attendance roster | ✅ Admin/HR |
| `GET` | `/attendance/monthly` | *(Admin/HR)* Monthly team attendance sheet | ✅ Admin/HR |
| `PATCH` | `/attendance/corrections/{id}` | *(Admin/HR)* Approve or reject punch correction | ✅ Admin/HR |

#### Sample Today Status Response (`GET /api/v1/attendance/today`):
```json
{
  "success": true,
  "data": {
    "date": "2026-10-07",
    "status": "present",
    "punchIn": "2026-10-07T09:12:00.000Z",
    "punchOut": null,
    "punchedIn": true,
    "onBreak": false,
    "punchedOut": false,
    "grossWorkMinutes": 240,
    "netWorkMinutes": 210,
    "breakMinutes": 30,
    "breaks": [
      {
        "startTime": "2026-10-07T13:00:00.000Z",
        "endTime": "2026-10-07T13:30:00.000Z",
        "durationMinutes": 30,
        "reason": "Lunch"
      }
    ]
  }
}
```

#### Sample Punch-In Request (`POST /api/v1/attendance/punch-in`):
```json
{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "Connaught Place, New Delhi",
  "notes": "Punched in via Mobile App"
}
```

---

### 3. 🏖️ Leave Management (`/api/v1/leaves`)
Full support for leave balances, applications, manager approvals, leave types, and company holidays.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/leaves/balances` | **Leave Balances:** Annual, Sick, Casual quota, used, and remaining | ✅ Bearer |
| `GET` | `/leaves/my-requests` | List employee's own submitted leave applications | ✅ Bearer |
| `POST` | `/leaves/apply` | Apply for leave (full day / half day) | ✅ Bearer |
| `DELETE` | `/leaves/{id}/cancel` | Cancel a pending leave request before approval | ✅ Bearer |
| `GET` | `/leaves/types` | List all leave types (Casual, Sick, Paid, Maternity, etc.) | ✅ Bearer |
| `GET` | `/leaves/holidays` | List company official holidays for the calendar | ✅ Bearer |
| `GET` | `/leaves/requests` | *(Admin/HR)* View all company leave requests queue | ✅ Admin/HR |
| `PATCH` | `/leaves/requests/{id}/action` | *(Admin/HR)* Approve or Reject a leave application | ✅ Admin/HR |

#### Sample Leave Balance Response (`GET /api/v1/leaves/balances`):
```json
{
  "success": true,
  "data": [
    {
      "leaveTypeId": "uuid-1",
      "leaveTypeName": "Casual Leave",
      "total": 12,
      "used": 3,
      "remaining": 9
    },
    {
      "leaveTypeId": "uuid-2",
      "leaveTypeName": "Sick Leave",
      "total": 10,
      "used": 1,
      "remaining": 9
    }
  ]
}
```

#### Sample Apply Leave Request (`POST /api/v1/leaves/apply`):
```json
{
  "leaveTypeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "startDate": "2026-10-15",
  "endDate": "2026-10-16",
  "isHalfDay": false,
  "reason": "Personal family event"
}
```

#### Sample Admin Action Request (`PATCH /api/v1/leaves/requests/{id}/action`):
```json
{
  "status": "approved",
  "adminComment": "Approved. Have a great time!"
}
```
*(Status can be `"approved"` or `"rejected"`)*

---

### 4. 👥 Employees (`/api/v1/employees`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/employees` | List employees with filters (`?search=&departmentId=&status=&page=`) | ✅ Bearer |
| `GET` | `/employees/{id}` | Full 360-degree employee profile | ✅ Bearer |
| `POST` | `/employees` | Add a new employee | ✅ Admin/HR |
| `PUT` | `/employees/{id}` | Update employee profile & employment details | ✅ Admin/HR |
| `PATCH` | `/employees/{id}/status` | Update employment status (`active`, `probation`, `suspended`, `terminated`) | ✅ Admin/HR |
| `DELETE` | `/employees/{id}` | Delete / archive employee | ✅ Admin/HR |

---

### 5. 🏢 Departments & Designations (`/api/v1/departments`, `/api/v1/designations`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/departments` | List all departments with manager & member count | ✅ Bearer |
| `POST` | `/departments` | Create new department | ✅ Admin/HR |
| `GET` | `/departments/{id}` | Get department details and member list | ✅ Bearer |
| `PUT` | `/departments/{id}` | Update department | ✅ Admin/HR |
| `DELETE` | `/departments/{id}` | Delete department | ✅ Admin/HR |
| `GET` | `/designations` | List all job designations / titles | ✅ Bearer |
| `POST` | `/designations` | Create new designation | ✅ Admin/HR |
| `PUT` | `/designations/{id}` | Update designation | ✅ Admin/HR |
| `DELETE` | `/designations/{id}` | Delete designation | ✅ Admin/HR |

---

### 6. 🔔 Notifications (`/api/v1/notifications`)
Perfect for mobile push notifications & in-app bell notification tray.

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get notifications for logged-in user | ✅ Bearer |
| `GET` | `/notifications/unread-count` | Get unread notification counter badge | ✅ Bearer |
| `PATCH` | `/notifications/{id}/read` | Mark a specific notification as read | ✅ Bearer |
| `PATCH` | `/notifications/read-all` | Mark all notifications as read | ✅ Bearer |
| `POST` | `/notifications/broadcast` | *(Admin)* Send broadcast notification to all employees | ✅ Admin |

---

### 7. 📊 Dashboard & Reports (`/api/v1/dashboard`, `/api/v1/reports`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/dashboard/employee` | Quick metrics for employee app home screen (punch status, upcoming leaves, announcements) | ✅ Bearer |
| `GET` | `/dashboard/admin` | Quick metrics for HR/Admin app home screen (total staff, present today, pending requests) | ✅ Admin/HR |
| `GET` | `/reports/attendance` | Attendance analytics and export data | ✅ Admin/HR |
| `GET` | `/reports/leaves` | Leave consumption metrics | ✅ Admin/HR |

---

## 💡 Best Practices for Mobile Integration

1. **Token Persistence:** Save the access token in Secure Storage (Flutter `flutter_secure_storage`, React Native `react-native-keychain`, or iOS Keychain / Android EncryptedSharedPreferences).
2. **HTTP Interceptor:** Create an Axios or Dio interceptor to attach `Authorization: Bearer <token>` automatically on every request.
3. **Auto Refresh Token:** When an API returns `401 Unauthorized`, catch it in the interceptor and call `/api/v1/auth/refresh-token` before retrying the failed request.
4. **Geolocation:** For `/attendance/punch-in` and `/attendance/punch-out`, request user location permission (`ACCESS_FINE_LOCATION`) and pass `latitude` and `longitude`.
5. **Real-time Status:** Call `GET /attendance/today` whenever the app opens or resumes from background to show whether the employee is currently Punched In, On Break, or Punched Out.
