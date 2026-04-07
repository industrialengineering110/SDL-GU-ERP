# Square Denim Ltd. - Enterprise ERP

## 🏗️ Production Deployment (Office Network)

### 1. Database (PostgreSQL)
Ensure a PostgreSQL instance is running on your central server.
```sql
CREATE DATABASE "Sdlguerp-db";
```

### 2. Backend (Node.js/Express)
Deploy on the server machine.
```bash
npm install
export DATABASE_URL="postgresql://user:pass@localhost/Sdlguerp-db"
export JWT_SECRET="your-office-secret-key"

# Run the server
npm start
```

### 3. Frontend (React)
Build the static assets and serve them via FastAPI (automatic) or Nginx.
```bash
npm install
npm run build
```
Access the application at `http://[SERVER-IP]:8000` from any computer on the local office network.

## 📱 Android Installation
1. Open the Server IP in Chrome on Android.
2. Select **"Add to Home Screen"** from the browser menu.
3. The app will launch as a standalone native-experience PWA.

## 🔒 Security
* **JWT Expiry**: Tokens expire every 12 hours (matching shift durations).
* **Isolation**: All queries are filtered by `department_id` to prevent cross-section data leakage.
* **Network**: Restricted CORS prevents unauthorized access from outside the office IP range.