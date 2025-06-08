# Database Setup Guide

## Setting up the Branch-Based Database Schema

Since we've updated the apartment management system to use a branch-based structure, you'll need to update your database schema. Follow these steps:

### Option 1: Using MySQL Workbench or phpMyAdmin
1. Open MySQL Workbench or phpMyAdmin
2. Connect to your MySQL server
3. Copy and paste the entire content from `config/database.sql`
4. Execute the script

### Option 2: Using MySQL Command Line
If you have MySQL in your PATH:
```bash
mysql -u root -p < config/database.sql
```

### Option 3: Manual Setup
If you prefer to run the commands manually:

1. **Drop and recreate the database:**
```sql
DROP DATABASE IF EXISTS jh_apartment;
CREATE DATABASE IF NOT EXISTS jh_apartment;
USE jh_apartment;
```

2. **Create the tables in this order:**
   - users table (unchanged)
   - **branches table (NEW)**
   - rooms table (updated with branch_id)
   - tenants table (unchanged)
   - bills table (unchanged)
   - payments table (unchanged)

3. **Insert sample data:**
   - Admin user
   - Sample branches (Main Building, North Wing, South Wing)
   - Sample rooms with branch references

## What's New in the Branch System

### New Features:
- **Branches**: Organize rooms into different buildings or sections
- **Expandable Dashboard**: Click on branches to see their rooms
- **Add Branches**: Create new branches with name, description, and address
- **Add Rooms to Branches**: Assign rooms to specific branches
- **Branch Statistics**: See room counts and revenue per branch

### Database Changes:
- Added `branches` table
- Modified `rooms` table to include `branch_id` foreign key
- Room numbers are now unique per branch (not globally unique)
- Updated all queries to include branch information

### Dashboard Changes:
- Replaced direct room listing with branch-based organization
- Added collapsible branch cards
- Integrated branch and room creation modals
- Updated statistics to show branch counts

## Testing the Application

1. Start the server: `npm start`
2. Visit `http://localhost:5000`
3. Login with: username: `admin`, password: `admin123`
4. You should see the new branch-based dashboard

## Troubleshooting

If you encounter any issues:
1. Make sure MySQL is running
2. Check that the database connection settings in your `.env` file are correct
3. Verify that all tables were created successfully
4. Check the browser console for any JavaScript errors 