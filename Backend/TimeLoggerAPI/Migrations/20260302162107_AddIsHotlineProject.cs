using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimeLoggerAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddIsHotlineProject : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsHotlineProject",
                table: "Projects",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsHotlineProject",
                table: "Projects");
        }
    }
}
