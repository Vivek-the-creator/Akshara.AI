# AI Language Learning Platform

A comprehensive web application for children's language learning powered by AI. This is Phase 1 of the platform, focusing on core functionality and connectivity.

## 🏗️ Project Structure

```
AI Learning Platform/
├── frontend/                 # React.js frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── App.jsx          # Main App component
│   │   └── main.jsx         # Application entry point
│   ├── package.json         # Frontend dependencies
│   └── vite.config.js       # Vite configuration
├── backend/                 # FastAPI backend application
│   ├── routes/              # API route handlers
│   ├── main.py              # FastAPI application entry
│   ├── database.py          # MongoDB connection setup
│   ├── models.py            # Pydantic models
│   └── requirements.txt     # Backend dependencies
└── README.md               # This file
```

## 🚀 Technology Stack

### Frontend
- **React.js 18** - Modern UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Fast build tool and dev server

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database
- **Motor/PyMongo** - MongoDB async driver
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

## 📋 Features (Phase 1)

### ✅ Implemented
- User registration and login
- JWT-based authentication
- User dashboard with profile information
- Image upload interface for writing analysis
- Writing session management
- Responsive UI with basic styling
- API integration between frontend and backend
- MongoDB data persistence

### 🚧 Coming in Future Phases
- OCR processing for uploaded images
- AI-powered writing analysis
- Speech recognition and pronunciation practice
- Advanced learning analytics
- Gamification elements

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- MongoDB (local or cloud instance)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "AI Learning Platform"
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### Environment Configuration
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
```

#### Environment Variables (.env)
```env
# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=language_learning_db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Application Configuration
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

#### Start Backend Server
```bash
cd backend
python main.py
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Start Frontend Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## 🗄️ Database Setup

### MongoDB Local Installation
1. Install MongoDB Community Server
2. Start MongoDB service
3. Create database `language_learning_db` (will be created automatically)

### MongoDB Atlas (Cloud)
1. Create a free MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URL` in your `.env` file

### Collections
The application automatically creates these collections:
- `users` - User accounts and profiles
- `writing_sessions` - Writing practice sessions

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user info

### User Management
- `GET /user/{id}` - Get user by ID
- `GET /user/` - List users (paginated)
- `PUT /user/{id}` - Update user information

### Writing Sessions
- `POST /writing/upload` - Upload writing image
- `POST /writing/session` - Create writing session
- `GET /writing/sessions` - Get user's sessions
- `GET /writing/session/{id}` - Get specific session

## 🧪 Testing the Application

### Manual Testing Steps

1. **Start Both Services**
   - Backend: `python main.py` (port 8000)
   - Frontend: `npm run dev` (port 3000)

2. **Test User Registration**
   - Navigate to `http://localhost:3000`
   - Click "Login / Register"
   - Fill out registration form
   - Verify successful registration and auto-login

3. **Test Dashboard**
   - After login, you should be redirected to dashboard
   - Verify user information is displayed
   - Check writing sessions (should be empty initially)

4. **Test Image Upload**
   - Navigate to Writing Tutor
   - Upload an image file
   - Verify upload success message
   - Check dashboard for new writing session

5. **Test API Connectivity**
   - Open browser dev tools
   - Check network requests to `/api/*` endpoints
   - Verify successful responses

### Automated Testing
```bash
# Backend health check
curl http://localhost:8000/health

# Frontend connectivity
curl http://localhost:3000
```

## 🔧 Development Notes

### Code Structure
- **Modular Architecture**: Clear separation between frontend and backend
- **RESTful APIs**: Standard HTTP methods and status codes
- **Async Operations**: Non-blocking database operations
- **Error Handling**: Comprehensive error management
- **Security**: JWT authentication, password hashing, CORS

### Environment Best Practices
- Use `.env.example` as template
- Never commit `.env` files to version control
- Use strong secrets in production
- Enable HTTPS in production

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Verify MongoDB is running
   - Check connection string in `.env`
   - Ensure network connectivity

2. **CORS Errors**
   - Verify frontend URL is in CORS origins
   - Check backend CORS configuration

3. **Authentication Issues**
   - Clear browser localStorage
   - Verify JWT secret is consistent
   - Check token expiration

4. **File Upload Issues**
   - Verify `uploads` directory exists
   - Check file size limits
   - Ensure proper file permissions

### Debug Mode
Enable debug logging by setting `DEBUG=True` in `.env`

## 📝 Development Roadmap

### Phase 2 (Planned)
- OCR integration for image processing
- AI writing analysis
- Enhanced UI/UX
- Progress tracking

### Phase 3 (Planned)
- Speech recognition
- Interactive exercises
- Multi-language support
- Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For questions or issues:
- Check the troubleshooting section
- Review the API documentation
- Create an issue in the repository

---

**Note**: This is Phase 1 of the AI Language Learning Platform. Advanced AI features will be implemented in subsequent phases.
