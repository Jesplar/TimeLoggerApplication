# Time Logger - Management Reporting Guide

## Overview
This document explains how to use the management reporting queries for tracking time, preparing invoices, and analyzing productivity.

## Report Categories

### 1. Monthly Summaries
Perfect for end-of-month reviews and invoicing preparation.

**Monthly Summary by Customer**
- Shows total hours per customer for current month
- Use for high-level client billing overview

**Monthly Summary by Project**
- Detailed breakdown by project
- Use for itemized invoicing

### 2. Invoice Preparation
**Invoice Preparation Query (Report #4)**
- Customizable date range
- Edit the date variables at the top:
  ```sql
  DECLARE @InvoiceStartDate DATE = '2026-02-01';  -- Change this
  DECLARE @InvoiceEndDate DATE = '2026-02-28';    -- Change this
  ```
- Includes all details needed for billing
- Ready to export to Excel

**How to add hourly rates:**
Uncomment and modify this line in the query:
```sql
ISNULL(te.Hours, ...) * @HourlyRate AS Amount
```

### 3. Weekly Reports
**Weekly Timesheet (Report #3)**
- Automatically shows current week (Monday-Sunday)
- Daily breakdown with all details
- Perfect for weekly status meetings

### 4. Analysis Reports

**Productivity Analysis (Report #5)**
- Daily work patterns
- Shows days with heavy/light workload
- Helps identify peak productivity periods

**Customer Activity Report (Report #6)**
- Last 3 months of customer engagement
- See which clients are most active
- Track customer relationship trends

**Project Status Report (Report #7)**
- Overview of all projects
- Shows days since last activity
- Helps identify dormant projects

### 5. Performance Reports

**Year-to-Date Summary (Report #8)**
- Annual performance metrics
- Total days worked, projects completed
- Average hours per entry
- Great for annual reviews

**Month-by-Month Comparison (Report #9)**
- Track trends over 6 months
- Compare monthly workload
- Identify seasonal patterns

### 6. Export Reports

**Export for Excel/Invoicing (Report #11)**
- Complete data export in spreadsheet-friendly format
- Copy results directly to Excel
- All details included for processing

**Recent Activity (Report #10)**
- Last 7 days detailed log
- Quick review of recent work
- Verify logged hours

## How to Use These Reports

### In SQL Server Management Studio (SSMS)

1. **Connect to the database:**
   - Server: `(localdb)\mssqllocaldb`
   - Database: `TimeLogger`

2. **Open the query file:**
   - File → Open → File
   - Select `Management-Reports.sql`

3. **Run a specific report:**
   - Highlight the query you want (including the GO statement)
   - Press F5 or click Execute

4. **Export results:**
   - Right-click results → Save Results As
   - Choose CSV for Excel import
   - Or copy/paste directly into Excel

### Customizing Reports

#### Change Date Ranges:
Most reports have date variables at the top. Modify these:
```sql
DECLARE @StartDate DATE = '2026-01-01';
DECLARE @EndDate DATE = '2026-01-31';
```

#### Filter by Customer:
Add a WHERE clause:
```sql
WHERE c.Name = 'CustomerName'
```

#### Filter by Project:
Add a WHERE clause:
```sql
WHERE p.ProjectNumber = 'PROJ-001'
```

## Common Reporting Scenarios

### Scenario 1: Monthly Invoice for a Customer
1. Use **Report #4 - Invoice Preparation**
2. Set date range to billing period
3. Add customer filter: `WHERE c.Name = 'YourCustomer'`
4. Export to Excel
5. Add your hourly rates and calculate totals

### Scenario 2: Weekly Status Report
1. Use **Report #3 - Weekly Timesheet**
2. Run as-is (automatically uses current week)
3. Export to PDF or email directly from SSMS

### Scenario 3: Quarterly Review
1. Use **Report #6 - Customer Activity Report**
2. Modify the date range:
   ```sql
   DECLARE @QuarterStart DATE = '2026-01-01';
   ```
3. Run for Q1, Q2, Q3, Q4 as needed

### Scenario 4: Year-End Summary
1. Use **Report #8 - Year-to-Date Summary**
2. Run as-is (automatically calculates for current year)
3. Use for annual performance reviews

## Tips for Management Reporting

### Best Practices:
1. **Run weekly reports every Friday** for review
2. **Run monthly summaries on the 1st** of each month
3. **Keep exported reports** in a designated folder by month
4. **Review project status monthly** to identify inactive projects
5. **Use productivity analysis** to optimize work schedules

### Creating a Reporting Schedule:
- **Daily**: Review Recent Activity (Report #10)
- **Weekly**: Run Weekly Timesheet (Report #3)
- **Monthly**: Run all summaries (Reports #1, #2, #11)
- **Quarterly**: Customer Activity (Report #6)
- **Yearly**: YTD Summary (Report #8)

### Combining Reports:
For comprehensive client billing:
1. Monthly Summary by Project (detailed hours)
2. Invoice Preparation (line items)
3. Detailed Time Entries (supporting documentation)

## Excel Integration

### Quick Export to Excel:
1. Run query in SSMS
2. Click in results grid
3. Ctrl+A (select all)
4. Ctrl+C (copy)
5. Paste into Excel
6. Format as table

### Advanced: Power Query
Connect Excel directly to SQL Server:
- Data → Get Data → From Database → From SQL Server Database
- Server: `(localdb)\mssqllocaldb`
- Database: `TimeLogger`
- Use custom SQL queries from these reports

## Backup Your Data

Before major reporting periods, backup your database:
```sql
BACKUP DATABASE TimeLogger 
TO DISK = 'C:\Backups\TimeLogger_2026-02.bak'
WITH FORMAT, INIT, NAME = 'TimeLogger Backup';
```

## Need Help?

- All queries are commented with descriptions
- Modify date variables at the top of each query
- Results can be exported to CSV/Excel for further analysis
- Customize queries to match your specific reporting needs
