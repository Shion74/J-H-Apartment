# J&H Apartment Management System

A property management system for J&H Apartment built with Node.js, Express, and MySQL.

## Features

- User authentication with role-based access
- Dashboard with overview of rooms, tenants, and finances
- Tenant management (add, edit, delete)
- Room management (add, edit, delete)
- Billing management (generate bills, record payments)
- Responsive design for desktop and mobile

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Authentication**: JWT and Session-based
- **Other**: XAMPP for local MySQL server

## Prerequisites

- Node.js (v14 or higher)
- XAMPP (for MySQL database)
- Web browser

## Setup Instructions

### 1. Database Setup

1. Start XAMPP and ensure MySQL is running
2. Open phpMyAdmin (http://localhost/phpmyadmin)
3. Create a new database or import the provided SQL script:
   ```
   mysql -u root -p < config/database.sql
   ```
   Or you can copy the contents of `config/database.sql` and paste it into the SQL tab in phpMyAdmin, then click "Go".

### 2. Application Setup

1. Clone the repository
   ```
   git clone https://github.com/yourusername/J-H-Apartment.git
   cd J-H-Apartment
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your_secret_key_here

   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=jh_apartment
   DB_PORT=3306
   ```
   
   Adjust the database credentials as needed.

4. Start the application
   ```
   npm run dev
   ```

5. Access the application in your browser
   ```
   http://localhost:3000
   ```

### 3. Default Login Credentials

- **Username**: admin
- **Password**: admin123

## Project Structure

- `/config` - Database configuration
- `/controllers` - Request handlers
- `/middleware` - Authentication middleware
- `/models` - Database models
- `/public` - Static assets (CSS, JS, images)
- `/routes` - API routes
- `/views` - HTML templates
- `app.js` - Main application file

## License

ISC

## Author

Your Name
