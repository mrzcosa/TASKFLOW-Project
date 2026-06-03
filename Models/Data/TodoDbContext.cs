using Microsoft.EntityFrameworkCore;
using Cosa_ToDo.Models;

namespace Cosa_ToDo.Models.Data
{
    public class TodoDbContext : DbContext
    {
        public TodoDbContext(DbContextOptions<TodoDbContext> options)
            : base(options)
        {
        }

        public DbSet<TaskItem> Tasks { get; set; }
    }
}