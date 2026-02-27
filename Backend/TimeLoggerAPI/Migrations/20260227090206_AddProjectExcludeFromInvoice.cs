using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimeLoggerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectExcludeFromInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ExcludeFromInvoice",
                table: "Projects",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExcludeFromInvoice",
                table: "Projects");
        }
    }
}
