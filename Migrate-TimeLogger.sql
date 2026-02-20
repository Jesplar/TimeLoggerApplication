-- Migration script for TimeLogger database
-- Adds TimeCodes, ReceiptTypes, Settings, Receipts tables
-- Adds TimeCodeId column to TimeEntries with default value 2

USE TimeLogger;
GO

-- Create TimeCodes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TimeCodes')
BEGIN
    CREATE TABLE TimeCodes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Code INT NOT NULL,
        Description NVARCHAR(200) NOT NULL,
        IsActive BIT NOT NULL,
        CreatedDate DATETIME2 NOT NULL,
        ModifiedDate DATETIME2 NULL
    );
    
    CREATE UNIQUE INDEX IX_TimeCodes_Code ON TimeCodes(Code);
    
    -- Seed initial time codes
    INSERT INTO TimeCodes (Code, Description, IsActive, CreatedDate)
    VALUES 
        (500, 'Project management', 1, '2026-02-20 00:00:00'),
        (530, 'StoreWare Software programming', 1, '2026-02-20 00:00:00'),
        (540, 'StoreWare visualisation', 1, '2026-02-20 00:00:00'),
        (560, 'Simulation', 1, '2026-02-20 00:00:00');
        
    PRINT 'TimeCodes table created and seeded';
END
ELSE
BEGIN
    PRINT 'TimeCodes table already exists';
END
GO

-- Create ReceiptTypes table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ReceiptTypes')
BEGIN
    CREATE TABLE ReceiptTypes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Name NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL,
        CreatedDate DATETIME2 NOT NULL,
        ModifiedDate DATETIME2 NULL
    );
    
    CREATE UNIQUE INDEX IX_ReceiptTypes_Name ON ReceiptTypes(Name);
    
    -- Seed initial receipt types
    INSERT INTO ReceiptTypes (Name, IsActive, CreatedDate)
    VALUES 
        ('Fuel', 1, '2026-02-20 00:00:00'),
        ('Hotel', 1, '2026-02-20 00:00:00'),
        ('PlaneTicket', 1, '2026-02-20 00:00:00'),
        ('Representation', 1, '2026-02-20 00:00:00'),
        ('AirBnB', 1, '2026-02-20 00:00:00'),
        ('RentalCar', 1, '2026-02-20 00:00:00');
        
    PRINT 'ReceiptTypes table created and seeded';
END
ELSE
BEGIN
    PRINT 'ReceiptTypes table already exists';
END
GO

-- Create Settings table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Settings')
BEGIN
    CREATE TABLE Settings (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        SekToEurRate DECIMAL(10,4) NOT NULL,
        HourlyRateEur DECIMAL(10,2) NOT NULL,
        TravelHourlyRateEur DECIMAL(10,2) NOT NULL,
        KmCost DECIMAL(10,2) NOT NULL,
        CreatedDate DATETIME2 NOT NULL,
        ModifiedDate DATETIME2 NULL
    );
    
    -- Seed initial settings
    INSERT INTO Settings (SekToEurRate, HourlyRateEur, TravelHourlyRateEur, KmCost, CreatedDate)
    VALUES (11.36, 152, 83.20, 0.80, '2026-02-20 00:00:00');
    
    PRINT 'Settings table created and seeded';
END
ELSE
BEGIN
    PRINT 'Settings table already exists';
END
GO

-- Add TimeCodeId column to TimeEntries if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TimeEntries') AND name = 'TimeCodeId')
BEGIN
    -- Add column with default value 2 (StoreWare Software programming)
    ALTER TABLE TimeEntries ADD TimeCodeId INT NOT NULL DEFAULT 2;
    
    -- Add foreign key constraint
    ALTER TABLE TimeEntries 
    ADD CONSTRAINT FK_TimeEntries_TimeCodes_TimeCodeId 
    FOREIGN KEY (TimeCodeId) REFERENCES TimeCodes(Id);
    
    CREATE INDEX IX_TimeEntries_TimeCodeId ON TimeEntries(TimeCodeId);
    
    PRINT 'TimeCodeId column added to TimeEntries with default value 2';
END
ELSE
BEGIN
    PRINT 'TimeCodeId column already exists in TimeEntries';
END
GO

-- Create Receipts table  
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Receipts')
BEGIN
    CREATE TABLE Receipts (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ProjectId INT NOT NULL,
        ReceiptTypeId INT NOT NULL,
        Date DATETIME2 NOT NULL,
        FileName NVARCHAR(500) NOT NULL,
        Cost DECIMAL(10,2) NOT NULL,
        Currency NVARCHAR(3) NOT NULL,
        CreatedDate DATETIME2 NOT NULL,
        ModifiedDate DATETIME2 NULL,
        CONSTRAINT FK_Receipts_Projects_ProjectId FOREIGN KEY (ProjectId) REFERENCES Projects(Id),
        CONSTRAINT FK_Receipts_ReceiptTypes_ReceiptTypeId FOREIGN KEY (ReceiptTypeId) REFERENCES ReceiptTypes(Id)
    );
    
    CREATE INDEX IX_Receipts_Date ON Receipts(Date);
    CREATE INDEX IX_Receipts_ProjectId ON Receipts(ProjectId);
    
    PRINT 'Receipts table created';
END
ELSE
BEGIN
    PRINT 'Receipts table already exists';
END
GO

-- Create EF Migrations History table if it doesn't exist and record this migration
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '__EFMigrationsHistory')
BEGIN
    CREATE TABLE __EFMigrationsHistory (
        MigrationId NVARCHAR(150) NOT NULL PRIMARY KEY,
        ProductVersion NVARCHAR(32) NOT NULL
    );
    PRINT '__EFMigrationsHistory table created';
END
GO

-- Record the migration
IF NOT EXISTS (SELECT * FROM __EFMigrationsHistory WHERE MigrationId = '20260220103443_AddTimeCodesAndReceiptTypes')
BEGIN
    INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
    VALUES ('20260220103443_AddTimeCodesAndReceiptTypes', '10.0.3');
    PRINT 'Migration recorded in history';
END
ELSE
BEGIN
    PRINT 'Migration already recorded';
END
GO

PRINT 'Migration completed successfully!';
GO
