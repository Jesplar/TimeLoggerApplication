-- ================================================================
-- TIME LOGGER - MANAGEMENT REPORTING QUERIES
-- ================================================================
-- Connect to: (localdb)\mssqllocaldb
-- Database: TimeLogger
-- ================================================================

USE TimeLogger;
GO

-- ================================================================
-- 1. MONTHLY SUMMARY BY CUSTOMER
-- Total hours per customer for the current month
-- ================================================================
DECLARE @CurrentMonth DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
DECLARE @NextMonth DATE = DATEADD(MONTH, 1, @CurrentMonth);

SELECT 
    c.Name AS Customer,
    COUNT(te.Id) AS TotalEntries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours,
    FORMAT(@CurrentMonth, 'MMMM yyyy') AS Period
FROM Customers c
LEFT JOIN Projects p ON c.Id = p.CustomerId
LEFT JOIN TimeEntries te ON p.Id = te.ProjectId 
    AND te.Date >= @CurrentMonth 
    AND te.Date < @NextMonth
WHERE c.IsActive = 1
GROUP BY c.Name
HAVING SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) > 0
ORDER BY TotalHours DESC;
GO

-- ================================================================
-- 2. MONTHLY SUMMARY BY PROJECT
-- Detailed breakdown by project for invoicing
-- ================================================================
DECLARE @CurrentMonth DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
DECLARE @NextMonth DATE = DATEADD(MONTH, 1, @CurrentMonth);

SELECT 
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS ProjectName,
    COUNT(te.Id) AS Entries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours,
    FORMAT(@CurrentMonth, 'MMMM yyyy') AS Period
FROM Projects p
INNER JOIN Customers c ON p.CustomerId = c.Id
LEFT JOIN TimeEntries te ON p.Id = te.ProjectId 
    AND te.Date >= @CurrentMonth 
    AND te.Date < @NextMonth
WHERE p.IsActive = 1
GROUP BY c.Name, p.ProjectNumber, p.Name
HAVING SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) > 0
ORDER BY c.Name, p.ProjectNumber;
GO

-- ================================================================
-- 3. WEEKLY TIMESHEET (CURRENT WEEK)
-- Daily breakdown for current week - useful for weekly reports
-- ================================================================
DECLARE @StartOfWeek DATE = DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE));
DECLARE @EndOfWeek DATE = DATEADD(DAY, 6, @StartOfWeek);

SELECT 
    CONVERT(VARCHAR(10), te.Date, 103) AS Date,
    DATENAME(WEEKDAY, te.Date) AS DayOfWeek,
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS Project,
    ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END) AS Hours,
    CONVERT(VARCHAR(5), te.StartTime, 108) AS StartTime,
    CONVERT(VARCHAR(5), te.EndTime, 108) AS EndTime,
    te.Description
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
WHERE te.Date BETWEEN @StartOfWeek AND @EndOfWeek
ORDER BY te.Date, c.Name, p.ProjectNumber;
GO

-- ================================================================
-- 4. INVOICE PREPARATION - CUSTOM DATE RANGE
-- Modify the dates below for your invoicing period
-- ================================================================
DECLARE @InvoiceStartDate DATE = '2026-02-01';  -- Change this
DECLARE @InvoiceEndDate DATE = '2026-02-28';    -- Change this

SELECT 
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS ProjectName,
    te.Date,
    ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END) AS Hours,
    te.Description,
    -- Add your hourly rate calculation here
    -- ISNULL(te.Hours, ...) * @HourlyRate AS Amount
    ROW_NUMBER() OVER (PARTITION BY c.Id, p.Id ORDER BY te.Date) AS LineNumber
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
WHERE te.Date BETWEEN @InvoiceStartDate AND @InvoiceEndDate
ORDER BY c.Name, p.ProjectNumber, te.Date;
GO

-- ================================================================
-- 5. PRODUCTIVITY ANALYSIS - DAILY HOURS
-- Track daily work patterns
-- ================================================================
SELECT 
    CONVERT(VARCHAR(10), te.Date, 103) AS Date,
    DATENAME(WEEKDAY, te.Date) AS DayOfWeek,
    COUNT(DISTINCT te.ProjectId) AS ProjectsWorkedOn,
    COUNT(te.Id) AS Entries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours
FROM TimeEntries te
WHERE te.Date >= DATEADD(MONTH, -1, GETDATE())
GROUP BY te.Date
ORDER BY te.Date DESC;
GO

-- ================================================================
-- 6. CUSTOMER ACTIVITY REPORT - LAST 3 MONTHS
-- See which customers you've been working with
-- ================================================================
DECLARE @ThreeMonthsAgo DATE = DATEADD(MONTH, -3, GETDATE());

SELECT 
    c.Name AS Customer,
    COUNT(DISTINCT p.Id) AS ActiveProjects,
    COUNT(te.Id) AS TotalEntries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours,
    MIN(te.Date) AS FirstEntry,
    MAX(te.Date) AS LastEntry
FROM Customers c
INNER JOIN Projects p ON c.Id = p.CustomerId
INNER JOIN TimeEntries te ON p.Id = te.ProjectId
WHERE te.Date >= @ThreeMonthsAgo
GROUP BY c.Name
ORDER BY TotalHours DESC;
GO

-- ================================================================
-- 7. PROJECT STATUS REPORT
-- Overview of all projects with recent activity
-- ================================================================
SELECT 
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS ProjectName,
    p.IsActive AS Active,
    COUNT(te.Id) AS TotalEntries,
    ISNULL(SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)), 0) AS TotalHours,
    MAX(te.Date) AS LastActivity,
    DATEDIFF(DAY, MAX(te.Date), GETDATE()) AS DaysSinceLastEntry
FROM Projects p
INNER JOIN Customers c ON p.CustomerId = c.Id
LEFT JOIN TimeEntries te ON p.Id = te.ProjectId
GROUP BY c.Name, p.ProjectNumber, p.Name, p.IsActive
ORDER BY LastActivity DESC;
GO

-- ================================================================
-- 8. YEAR-TO-DATE SUMMARY
-- Annual overview for performance reviews
-- ================================================================
DECLARE @YearStart DATE = DATEFROMPARTS(YEAR(GETDATE()), 1, 1);

SELECT 
    YEAR(GETDATE()) AS Year,
    COUNT(DISTINCT CONVERT(DATE, te.Date)) AS DaysWorked,
    COUNT(DISTINCT te.ProjectId) AS ProjectsWorked,
    COUNT(DISTINCT p.CustomerId) AS CustomersServed,
    COUNT(te.Id) AS TotalEntries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours,
    AVG(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS AvgHoursPerEntry
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
WHERE te.Date >= @YearStart;
GO

-- ================================================================
-- 9. MONTH-BY-MONTH COMPARISON (LAST 6 MONTHS)
-- Track trends over time
-- ================================================================
SELECT 
    FORMAT(te.Date, 'yyyy-MM') AS YearMonth,
    COUNT(te.Id) AS Entries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours,
    COUNT(DISTINCT te.ProjectId) AS ProjectsActive,
    COUNT(DISTINCT p.CustomerId) AS CustomersActive
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
WHERE te.Date >= DATEADD(MONTH, -6, GETDATE())
GROUP BY FORMAT(te.Date, 'yyyy-MM')
ORDER BY YearMonth DESC;
GO

-- ================================================================
-- 10. DETAILED TIME ENTRIES - LAST 7 DAYS
-- Recent activity log for review
-- ================================================================
SELECT 
    CONVERT(VARCHAR(10), te.Date, 103) AS Date,
    DATENAME(WEEKDAY, te.Date) AS Day,
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS Project,
    ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END) AS Hours,
    te.Description,
    te.CreatedDate AS LoggedAt
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
WHERE te.Date >= DATEADD(DAY, -7, GETDATE())
ORDER BY te.Date DESC, te.CreatedDate DESC;
GO

-- ================================================================
-- 11. EXPORT FOR EXCEL/INVOICING - MONTHLY
-- Complete export with all details for spreadsheet processing
-- ================================================================
DECLARE @ExportMonth DATE = DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1);
DECLARE @ExportNextMonth DATE = DATEADD(MONTH, 1, @ExportMonth);

SELECT 
    CONVERT(VARCHAR(10), te.Date, 120) AS Date,
    DATENAME(WEEKDAY, te.Date) AS DayOfWeek,
    c.Name AS Customer,
    p.ProjectNumber AS [Project Number],
    p.Name AS [Project Name],
    CAST(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END) AS DECIMAL(10,2)) AS Hours,
    CONVERT(VARCHAR(5), te.StartTime, 108) AS [Start Time],
    CONVERT(VARCHAR(5), te.EndTime, 108) AS [End Time],
    ISNULL(te.Description, '') AS Description,
    FORMAT(@ExportMonth, 'MMMM yyyy') AS Period
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
WHERE te.Date >= @ExportMonth 
    AND te.Date < @ExportNextMonth
ORDER BY te.Date, c.Name, p.ProjectNumber;
GO
