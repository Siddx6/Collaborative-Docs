# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js v18+ installed (`node --version`)
- ✅ MongoDB installed and running (`mongod --version`)
- ✅ npm or yarn installed (`npm --version`)

## Step-by-Step Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Backend Environment
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your preferred editor
# For quick start, the defaults work fine!
```

### 3. Start MongoDB
```bash
# On Linux/macOS:
sudo systemctl start mongod

# OR use MongoDB Atlas (cloud):
# 1. Create a free cluster at https://www.mongodb.com/cloud/atlas
# 2. Get your connection string
# 3. Update MONGODB_URI in .env
```

### 4. Start Backend Server
```bash
# From the backend directory
npm run dev

# You should see:
# ✅ MongoDB connected successfully
# 🚀 Server running on port 5000
# 📡 Socket.io initialized
```

### 5. Install Frontend Dependencies
```bash
# Open a new terminal
cd frontend
npm install
```

### 6. Configure Frontend Environment
```bash
# Copy the example environment file
cp .env.example .env

# The defaults should work with local backend
```

### 7. Start Frontend Development Server
```bash
# From the frontend directory
npm run dev

# You should see:
# ➜  Local:   http://localhost:5173/
```

### 8. Access the Application
Open your browser and navigate to:
```
http://localhost:5173
```

## First-Time Usage

1. **Register an Account**
   - Click "Sign up" on the login page
   - Enter username, email, and password
   - You'll be redirected to the dashboard

2. **Create Your First Document**
   - Click "New Document" button
   - Start typing in the editor
   - Changes are auto-saved

3. **Test Collaboration**
   - Open the same document in a different browser/incognito window
   - Register a different user
   - Join the document via the shareable link
   - Type simultaneously in both windows
   - Watch real-time synchronization! 🎉

## Troubleshooting

### Backend won't start
- **Error: MongoDB connection failed**
  - Check if MongoDB is running: `sudo systemctl status mongod`
  - Try restarting: `sudo systemctl restart mongod`
  - Check connection string in `.env`

- **Error: Port 5000 already in use**
  - Change `PORT` in backend `.env`
  - Update `VITE_API_URL` and `VITE_SOCKET_URL` in frontend `.env`

### Frontend won't start
- **Error: Cannot connect to backend**
  - Ensure backend is running on port 5000
  - Check CORS settings in `backend/src/server.ts`
  - Verify `VITE_API_URL` in frontend `.env`

### Real-time features not working
- **Changes not syncing**
  - Check browser console for WebSocket errors
  - Ensure Socket.io connection shows "Connected" in editor
  - Verify both users are in the same document

### MongoDB Issues
- **Can't connect to local MongoDB**
  - Install MongoDB: https://docs.mongodb.com/manual/installation/
  - Or use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas

## Development Scripts

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled JavaScript (production)
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Production Deployment

### Quick Deploy Options

**Backend (Railway.app)**
1. Create Railway account
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

**Frontend (Vercel)**
1. Create Vercel account
2. Import Git repository
3. Framework: Vite
4. Build command: `npm run build`
5. Output directory: `dist`
6. Add environment variables
7. Deploy!

**Database (MongoDB Atlas)**
1. Create free cluster
2. Get connection string
3. Update backend environment variables

## Next Steps

- [ ] Customize the UI design
- [ ] Add document permissions
- [ ] Implement version history
- [ ] Add export to PDF/Word
- [ ] Deploy to production
- [ ] Add unit tests
- [ ] Implement rate limiting
- [ ] Add document templates

## Need Help?

- Check the main README.md for detailed documentation
- Review the API documentation section
- Check the troubleshooting guide above
- Review code comments in source files

Happy coding! 🚀