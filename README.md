# TenantGuard - Enterprise Document Management Platform

A modern, secure document management platform built with React and Node.js, featuring enterprise-grade multi-tenant architecture, advanced security controls, and comprehensive document collaboration capabilities.

## 🚀 Features

### Enterprise Functionality
- **Multi-tenant Architecture**: Secure isolated workspaces for different organizations
- **Advanced Authentication**: JWT-based authentication with role-based access control
- **Document Management**: Upload, organize, view, and manage documents with version control
- **Secure Sharing**: Generate encrypted sharing links with granular permissions
- **User Management**: Comprehensive user profiles and administrative controls
- **Analytics Dashboard**: Real-time insights and document usage analytics
- **Compliance Ready**: Audit trails and security controls for regulatory compliance

### Technical Excellence
- **Frontend**: React 18 with modern hooks and responsive design
- **Backend**: Node.js with Express.js REST API architecture
- **Database**: MongoDB with optimized schemas and indexing
- **Security**: Enterprise-grade authentication and authorization
- **File Handling**: Secure file upload with validation and scanning
- **Scalability**: Designed for high-volume enterprise deployments

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TenantGuard
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Environment Configuration
The backend `.env` file is already configured with development settings:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/tenant_shield
JWT_SECRET=supersecretkey
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 5. Database Initialization
```bash
cd backend
npm run init-db
```

This will create the initial database structure and sample data including:
- Enterprise tenant organization
- Demo user: `demo@tenantguard.com` / `demo123`

### 6. Start the Application

**Backend (Terminal 1):**
```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

**Frontend (Terminal 2):**
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🎯 Usage Guide

### Getting Started
1. Navigate to http://localhost:3000
2. Login with demo credentials:
   - **Demo User**: `demo@tenantguard.com` / `demo123`

### Key Features

#### Dashboard
- View document statistics and storage usage
- Quick access to common actions
- Recent activity feed

#### Document Management
- **Upload**: Drag & drop or click to upload files
- **View**: Click on documents to view/download
- **Search**: Find documents by title or description
- **Delete**: Remove documents (with confirmation)

#### User Profile
- Update personal information
- Change password
- Upload profile avatar

#### Admin Panel (Admin users only)
- **User Management**: View, edit, and delete users
- **Document Overview**: System-wide document management
- **System Statistics**: Usage analytics and health monitoring

### API Endpoints

#### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset

#### Documents
- `GET /api/documents` - List user documents
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents/:id` - Get specific document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/share` - Create sharing link

#### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/change-password` - Change password
- `POST /api/profile/avatar` - Upload avatar

#### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `GET /api/admin/documents` - List all documents
- `GET /api/admin/stats` - System statistics
- `PUT /api/admin/users/:id/role` - Update user role
- `DELETE /api/admin/users/:id` - Delete user

#### Dashboard
- `GET /api/dashboard/stats` - User dashboard statistics
- `GET /api/dashboard/activity` - Recent activity

## 🏗️ Architecture

### Frontend Structure
```
frontend/src/
├── components/          # Reusable React components
│   ├── AdminPanel.jsx   # Admin interface
│   ├── Dashboard.jsx    # Dashboard component
│   ├── DocumentList.jsx # Document listing
│   ├── DocumentUpload.jsx # File upload
│   └── Profile.jsx      # User profile
├── context/             # React context providers
│   └── AuthContext.jsx  # Authentication context
├── pages/               # Main page components
│   ├── Home.jsx         # Main application page
│   ├── Login.jsx        # Login page
│   └── Register.jsx     # Registration page
├── App.jsx              # Main app component
├── App.css              # Comprehensive styling
└── index.js             # Application entry point
```

### Backend Structure
```
backend/src/
├── config/              # Configuration files
│   ├── database.js      # MongoDB connection
│   └── jwt.js           # JWT configuration
├── middleware/          # Express middleware
│   ├── auth.js          # Authentication middleware
│   └── tenant.js        # Tenant isolation
├── models/              # Mongoose schemas
│   ├── User.js          # User model
│   ├── Document.js      # Document model
│   ├── Tenant.js        # Tenant model
│   └── SharedLink.js    # Sharing model
├── routes/              # API route handlers
│   ├── auth.js          # Authentication routes
│   ├── documents.js     # Document management
│   ├── profile.js       # User profile
│   ├── admin.js         # Admin functions
│   └── analytics.js     # Analytics endpoints
├── scripts/             # Utility scripts
│   └── initDatabase.js  # Database initialization
├── app.js               # Express app configuration
└── server.js            # Server startup
```

## 🔧 Development

### Adding New Features
1. **Frontend**: Create components in `frontend/src/components/`
2. **Backend**: Add routes in `backend/src/routes/`
3. **Database**: Define models in `backend/src/models/`

### Environment Variables
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: Frontend URL for CORS
- `NODE_ENV`: Environment (development/production)

### File Upload Configuration
- **Location**: `backend/uploads/` and `backend/public/avatars/`
- **Size Limit**: 100MB for documents, 5MB for avatars
- **Supported Types**: PDF, DOC, DOCX, TXT, JPG, PNG, GIF

## 🔒 Security & Compliance

TenantGuard is built with enterprise security in mind:

- **Data Isolation**: Complete tenant separation with secure multi-tenancy
- **Access Controls**: Role-based permissions and document-level security
- **Audit Trails**: Comprehensive logging for compliance requirements
- **Encryption**: Data encryption in transit and at rest
- **Authentication**: Secure JWT-based authentication with session management
- **File Security**: Virus scanning and content validation for uploads

## 🚨 Production Deployment

For production environments, ensure:

- Use strong, unique JWT secrets
- Enable HTTPS/TLS encryption
- Implement proper backup strategies
- Configure monitoring and alerting
- Set up proper firewall rules
- Use environment-specific configurations
- Enable database authentication and encryption

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Ensure MongoDB is running on your system
- Check the connection string in `.env`
- Verify MongoDB service is started

**Port Already in Use**
- Change the PORT in `.env` file
- Kill existing processes using the port

**File Upload Issues**
- Check file permissions in upload directories
- Verify file size limits
- Ensure supported file types

**Authentication Problems**
- Clear browser localStorage
- Check JWT token expiration
- Verify user credentials

### Getting Help
- Check the console for error messages
- Review the API responses in browser dev tools
- Ensure all dependencies are installed correctly

---

**TenantGuard** - Secure, scalable, multi-tenant document management made simple.