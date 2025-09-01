# HMCTS Task Management System

A comprehensive task management system designed for HMCTS caseworkers to efficiently manage their tasks and workflows.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

This application provides a complete task management solution for HMCTS caseworkers, featuring a RESTful API backend and a modern React frontend. The system allows users to create, view, update, and delete tasks with comprehensive status tracking and due date management.

## ✨ Features

### Backend API
- ✅ **CRUD Operations**: Create, read, update, and delete tasks
- ✅ **Data Validation**: Comprehensive input validation using Zod
- ✅ **Error Handling**: Structured error responses and logging
- ✅ **Status Management**: Task status tracking (Pending, In Progress, Completed, Cancelled)
- ✅ **Due Date Tracking**: Date/time management with overdue detection
- ✅ **Filtering & Sorting**: Query tasks by status with sorting options
- ✅ **Database Integration**: SQLite with Prisma ORM
- ✅ **API Documentation**: Comprehensive endpoint documentation
- ✅ **Unit Testing**: Jest test suite with high coverage

### Frontend Application
- ✅ **Modern UI**: Clean, responsive interface built with React & Tailwind CSS
- ✅ **Real-time Updates**: Optimistic updates with React Query
- ✅ **Form Validation**: Client-side validation with helpful error messages
- ✅ **Status Filtering**: Filter tasks by status with visual indicators
- ✅ **Overdue Alerts**: Visual warnings for overdue tasks
- ✅ **Mobile Responsive**: Works seamlessly on all device sizes
- ✅ **Loading States**: Professional loading indicators and feedback
- ✅ **Toast Notifications**: Success/error notifications for all actions

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite with Prisma ORM
- **Validation**: Zod schema validation
- **Testing**: Jest with Supertest
- **Logging**: Winston
- **Security**: Helmet.js, CORS

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Testing**: React Testing Library

## 📁 Project Structure

```
hmcts-task-management/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Request handlers
│   │   ├── routes/              # API route definitions
│   │   ├── types/               # TypeScript type definitions
│   │   ├── utils/               # Utility functions and logging
│   │   ├── middleware/          # Express middleware
│   │   └── app.ts              # Main application file
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── tests/                  # Unit and integration tests
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── services/           # API service layer
│   │   ├── types/              # TypeScript interfaces
│   │   └── App.tsx            # Main React component
│   ├── public/                # Static assets
│   └── package.json
└── README.md
```

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Trojan9/hmcts-task-management.git
cd hmcts-task-management
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up the database
npx prisma generate
npx prisma migrate dev --name init

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3001`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3001" > .env

# Start development server
npm run dev
```

The frontend application will be available at `http://localhost:5173`

### 4. Verify Installation

- Visit `http://localhost:3001/health` to check backend status
- Visit `http://localhost:5173` to access the frontend application

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### Get All Tasks
```http
GET /tasks
```

**Query Parameters:**
- `status` (optional): Filter by task status (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`)
- `sortBy` (optional): Sort field (default: `dueDate`)
- `order` (optional): Sort order (`asc`, `desc`)

**Response:**
```json
[
  {
    "id": "clp123abc",
    "title": "Review case documentation",
    "description": "Review and validate case files for hearing",
    "status": "PENDING",
    "dueDate": "2024-12-25T10:00:00.000Z",
    "createdAt": "2024-12-01T09:00:00.000Z",
    "updatedAt": "2024-12-01T09:00:00.000Z"
  }
]
```

#### Get Task by ID
```http
GET /tasks/:id
```

**Response:**
```json
{
  "id": "clp123abc",
  "title": "Review case documentation",
  "description": "Review and validate case files for hearing",
  "status": "PENDING",
  "dueDate": "2024-12-25T10:00:00.000Z",
  "createdAt": "2024-12-01T09:00:00.000Z",
  "updatedAt": "2024-12-01T09:00:00.000Z"
}
```

#### Create Task
```http
POST /tasks
```

**Request Body:**
```json
{
  "title": "Review case documentation",
  "description": "Review and validate case files for hearing",
  "status": "PENDING",
  "dueDate": "2024-12-25T10:00:00.000Z"
}
```

**Response:** `201 Created` with task object

#### Update Task
```http
PUT /tasks/:id
```

**Request Body:** (All fields optional)
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "IN_PROGRESS",
  "dueDate": "2024-12-26T10:00:00.000Z"
}
```

**Response:** `200 OK` with updated task object

#### Delete Task
```http
DELETE /tasks/:id
```

**Response:** `204 No Content`

### Error Responses

All endpoints return structured error responses:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

**Status Codes:**
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# View test coverage
npm test -- --coverage
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The application maintains high test coverage:
- **Backend**: 90%+ code coverage
- **Frontend**: Component and integration tests

## 🚀 Deployment

### Backend Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Set environment variables:**
```bash
export NODE_ENV=production
export PORT=3001
```

3. **Run database migrations:**
```bash
npx prisma migrate deploy
```

4. **Start the application:**
```bash
npm start
```

### Frontend Deployment

1. **Build for production:**
```bash
npm run build
```

2. **Set environment variables:**
```bash
VITE_API_URL=http://localhost:3001
```

3. **Deploy the `dist/` folder** to your hosting provider

### Environment Variables

#### Backend
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - Database connection string

#### Frontend
- `VITE_API_URL` - Backend API URL

## 🏗 Architecture Decisions

### Backend Architecture
- **Controller Pattern**: Separation of concerns with dedicated controllers
- **Service Layer**: API service layer for data operations
- **Middleware**: Error handling and validation middleware
- **Type Safety**: Full TypeScript implementation with Zod validation

### Frontend Architecture
- **Component-Based**: Reusable React components
- **State Management**: React Query for server state, React state for local state
- **Form Management**: React Hook Form for performance and validation
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Database Design
- **Single Entity Model**: Task entity with all required fields
- **Enum Types**: Predefined status values for consistency
- **Timestamp Tracking**: Created and updated timestamps
- **UUID Primary Keys**: Using cuid for unique identifiers

## 🔧 Development Workflow

### Code Quality
- **ESLint**: Code linting and formatting
- **TypeScript**: Strict type checking
- **Prettier**: Code formatting (recommended)
- **Husky**: Pre-commit hooks (recommended)

### Git Workflow
1. Create feature branch from `main`
2. Implement feature with tests
3. Ensure all tests pass
4. Submit pull request
5. Code review and merge

## 📝 Available Scripts

### Backend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Run ESLint
```

**Built with ❤️ for HMCTS**