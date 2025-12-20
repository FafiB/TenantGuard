# TenantGuard - Enterprise Document Management Platform

**Author:** Fasika Belayneh  
**Version:** 1.0.0  
**Purpose:** Security Research & Penetration Testing
**Watch Video:**https://youtu.be/2Qjl0HFf0Fw
## Overview

TenantGuard is an intentionally vulnerable enterprise document management platform designed for security research and penetration testing. It features a multi-tenant architecture with role-based access control, file management capabilities, and payment processing - all implemented with deliberate security vulnerabilities for educational purposes.

## Architecture

- **Frontend:** React 18 with modern UI components
- **Backend:** Node.js with Express.js REST API
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT-based with role management
- **File Storage:** Local filesystem with multer
- **Payment:** Custom insecure payment gateway

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5.0 or higher)
- Python 3.6+ (for exploit scripts)
- Git

### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd TenantGuard
```

2. **Backend Setup**
```bash
cd backend
npm install
npm run init-db
npm start
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm start
```

4. **Exploit Scripts Setup**
```bash
cd exploit-scripts
pip install requests
```

### Default Credentials

- **Admin:** demo@tenantguard.com / demo123
- **User:** test@tenantguard.com / test123

### Application URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/health

## Vulnerable Components

### 1. Authentication System
- Plain text password storage
- Weak password policies
- Information disclosure in password reset

### 2. Authorization Framework
- Broken Object Level Authorization (BOLA)
- Cross-tenant data access
- Missing ownership verification

### 3. File Upload System
- No file type validation
- Executable file upload
- Directory traversal vulnerabilities

### 4. Payment Gateway
- Unencrypted sensitive data storage
- No input validation
- Cross-user payment access

### 5. Multi-Tenant Architecture
- Tenant isolation bypass
- Cross-tenant admin access
- Weak tenant validation

### 6. Information Disclosure
- System information exposure
- Error message leakage
- Path disclosure vulnerabilities

## Security Testing

### Running Individual Exploits
```bash
cd exploit-scripts
python3 plaintext_passwords.py
python3 bola_exploit.py
python3 file_upload_exploit.py
```

### Running All Exploits
```bash
cd exploit-scripts
python3 run_all_exploits.py
```

## Project Structure

```
TenantGuard/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Authentication & validation
│   │   └── scripts/        # Database initialization
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Application pages
│   │   └── services/       # API integration
│   └── package.json
├── exploit-scripts/        # Security testing scripts
│   ├── *.py               # Individual exploit scripts
│   └── README.md          # Exploit documentation
├── vulnerability-docs/     # Detailed vulnerability documentation
└── README.md              # This file
```

## Legal Notice

This application contains intentional security vulnerabilities and is designed exclusively for:

- Security research and education
- Authorized penetration testing
- Vulnerability assessment training
- Security awareness demonstrations

**WARNING:** Do not deploy this application in production environments. Only use on systems you own or have explicit permission to test.

## Contributing

This project is for educational purposes. If you discover additional vulnerabilities or have improvements to the exploit scripts, please document them following the established format.

## License

MIT License - See LICENSE file for details.

---

**Disclaimer:** This software is provided for educational purposes only. The author is not responsible for any misuse or damage caused by this software.