# 📧 Email Setup Guide for J&H Apartment Management System

## 🚨 Current Status: EMAILS TEMPORARILY DISABLED
The system is running without email functionality to avoid Gmail authentication errors.
Your application works perfectly - tenants can be added, deposits tracked, etc.

## 🔧 Quick Fix: Enable Gmail Authentication

### Step 1: Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click **2-Step Verification**
3. Follow the setup process if not already enabled

### Step 2: Generate App Password
1. In **2-Step Verification** settings
2. Scroll down to **App passwords**
3. Click **Select app** → **Mail**
4. Click **Select device** → **Other (Custom name)**
5. Enter "J&H Apartment System"
6. Click **GENERATE**
7. **Copy the 16-character password** (example: `abcd efgh ijkl mnop`)

### Step 3: Update Email Configuration

#### Option A: Environment Variables (Recommended)
```bash
set EMAIL_USER=your-email@gmail.com
set EMAIL_PASS=your-16-char-app-password
```

#### Option B: Direct File Edit
Edit `services/emailService.js` around line 8:
```javascript
auth: {
  user: 'your-email@gmail.com',
  pass: 'your-16-char-app-password'
}
```

### Step 4: Test Email Configuration
```bash
node test_email_config.js
```

### Step 5: Restart Application
```bash
npm start
```

## 🎯 What Emails Are Sent?

### Welcome Email
- **When**: New tenant added with email and room
- **Content**: Welcome message, contract details, deposit info
- **Recipient**: New tenant

### Deposit Receipt
- **When**: Both deposits marked as paid
- **Content**: Payment confirmation with PDF receipt
- **Recipient**: Tenant

### Contract Expiry Notice
- **When**: 30 days before contract expires
- **Content**: Renewal reminder and instructions
- **Recipient**: Tenant

## 🔍 Troubleshooting

### Common Issues:

1. **"Username and Password not accepted"**
   - Use App Password, not Gmail password
   - Ensure 2FA is enabled
   - Generate new App Password

2. **"Less secure app access"**
   - This is deprecated - use App Passwords instead

3. **Emails not sending**
   - Check `test_email_config.js` for diagnostics
   - Verify Gmail account settings

## 💡 Alternative Email Providers

If Gmail doesn't work, you can use other providers:

### Outlook/Hotmail
```javascript
service: 'hotmail',
auth: {
  user: 'your-email@outlook.com',
  pass: 'your-password'
}
```

### Custom SMTP
```javascript
host: 'your-smtp-server.com',
port: 587,
secure: false,
auth: {
  user: 'your-email@domain.com',
  pass: 'your-password'
}
```

## 🚀 Re-enable Emails

Once you have the correct Gmail credentials:

1. Update the credentials in `services/emailService.js`
2. Remove the `DISABLE_EMAILS` check or set it to `false`
3. Restart the application: `npm start`

## 📱 Current System Status

✅ **Application Running**: http://localhost:5000
✅ **Database**: Connected and operational
✅ **Tenant Management**: Fully functional
✅ **Deposit System**: Working (₱7,000 requirement)
✅ **Contract Management**: Active (6-month defaults)
⚠️ **Email Service**: Temporarily disabled

The system works perfectly without emails - they're an enhancement, not a requirement! 