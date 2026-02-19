# Reports Feature - User Guide

## Overview
The Time Logger application now includes a comprehensive **Reports** tab that allows you to generate management reports directly from the application and export them to Excel.

## Accessing Reports
1. Open the Time Logger application
2. Click the **Reports** tab in the main navigation

## Available Reports

### 1. Monthly Summary by Customer
**Purpose:** Get a high-level overview of hours worked per customer for any month

**When to use:**
- End-of-month review
- Quick client billing overview
- Monthly performance tracking

**Filters:**
- Year (select any year)
- Month (select 1-12)

**Data shown:**
- Customer name
- Total entries
- Total hours
- Period

### 2. Monthly Summary by Project
**Purpose:** Detailed breakdown of hours by project for invoicing

**When to use:**
- Preparing itemized invoices
- Project-level billing
- Comparing project workload

**Filters:**
- Year and Month
- Customer (optional - filter for specific customer)

**Data shown:**
- Customer name
- Project number
- Project name
- Number of entries
- Total hours
- Period

### 3. Invoice Preparation
**Purpose:** Detailed time entry list for custom date ranges

**When to use:**
- Creating invoices for specific billing periods
- Quarterly billing
- Custom date range analysis

**Filters:**
- Start Date (custom)
- End Date (custom)
- Customer (optional)

**Data shown:**
- Date
- Customer
- Project number/name
- Hours
- Start/end times (if used)
- Description

**Note:** This is the most detailed report - perfect for invoice line items.

### 4. Weekly Timesheet
**Purpose:** Daily breakdown for a specific week (Monday-Sunday)

**When to use:**
- Weekly status meetings
- Weekly team reports
- Verifying weekly hours

**Filters:**
- Week starting date (Monday)

**Data shown:**
- Date and day of week
- Customer
- Project details
- Hours
- Time entries
- Description

### 5. Customer Activity Report
**Purpose:** Analyze customer engagement over a date range

**When to use:**
- Quarterly reviews
- Customer relationship analysis
- Identifying most active clients

**Filters:**
- Start Date
- End Date

**Data shown:**
- Customer name
- Number of active projects
- Total entries
- Total hours
- First and last entry dates

### 6. Project Status Report
**Purpose:** Overview of all projects with recent activity

**When to use:**
- Identifying dormant projects
- Project portfolio review
- Checking project health

**Filters:**
- None (shows all projects)

**Data shown:**
- Customer
- Project number/name
- Active status
- Total entries and hours
- Last activity date
- Days since last entry

### 7. Year-to-Date Summary
**Purpose:** Annual performance metrics

**When to use:**
- Year-end reviews
- Annual reporting
- Performance evaluations

**Filters:**
- Year

**Data shown:**
- Days worked
- Projects worked on
- Customers served
- Total entries
- Total hours
- Average hours per entry

### 8. Month-by-Month Comparison
**Purpose:** Track trends over the last 6 months

**When to use:**
- Identifying seasonal patterns
- Workload trend analysis
- Capacity planning

**Filters:**
- None (automatically shows last 6 months)

**Data shown:**
- Year-Month
- Entries
- Total hours
- Active projects
- Active customers

## How to Generate a Report

1. **Select Report Type**
   - Choose from the dropdown at the top
   - Read the description to confirm it's what you need

2. **Set Filters**
   - Depending on the report type, you'll see:
     - Year/Month pickers
     - Date range selectors
     - Customer filters
   - All filters show reasonable defaults

3. **Click "Generate Report"**
   - The report will load in a table below
   - You'll see the number of records returned

4. **Review the Data**
   - Scroll through the table
   - Data is formatted for easy reading
   - Dates show as "MMM dd, yyyy"
   - Hours show with 2 decimal places
   - Times show in 24-hour format

5. **Export to Excel** (Optional)
   - Click the green "📥 Export to Excel" button
   - Excel file downloads automatically
   - Filename includes report name and timestamp
   - Example: `Monthly_Summary_by_Customer_2026-02-19-143022.xlsx`

## Excel Export Features

The Excel export creates a ready-to-use spreadsheet:
- All data included in separate columns
- Headers are clear and descriptive
- Can be opened in Excel, Google Sheets, LibreOffice
- Perfect for further analysis or formatting
- Easy to copy/paste into other documents

## Tips for Best Results

### For Invoicing:
1. Use **Invoice Preparation** report
2. Set exact billing period dates
3. Filter by customer if needed
4. Export to Excel
5. Add your rates and formulas in Excel

### For Monthly Reviews:
1. Run **Monthly Summary by Customer**
2. Run **Monthly Summary by Project**
3. Export both to Excel
4. Compare against budget or targets

### For Weekly Meetings:
1. Use **Weekly Timesheet**
2. Set to current week
3. Review before exporting
4. Share with team as needed

### For Year-End:
1. Run **Year-to-Date Summary** for overview
2. Run **Month-by-Month Comparison** for trends
3. Export both for annual reports

## Keyboard Shortcuts

- **Tab** - Navigate between filter fields
- **Enter** - Generate report (when in any filter field)
- **Escape** - Clear current report (returns to selection)

## Data Accuracy

All reports use the same calculation logic:
- If Hours field is filled → uses that value
- If Start/End times are filled → calculates duration
- Respects Monday-Sunday week definitions
- All dates are in your local timezone

## Troubleshooting

**"No data available"**
- Check your date ranges
- Verify you have time entries for that period
- Try removing customer filter

**Excel not downloading**
- Check browser download settings
- Ensure you generated a report first
- Try a different browser if issues persist

**Report takes long to load**
- This is normal for large date ranges
- Consider breaking into smaller periods
- Year-to-date with many entries may take 5-10 seconds

## Examples

### Example 1: Monthly Invoice for "Acme Corp"
1. Select: **Invoice Preparation**
2. Start Date: `2026-02-01`
3. End Date: `2026-02-28`
4. Customer: `Acme Corp`
5. Click: **Generate Report**
6. Review the line items
7. Click: **Export to Excel**
8. Open in Excel, add rate column: `=Hours * $50`
9. Total at bottom: `=SUM(Amount)`

### Example 2: Current Week Status
1. Select: **Weekly Timesheet**
2. Week starting: (automatically set to this Monday)
3. Click: **Generate Report**
4. Review daily breakdown
5. Export to share with manager

### Example 3: Quarterly Customer Review
1. Select: **Customer Activity Report**
2. Start Date: `2026-01-01`
3. End Date: `2026-03-31`
4. Click: **Generate Report**
5. See which customers are most active
6. Export for stakeholder meeting

## Integration with SQL Reports

The Reports tab generates the same data as the SQL queries in:
- `Management-Reports.sql`
- Can cross-verify data if needed
- SQL queries offer more customization
- Reports tab offers convenience and Excel export

## Future Enhancements

Potential additions (not yet implemented):
- PDF export
- Scheduled automatic reports
- Email delivery
- Custom report templates
- Charts and visualizations
- Custom date range presets (This Quarter, Last Month, etc.)

## Need Help?

All reports are designed to be self-explanatory, but if you need assistance:
1. Check the report description
2. Review this user guide
3. Try with a small date range first
4. Verify data exists in Weekly View first

---

**Tip:** Bookmark this guide for quick reference while using the Reports feature!
