using Microsoft.EntityFrameworkCore;
using TimeLoggerAPI.Models;

namespace TimeLoggerAPI.Data;

public class TimeLoggerContext : DbContext
{
    public TimeLoggerContext(DbContextOptions<TimeLoggerContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers { get; set; } = null!;
    public DbSet<Project> Projects { get; set; } = null!;
    public DbSet<TimeEntry> TimeEntries { get; set; } = null!;
    public DbSet<Settings> Settings { get; set; } = null!;
    public DbSet<TimeCode> TimeCodes { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Customer configuration
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Name);
        });

        // Project configuration
        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProjectNumber).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            
            // Unique constraint on ProjectNumber per Customer
            entity.HasIndex(e => new { e.CustomerId, e.ProjectNumber }).IsUnique();
            
            // Foreign key relationship
            entity.HasOne(e => e.Customer)
                .WithMany(c => c.Projects)
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TimeEntry configuration
        modelBuilder.Entity<TimeEntry>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Hours).HasPrecision(5, 2);
            entity.Property(e => e.TravelHours).HasPrecision(5, 2);
            entity.Property(e => e.TravelKm).HasPrecision(6, 2);
            entity.Property(e => e.Description).HasMaxLength(500);
            
            // Indexes for query performance
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.ProjectId);
            
            // Foreign key relationship to Project
            entity.HasOne(e => e.Project)
                .WithMany(p => p.TimeEntries)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
            
            // Foreign key relationship to TimeCode
            entity.HasOne(e => e.TimeCode)
                .WithMany()
                .HasForeignKey(e => e.TimeCodeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TimeCode configuration
        modelBuilder.Entity<TimeCode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Description).IsRequired().HasMaxLength(200);
            entity.HasIndex(e => e.Code).IsUnique();
            
            // Seed initial time codes
            entity.HasData(
                new TimeCode { Id = 1, Code = 500, Description = "Project management", IsActive = true, CreatedDate = DateTime.UtcNow },
                new TimeCode { Id = 2, Code = 530, Description = "StoreWare Software programming", IsActive = true, CreatedDate = DateTime.UtcNow },
                new TimeCode { Id = 3, Code = 540, Description = "StoreWare visualisation", IsActive = true, CreatedDate = DateTime.UtcNow },
                new TimeCode { Id = 4, Code = 560, Description = "Simulation", IsActive = true, CreatedDate = DateTime.UtcNow }
            );
        });

        // Settings configuration
        modelBuilder.Entity<Settings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.SekToEurRate).HasPrecision(10, 4);
            entity.Property(e => e.HourlyRateEur).HasPrecision(10, 2);
            entity.Property(e => e.TravelHourlyRateEur).HasPrecision(10, 2);
            entity.Property(e => e.KmCost).HasPrecision(10, 2);
            
            // Seed initial values
            entity.HasData(new Settings
            {
                Id = 1,
                SekToEurRate = 11.36m,
                HourlyRateEur = 152m,
                TravelHourlyRateEur = 83.20m,
                KmCost = 0.80m,
                CreatedDate = DateTime.UtcNow
            });
        });
    }
}
