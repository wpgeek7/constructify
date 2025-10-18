# 📋 CSV Bulk Upload Guide

## Overview
This guide explains how to use the CSV bulk upload feature for Employees and Jobs in the Constructify system.

---

## 📁 Sample Files Provided

### 1. `sample_employees.csv`
- **Contains**: 12 sample employees with realistic data
- **Location**: `/Applications/MAMP/htdocs/constructify/sample_employees.csv`

### 2. `sample_jobs.csv`
- **Contains**: 10 sample construction projects
- **Location**: `/Applications/MAMP/htdocs/constructify/sample_jobs.csv`

---

## 👥 Employee CSV Format

### Required Columns:
```csv
fullname,email,phone,address,role_id,availability_status
```

### Column Details:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `fullname` | String | ✅ Yes | Full name of employee | `John Smith` |
| `email` | String | ✅ Yes | Email address (must be unique) | `john.smith@example.com` |
| `phone` | String | ❌ No | Phone number | `+1-555-0101` |
| `address` | String | ❌ No | Full street address | `123 Main St, San Francisco, CA` |
| `role_id` | Integer | ❌ No | Foreign key to roles table | `1` (for Carpenter) |
| `availability_status` | Enum | ❌ No | Employee availability | `available`, `unavailable`, `on_leave` |

### Valid `availability_status` Values:
- `available` (default)
- `unavailable`
- `on_leave`

### Valid `role_id` Values:
You need to create roles first in the Roles section. Example role IDs:
- `1` = Carpenter
- `2` = Electrician
- `3` = Plumber
- `4` = Site Manager
- `5` = Mason
- etc.

### Example Employee CSV:
```csv
fullname,email,phone,address,role_id,availability_status
John Smith,john.smith@example.com,+1-555-0101,"123 Main St, San Francisco, CA 94102",1,available
Maria Garcia,maria.garcia@example.com,+1-555-0102,"456 Oak Ave, San Francisco, CA 94103",2,available
```

---

## 🏗️ Job CSV Format

### Required Columns:
```csv
job_name,job_description,client_name,site_contact,job_address,latitude,longitude,start_date,deadline,status,employee_ids
```

### Column Details:

| Column | Type | Required | Description | Example |
|--------|------|----------|-------------|---------|
| `job_name` | String | ✅ Yes | Name of the job/project | `Downtown Office Renovation` |
| `job_description` | Text | ❌ No | Detailed description | `Complete interior renovation...` |
| `client_name` | String | ❌ No | Client company/person name | `Acme Corporation` |
| `site_contact` | String | ❌ No | On-site contact info | `Tom Anderson - 555-1234` |
| `job_address` | String | ❌ No | Full job site address | `555 Market St, SF, CA` |
| `latitude` | Decimal | ❌ No | GPS latitude (-90 to 90) | `37.789872` |
| `longitude` | Decimal | ❌ No | GPS longitude (-180 to 180) | `-122.400694` |
| `start_date` | Date | ❌ No | Project start date | `2025-10-15` (YYYY-MM-DD) |
| `deadline` | Date | ❌ No | Project deadline | `2025-12-20` (YYYY-MM-DD) |
| `status` | Enum | ❌ No | Current job status | `pending`, `in_progress`, `completed`, `on_hold` |
| `employee_ids` | String | ❌ No | Comma-separated employee IDs | `1,2,3` |

### Valid `status` Values:
- `pending` (default)
- `in_progress`
- `completed`
- `on_hold`

### Date Format:
- **Required format**: `YYYY-MM-DD`
- **Examples**: `2025-10-15`, `2025-12-31`, `2026-01-01`

### GPS Coordinates:
- **Latitude**: Between -90 and 90 (North/South)
- **Longitude**: Between -180 and 180 (East/West)
- **Precision**: Use 6 decimal places for ~10cm accuracy
- **Find coordinates**: Use Google Maps (right-click → "What's here?")

### Employee Assignment:
- Format: `"1,2,3"` (comma-separated, no spaces)
- Use employee IDs from the database
- Example: `"1,2,3"` assigns employees with IDs 1, 2, and 3

### Example Job CSV:
```csv
job_name,job_description,client_name,site_contact,job_address,latitude,longitude,start_date,deadline,status,employee_ids
Downtown Office Renovation,"Complete interior renovation",Acme Corporation,Tom Anderson,"555 Market St, SF",37.789872,-122.400694,2025-10-15,2025-12-20,pending,"1,2,3"
```

---

## 📝 How to Use CSV Upload

### **Step 1: Prepare Your CSV File**

1. **Use the sample files** as templates, or
2. **Create your own** following the format above
3. **Important tips**:
   - Use commas to separate values
   - Wrap text with commas in quotes: `"123 Main St, San Francisco"`
   - No extra spaces around values
   - Save as UTF-8 encoding
   - Use `.csv` file extension

### **Step 2: Upload Employees**

1. **Login as Admin**
2. Go to **"Employees"** tab
3. Click **"📤 Bulk Upload CSV"** button
4. Select your `sample_employees.csv` or custom CSV file
5. Click **"Upload"**
6. Wait for confirmation message
7. **Review**: Check that employees appear in the list with "pending" approval status

### **Step 3: Approve Employees (Optional)**

1. In the Employees list, find employees with "Pending" status
2. Click **"Approve"** button for each employee
3. Once approved, they can log in

### **Step 4: Upload Jobs**

1. Go to **"Jobs"** tab
2. Click **"📤 Bulk Upload CSV"** button
3. Select your `sample_jobs.csv` or custom CSV file
4. Click **"Upload"**
5. Wait for confirmation message
6. **Review**: Check that jobs appear in the list with assigned employees

---

## 🎯 Testing the Sample Files

### **Quick Test Steps:**

#### **A. Create Some Roles First:**
```
1. Login as Admin
2. Go to "Roles" tab
3. Create these roles:
   - Carpenter
   - Electrician
   - Plumber
   - Site Manager
4. Note the role IDs (should be 1, 2, 3, 4)
```

#### **B. Upload Sample Employees:**
```bash
1. Go to "Employees" tab
2. Click "Bulk Upload CSV"
3. Select: sample_employees.csv
4. Upload
5. Approve all employees
```

#### **C. Upload Sample Jobs:**
```bash
1. Go to "Jobs" tab
2. Click "Bulk Upload CSV"
3. Select: sample_jobs.csv
4. Upload
5. View the jobs list - should show 10 new jobs
```

#### **D. Verify:**
```
1. Check "Employees" - should show 12 new employees
2. Check "Jobs" - should show 10 new jobs
3. Click "View Details" on any job
4. See assigned employees list
5. Login as an employee to see their assigned jobs
```

---

## ⚠️ Common Issues & Solutions

### **Issue 1: "Email already exists"**
- **Cause**: Email addresses must be unique
- **Solution**: Change email addresses in CSV to unique values

### **Issue 2: "Invalid role_id"**
- **Cause**: Role ID doesn't exist in database
- **Solution**: Create the role first, or use an existing role ID

### **Issue 3: "Invalid date format"**
- **Cause**: Date not in YYYY-MM-DD format
- **Solution**: Use format: `2025-10-15` not `10/15/2025`

### **Issue 4: "Invalid latitude/longitude"**
- **Cause**: Coordinates out of range
- **Solution**: 
  - Latitude: -90 to 90
  - Longitude: -180 to 180
  - Use decimal format: `37.789872` not `37° 47' 23.5"`

### **Issue 5: "File too large"**
- **Cause**: CSV file exceeds upload limit
- **Solution**: Split into smaller files (max ~1000 rows per file)

### **Issue 6: "Invalid employee IDs for assignment"**
- **Cause**: Employee IDs in `employee_ids` column don't exist
- **Solution**: 
  - Upload employees first
  - Get their IDs from the employee list
  - Use correct IDs in jobs CSV

### **Issue 7: CSV file encoding issues**
- **Cause**: File saved with wrong encoding
- **Solution**: Save as UTF-8 encoding in Excel/Sheets:
  - **Excel**: File → Save As → CSV UTF-8
  - **Google Sheets**: File → Download → CSV

---

## 📊 Excel/Google Sheets Tips

### **Creating CSV in Excel:**
```
1. Open sample CSV in Excel
2. Edit your data
3. File → Save As
4. Format: CSV UTF-8 (Comma delimited) (*.csv)
5. Click Save
```

### **Creating CSV in Google Sheets:**
```
1. Open/import sample CSV
2. Edit your data
3. File → Download → Comma Separated Values (.csv)
4. Upload to Constructify
```

### **Special Characters:**
- Wrap in double quotes: `"Address with, comma"`
- Quotes inside text: Use two quotes: `"He said ""Hello"""`
- Line breaks: Replace with spaces or remove

---

## 🔍 CSV Validation Checklist

Before uploading, verify:

- [ ] All required columns are present
- [ ] Email addresses are unique
- [ ] Role IDs exist in your system
- [ ] Dates are in YYYY-MM-DD format
- [ ] Latitude is between -90 and 90
- [ ] Longitude is between -180 and 180
- [ ] Status values are valid (pending, in_progress, completed, on_hold)
- [ ] Availability values are valid (available, unavailable, on_leave)
- [ ] Employee IDs for job assignment exist in database
- [ ] No extra commas or special characters
- [ ] File is saved as .csv (not .xlsx or .xls)
- [ ] File encoding is UTF-8

---

## 📈 Bulk Upload Limits

### **Recommended Limits:**
- **Employees**: Up to 1,000 per file
- **Jobs**: Up to 500 per file
- **File Size**: Max 10 MB

### **Large Datasets:**
If you have more than these limits:
1. Split into multiple files
2. Upload sequentially
3. Wait for each to complete before next upload

---

## 🎓 Advanced Tips

### **1. Get GPS Coordinates from Google Maps:**
```
1. Go to Google Maps
2. Right-click on the location
3. Click "What's here?"
4. Copy the coordinates shown
   Example: 37.789872, -122.400694
5. Paste into CSV (latitude first, then longitude)
```

### **2. Bulk Create Employees for Testing:**
Use the sample file as a base and modify:
- Change names
- Change emails (must be unique!)
- Keep phone/address format similar

### **3. Employee IDs for Job Assignment:**
```sql
-- After uploading employees, get their IDs:
SELECT id, fullname, email FROM users WHERE role = 'employee';

-- Use these IDs in the employee_ids column of jobs CSV
```

### **4. Export Current Data as Template:**
You can export current employees/jobs from the database as CSV to use as templates.

---

## 📞 Support

If you encounter issues:
1. Check the browser console (F12) for errors
2. Check backend logs: `backend/storage/logs/laravel.log`
3. Verify CSV format matches examples above
4. Test with the provided sample files first

---

## 📝 Summary

**For Employees:**
```csv
fullname,email,phone,address,role_id,availability_status
John Smith,john@example.com,555-0101,"123 Main St",1,available
```

**For Jobs:**
```csv
job_name,job_description,client_name,site_contact,job_address,latitude,longitude,start_date,deadline,status,employee_ids
Office Renovation,"Interior work",Acme Corp,Tom,"555 Market St",37.789872,-122.400694,2025-10-15,2025-12-20,pending,"1,2,3"
```

**Quick Steps:**
1. Create roles
2. Upload employees → Approve them
3. Upload jobs → Assign to employees
4. Test by logging in as employee to see assigned jobs

---

Happy uploading! 🚀

