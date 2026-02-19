-- TimeLogger Database Queries for SSMS
-- Connect to: (localdb)\mssqllocaldb

USE TimeLogger;
GO

-- View all customers
SELECT 
    Id,
    Name,
    IsActive,
    CreatedDate
FROM Customers
ORDER BY Name;
GO

-- View all projects with customer names
SELECT 
    p.Id,
    c.Name AS CustomerName,
    p.ProjectNumber,
    p.Name AS ProjectName,
    p.IsActive,
    p.CreatedDate
FROM Projects p
INNER JOIN Customers c ON p.CustomerId = c.Id
ORDER BY c.Name, p.ProjectNumber;
GO

-- View all time entries with full details
SELECT 
    te.Id,
    te.Date,
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS Project,
    ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END) AS Hours,
    te.StartTime,
    te.EndTime,
    te.Description,
    te.CreatedDate
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
ORDER BY te.Date DESC, c.Name;
GO

-- Weekly summary (current week)
DECLARE @StartOfWeek DATE = DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE));
DECLARE @EndOfWeek DATE = DATEADD(DAY, 6, @StartOfWeek);

SELECT 
    te.Date,
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS Project,
    ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END) AS Hours
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
WHERE te.Date BETWEEN @StartOfWeek AND @EndOfWeek
ORDER BY te.Date, c.Name;
GO

-- Project totals for current week
DECLARE @StartOfWeek DATE = DATEADD(DAY, 1 - DATEPART(WEEKDAY, GETDATE()), CAST(GETDATE() AS DATE));
DECLARE @EndOfWeek DATE = DATEADD(DAY, 6, @StartOfWeek);

SELECT 
    c.Name AS Customer,
    p.ProjectNumber,
    p.Name AS Project,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours
FROM TimeEntries te
INNER JOIN Projects p ON te.ProjectId = p.Id
INNER JOIN Customers c ON p.CustomerId = c.Id
WHERE te.Date BETWEEN @StartOfWeek AND @EndOfWeek
GROUP BY c.Name, p.ProjectNumber, p.Name
ORDER BY c.Name, p.ProjectNumber;
GO

-- Total hours in database
SELECT 
    COUNT(*) AS TotalEntries,
    SUM(ISNULL(te.Hours, 
        CASE 
            WHEN te.StartTime IS NOT NULL AND te.EndTime IS NOT NULL 
            THEN DATEDIFF(MINUTE, te.StartTime, te.EndTime) / 60.0
            ELSE 0 
        END)) AS TotalHours
FROM TimeEntries te;
GO
