# Clinic App

A full-stack clinic management system for managing patients, test results, and user profiles.

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS
- React Router
- Axios
- Recharts (analytics)
- react-to-print (PDF reports)

**Backend**
- Node.js + Express 5
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Nodemailer (email)
- PDFKit

## Project Structure

```
├── backend/        # Express API server
│   ├── prisma/     # DB schema & migrations
│   └── src/
│       ├── middleware/   # Auth & quota middleware
│       └── routes/       # API routes
└── frontend/       # React app
    └── src/
        ├── api/          # Axios instance & API calls
        ├── components/   # Shared components (Layout, Sidebar)
        ├── context/      # Auth context
        └── pages/        # Page components
```

## Getting Started

### Backend

```bash
cd backend
npm install
# Create a .env file with DATABASE_URL and JWT_SECRET
npm run db:migrate
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:4000`.

## Features

- JWT-based authentication
- Patient management (create, view, edit, delete)
- Test results tracking
- PDF report generation
- Email notifications
- Analytics dashboard
- User profile management
