# Appien Deployment Guide

## Prerequisites

Before deploying this application, you need to set up the following:

### 1. MongoDB Database Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (free tier is available)
4. Create a database user:
   - Go to Database Access
   - Click "Add New Database User"
   - Choose a username and strong password
   - Grant "Read and write to any database" permissions
5. Whitelist IP addresses:
   - Go to Network Access
   - Click "Add IP Address"
   - For development: Add "0.0.0.0/0" (allows all IPs)
   - For production: Add your server's specific IP address
6. Get your connection string:
   - Go to Database → Connect
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<username>` and `<password>` with your database user credentials

### 2. VAPID Keys for Push Notifications

Generate VAPID keys for web push notifications:

```bash
cd server
npx web-push generate-vapid-keys
```

This will output a public and private key pair. Save these for the next step.

### 3. Environment Variables Setup

1. Copy `.env.example` to `.env` in the `server` directory:
   ```bash
   cp server/.env.example server/.env
   ```

2. Fill in the values in `server/.env`:
   - `PORT`: Server port (default: 5000)
   - `JWT_SECRET`: A long, random string for JWT token encryption (generate using: `openssl rand -base64 32`)
   - `VAPID_PUBLIC_KEY`: Public key from step 2
   - `VAPID_PRIVATE_KEY`: Private key from step 2
   - `VAPID_EMAIL`: Your contact email (format: mailto:your-email@example.com)
   - `MONGO_URI`: Your MongoDB connection string from step 1

### 4. Installation

#### Server Setup
```bash
cd server
npm install
npm start
```

#### Client Setup
```bash
cd client
npm install
npm run dev
```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit the `.env` file to version control
- Use strong, unique passwords for your MongoDB database
- Generate a new JWT_SECRET (don't use the example value)
- Keep your VAPID keys secure
- In production, restrict MongoDB network access to your server's IP only

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use proper process managers (PM2, systemd)
3. Set up HTTPS/SSL certificates
4. Configure proper CORS settings
5. Use environment-specific MongoDB clusters
6. Implement proper logging and monitoring

## Support

For issues or questions, contact: [Your Contact Information]
