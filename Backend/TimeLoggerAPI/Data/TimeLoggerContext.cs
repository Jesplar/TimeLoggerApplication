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
            entity.Property(e => e.Description).HasMaxLength(500);
            
            // Indexes for query performance
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.ProjectId);
            
            // Foreign key relationship
            entity.HasOne(e => e.Project)
                .WithMany(p => p.TimeEntries)
                .HasForeignKey(e => e.ProjectId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
