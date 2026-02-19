-- Create TimeLoggerTest Database for Testing New Features
-- This script creates a test database with the updated schema including travel fields and settings

USE master;
GO

-- Drop database if it exists
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'TimeLoggerTest')
BEGIN
    ALTER DATABASE TimeLoggerTest SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE TimeLoggerTest;
END
GO

-- Create new database
CREATE DATABASE TimeLoggerTest;
GO

USE TimeLoggerTest;
GO

-- Create Customers table
CREATE TABLE Customers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
GO

CREATE INDEX IX_Customers_Name ON Customers(Name);
GO

-- Create Projects table
CREATE TABLE Projects (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CustomerId INT NOT NULL,
    ProjectNumber NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Projects_Customers FOREIGN KEY (CustomerId) REFERENCES Customers(Id)
);
GO

CREATE INDEX IX_Projects_CustomerId ON Projects(CustomerId);
CREATE UNIQUE INDEX IX_Projects_ProjectNumber ON Projects(ProjectNumber);
GO

-- Create TimeEntries table with new travel fields
CREATE TABLE TimeEntries (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    Date DATE NOT NULL,
    Hours DECIMAL(5,2) NULL,
    StartTime TIME NULL,
    EndTime TIME NULL,
    Description NVARCHAR(500) NULL,
    IsOnSite BIT NOT NULL DEFAULT 0,
    TravelHours DECIMAL(5,2) NULL,
    TravelKm DECIMAL(6,2) NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedDate DATETIME2 NULL,
    CONSTRAINT FK_TimeEntries_Projects FOREIGN KEY (ProjectId) REFERENCES Projects(Id)
);
GO

CREATE INDEX IX_TimeEntries_Date ON TimeEntries(Date);
CREATE INDEX IX_TimeEntries_ProjectId ON TimeEntries(ProjectId);
GO

-- Create Settings table
CREATE TABLE Settings (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    SekToEurRate DECIMAL(10,4) NOT NULL,
    HourlyRateEur DECIMAL(10,2) NOT NULL,
    TravelHourlyRateEur DECIMAL(10,2) NOT NULL,
    KmCost DECIMAL(10,2) NOT NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ModifiedDate DATETIME2 NULL
);
GO

-- Insert default settings
INSERT INTO Settings (SekToEurRate, HourlyRateEur, TravelHourlyRateEur, KmCost, CreatedDate)
VALUES (11.36, 152.00, 83.20, 0.80, GETUTCDATE());
GO

-- Insert sample data for testing
INSERT INTO Customers (Name, IsActive, CreatedDate)
VALUES 
    ('Test Customer A', 1, GETUTCDATE()),
    ('Test Customer B', 1, GETUTCDATE()),
    ('Test Customer C', 1, GETUTCDATE());
GO

INSERT INTO Projects (CustomerId, ProjectNumber, Name, IsActive, CreatedDate)
VALUES 
    (1, 'TC-001', 'Test Project Alpha', 1, GETUTCDATE()),
    (1, 'TC-002', 'Test Project Beta', 1, GETUTCDATE()),
    (2, 'TB-001', 'Test Project Gamma', 1, GETUTCDATE()),
    (3, 'TCC-001', 'Test Project Delta', 1, GETUTCDATE());
GO

-- Insert sample time entries with various scenarios
INSERT INTO TimeEntries (ProjectId, Date, Hours, Description, IsOnSite, TravelHours, TravelKm, CreatedDate)
VALUES 
    -- Regular hours, not on site, no travel
    (1, '2026-02-17', 8.00, 'Regular remote work', 0, NULL, NULL, GETUTCDATE()),
    
    -- On-site work with travel
    (1, '2026-02-18', 6.00, 'On-site client meeting', 1, 2.00, 150.00, GETUTCDATE()),
    
    -- Regular hours with travel time
    (2, '2026-02-18', 4.00, 'Remote work with site visit', 0, 1.50, 80.00, GETUTCDATE()),
    
    -- Full on-site day
    (3, '2026-02-19', 8.00, 'Full day on-site workshop', 1, 3.00, 250.00, GETUTCDATE());
GO

PRINT 'TimeLoggerTest database created successfully with sample data!';
PRINT '';
PRINT 'Database contains:';
PRINT '- 3 test customers';
PRINT '- 4 test projects';
PRINT '- 4 sample time entries demonstrating new features';
PRINT '- Settings with default values';
PRINT '';
PRINT 'Connection string: Server=(localdb)\mssqllocaldb;Database=TimeLoggerTest;Trusted_Connection=true;TrustServerCertificate=true';
GO
