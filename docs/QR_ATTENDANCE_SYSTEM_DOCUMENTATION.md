# QR Attendance System - Database Schema & Architecture Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Table Structures](#table-structures)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Authentication System](#authentication-system)
6. [API Architecture](#api-architecture)
7. [Security Features](#security-features)

---

## System Overview

This QR attendance system is a comprehensive web application built with Next.js that manages student attendance through location-verified QR codes. The system supports three user roles: students, lecturers, and administrators.

### Technology Stack
- **Framework**: Next.js with TypeScript
- **Database**: MySQL with mysql2 driver
- **Authentication**: Better-auth library
- **ORM**: Raw SQL queries via custom query wrapper
- **QR Generation**: QRCode library
- **Location Services**: Haversine distance calculation

---

## Database Schema

The system uses MySQL database named `qr_attendance_app` with the following main components:

### Core Tables
1. **Authentication Tables** (Better-auth managed)
2. **Academic Structure Tables**
3. **Session Management Tables** 
4. **Attendance Tracking Tables**

---

## Table Structures

### Authentication Tables (Better-auth)

#### `user`
```sql
CREATE TABLE `user` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` TEXT NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `emailVerified` BOOLEAN NOT NULL,
  `image` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `role` TEXT  -- 'student', 'lecturer', 'admin'
);
```

#### `session`
```sql
CREATE TABLE `session` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `expiresAt` DATETIME NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  `ipAddress` TEXT,
  `userAgent` TEXT,
  `userId` VARCHAR(36) NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
);
```

#### `account`
```sql
CREATE TABLE `account` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `accountId` TEXT NOT NULL,
  `providerId` TEXT NOT NULL,
  `userId` VARCHAR(36) NOT NULL,
  `accessToken` TEXT,
  `refreshToken` TEXT,
  `idToken` TEXT,
  `accessTokenExpiresAt` DATETIME,
  `refreshTokenExpiresAt` DATETIME,
  `scope` TEXT,
  `password` TEXT,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
);
```

#### `verification`
```sql
CREATE TABLE `verification` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `identifier` TEXT NOT NULL,
  `value` TEXT NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `createdAt` DATETIME,
  `updatedAt` DATETIME
);
```

### Academic Structure Tables

#### `semesters`
```sql
CREATE TABLE semesters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name ENUM('autumn', 'spring', 'summer') NOT NULL,
    year YEAR NOT NULL,
    UNIQUE(name, year)
);
```

#### `courses`
```sql
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    semester_id INT NOT NULL,
    status ENUM('active', 'finished') NOT NULL,
    FOREIGN KEY (semester_id) REFERENCES semesters(id)
);
```

#### `course_lecturers`
```sql
CREATE TABLE course_lecturers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    lecturer_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (lecturer_id) REFERENCES `user` (`id`),
    UNIQUE(course_id, lecturer_id)
);
```

#### `enrollments`
```sql
CREATE TABLE enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    course_id INT NOT NULL,
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    UNIQUE (student_id, course_id)
);
```

### Location & Session Tables

#### `locations`
```sql
CREATE TABLE locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    building_name VARCHAR(100) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    description VARCHAR(240) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    CONSTRAINT unique_building_room UNIQUE (building_name, room_number, description)
);
```

#### `course_sessions`
```sql
CREATE TABLE course_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    type ENUM('lecture', 'lab') NOT NULL,
    day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location_id INT,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);
```

### QR Code & Attendance Tables

#### `session_qr_codes`
```sql
CREATE TABLE session_qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_session_id INT NOT NULL,
    qr_code VARCHAR(12) NOT NULL, -- 12-character hex token
    generated_at DATETIME NOT NULL,
    valid_until DATETIME NOT NULL, -- 10-minute validity
    week_number INT NOT NULL,    
    radius INT NOT NULL DEFAULT 100, -- meters
    FOREIGN KEY (course_session_id) REFERENCES course_sessions(id),
    CONSTRAINT unique_qr_code UNIQUE (qr_code),
    CONSTRAINT unique_session_week UNIQUE (course_session_id, week_number)
);
```

#### `attendance`
```sql
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    session_id INT NOT NULL,
    qr_code_id INT,
    checkin_time DATETIME NOT NULL,    
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    verify_distance BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES `user` (`id`),
    FOREIGN KEY (session_id) REFERENCES course_sessions(id),
    FOREIGN KEY (qr_code_id) REFERENCES session_qr_codes(id)    
);
```

---

## Relationships & Foreign Keys

### Entity Relationship Diagram (Text)

```
user (1) ←→ (M) session
user (1) ←→ (M) account
user (1) ←→ (M) enrollments ←→ (M) courses
user (1) ←→ (M) course_lecturers ←→ (M) courses
user (1) ←→ (M) attendance

semesters (1) ←→ (M) courses
courses (1) ←→ (M) course_sessions
courses (1) ←→ (M) enrollments
courses (1) ←→ (M) course_lecturers

locations (1) ←→ (M) course_sessions
course_sessions (1) ←→ (M) session_qr_codes
course_sessions (1) ←→ (M) attendance

session_qr_codes (1) ←→ (M) attendance
```

### Key Relationships

1. **User Relationships**:
   - Users have multiple sessions (authentication)
   - Users have multiple accounts (OAuth providers)
   - Students enroll in multiple courses
   - Lecturers teach multiple courses
   - Students have multiple attendance records

2. **Academic Structure**:
   - Semesters contain multiple courses
   - Courses have multiple sessions (lectures/labs)
   - Courses have assigned lecturers and enrolled students

3. **Session Management**:
   - Course sessions occur at specific locations
   - Each session can have multiple QR codes (weekly)
   - QR codes track attendance for specific weeks

4. **Attendance Tracking**:
   - Attendance links students to course sessions
   - Each attendance record references a QR code
   - Location verification through coordinates

---

## Authentication System

### Better-auth Configuration

The system uses Better-auth library with the following configuration:

```typescript
// File: src/lib/server/auth.ts
export const auth = betterAuth({
  database: db,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "student",
        input: false, // Admin-controlled role assignment
      },
    },
  },
});
```

### Authentication Features

1. **Multi-Provider Support**:
   - Email/password authentication
   - Google OAuth integration
   - Automatic profile mapping for social login

2. **Role-Based Access Control**:
   - Three roles: `student`, `lecturer`, `admin`
   - Default role: `student`
   - Role assignment controlled server-side

3. **Session Management**:
   - JWT token-based sessions
   - Session tracking with IP and User-Agent
   - Automatic session cleanup on expiry

### Client-Side Authentication

```typescript
// File: src/hooks/useAuth.ts
- useCurrentUser(): Fetches authenticated user profile
- useLogin(): Login mutation with credential validation
- useRegister(): Registration mutation
- useLogout(): Logout with session invalidation
```

### State Management

```typescript
// File: src/store/authStore.ts
interface AuthStore extends AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}
```

---

## API Architecture

### Route Structure

```
/api
├── auth/
│   ├── [...all]/ - Better-auth handler
│   ├── google/ - Google OAuth
│   ├── me/ - Current user profile
│   ├── signin/ - Login endpoint
│   ├── signout/ - Logout endpoint
│   └── signup/ - Registration endpoint
├── admin/
│   └── courses/ - Admin course management
├── lecturer/
│   └── session/[id]/generate-qr/ - QR generation
└── student/
    ├── courses/ - Enrolled courses
    └── attendance/checkin/ - Attendance check-in
```

### Key API Endpoints

#### Authentication Endpoints
- `GET /api/auth/me` - Get current user
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout

#### Student Endpoints
- `GET /api/student/courses` - Get enrolled courses
- `POST /api/student/attendance/checkin` - Check-in with QR code

#### Lecturer Endpoints
- `POST /api/lecturer/session/{id}/generate-qr` - Generate session QR code

### Request/Response Types

```typescript
// QR Generation Request
type GenerateQrRequestBody = {
  week_number: number;
  redirect_url?: string;
  radius?: number; // meters
};

// Attendance Check-in Request
type AttendanceCheckinRequestBody = {
  qr_code: string;
  lat: number;
  long: number;
  verify_distance: boolean;
};
```

---

## Security Features

### 1. Location Verification

```typescript
// File: src/lib/server/util.ts
export function haversineDistance(
  latitudeA: number, longitudeA: number,
  latitudeB: number, longitudeB: number
): number {
  // Calculates distance in meters using Haversine formula
}
```

**Implementation**:
- Students must be within specified radius (default: 100m)
- Distance calculated using Haversine formula
- Can be disabled for remote/online sessions

### 2. QR Code Security

**Features**:
- 12-character cryptographically random hex tokens
- 10-minute validity window
- One QR code per session per week (prevents replay)
- Unique constraint prevents duplicate tokens

**Generation Process**:
```typescript
// Generate secure token
const token = crypto.randomBytes(6).toString("hex"); // 12-char token

// 10-minute validity
const validUntil = new Date(now.getTime() + 10 * 60 * 1000);
```

### 3. Access Control

**Role-Based Authorization**:
- Route-level protection by user role
- Session validation on every request
- Enrollment verification for attendance

**Example Authorization Check**:
```typescript
// Verify student is enrolled in course
const [enrollment] = await rawQuery(`
  SELECT 1 FROM enrollments
  WHERE student_id = ? AND course_id = ?
`, [studentId, courseId]);

if (!enrollment) {
  return NextResponse.json(
    { message: "Student not enrolled in this course" },
    { status: 403 }
  );
}
```

### 4. Attendance Integrity

**Duplicate Prevention**:
- Unique constraint on (student_id, session_id, qr_code_id)
- Prevents multiple check-ins for same session

**Temporal Validation**:
- QR codes expire after 10 minutes
- Validation of generation and expiry timestamps

**Location Integrity**:
- GPS coordinates stored with each check-in
- Haversine distance calculation for verification
- Configurable radius per session

### 5. Database Security

**Connection Security**:
- Environment variable configuration
- Production/development connection separation
- Google Cloud SQL socket path for production

**Query Protection**:
- Parameterized queries prevent SQL injection
- Custom query wrapper with error handling
- Duplicate entry detection and handling

---

## Database Connection Configuration

```typescript
// File: src/lib/server/db.ts
export const db = mysql.createPool(
  isProd
    ? {
        socketPath: `/cloudsql/${process.env.GCP_PROJECT_ID}:${process.env.GCP_REGION}:${process.env.DB_INSTANCE}`,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
      }
    : {
        host: process.env.DB_HOST!,
        user: process.env.DB_USER!,
        password: process.env.DB_PASS!,
        database: process.env.DB_NAME!,
      }
);
```

---

## Recent Updates (Latest Changes)

### Version Update Notes - August 2025

#### Type System Improvements
- **Role Enum Standardization**: Updated role values from uppercase to lowercase for consistency:
  - `STUDENT` → `student`
  - `INSTRUCTOR` → `lecturer` 
  - `ADMIN` → `admin`
- **Type Safety**: Enhanced type definitions with proper enum-based Role type instead of string literals

#### Sample Data Enhancement
- Added comprehensive test data in `db_load.sql`:
  - 9 users (1 admin, 3 lecturers, 5 students) with hashed passwords
  - 3 academic semesters (Spring 2024, Autumn 2025, Spring 2025)
  - 5 active courses across different departments
  - 10 campus locations with precise GPS coordinates
  - 15 scheduled course sessions (lectures and labs)
  - Student enrollment records across multiple courses

#### Schema Stability
- **No Breaking Changes**: All table structures remain identical
- **Relationship Integrity**: Foreign key constraints unchanged
- **Backward Compatibility**: Existing API endpoints continue to function

---

## Summary

This QR attendance system provides a robust, secure solution for tracking student attendance with the following key features:

1. **Comprehensive User Management**: Three-tier role system with secure authentication
2. **Location-Based Verification**: GPS-based attendance validation with configurable radius
3. **Temporal Security**: Time-limited QR codes with 10-minute validity
4. **Academic Structure**: Full semester/course/session hierarchy
5. **Multi-Provider Authentication**: Email/password and Google OAuth support
6. **Data Integrity**: Comprehensive foreign key relationships and constraints
7. **Security Best Practices**: Parameterized queries, role-based access control, and cryptographic tokens
8. **Type Safety**: Enhanced TypeScript definitions with enum-based role system

The system successfully balances usability with security, providing lecturers with easy QR generation tools while ensuring students cannot falsify attendance records through multiple verification layers.

**Latest Update**: The system has been enhanced with improved type safety and comprehensive sample data while maintaining full backward compatibility.