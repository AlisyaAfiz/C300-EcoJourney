# EcoJourney Backend Setup

## Quick Start for Team Members

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
```bash
# Copy the example file
cp .env.example .env
```

Then open `.env` and fill in your actual credentials:
- MongoDB URI from Atlas
- Cloudinary credentials from your account
- Generate JWT secret with: `openssl rand -hex 32`

### 3. Run Development Server
```bash
npm start
```

## Environment Variables

All required environment variables are documented in `.env.example`.

**⚠️ IMPORTANT:** Never commit your `.env` file to git! It contains sensitive credentials.

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-restart on changes)
- `npm test` - Run tests

## Project Structure

```
backend/
├── config/          # Configuration files (Cloudinary, etc.)
├── middleware/      # Express middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── utils/           # Utility functions
├── .env.example     # Environment template
└── server.js        # Entry point
```
