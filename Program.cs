using Cosa_ToDo.Models;
using Cosa_ToDo.Models.Data;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// DATABASE CONNECTION
builder.Services.AddDbContext<TodoDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

var app = builder.Build();
app.UseDefaultFiles();
app.UseStaticFiles();


// GET ALL PENDING TASKS
app.MapGet("/tasks", async (TodoDbContext db) =>
{
    return await db.Tasks.ToListAsync();
});


// GET TASK BY ID
app.MapGet("/tasks/{id}", async (int id, TodoDbContext db) =>
{
    var task = await db.Tasks.FindAsync(id);

    return task is not null
        ? Results.Ok(task)
        : Results.NotFound(new
        {
            Message = "Task not found"
        });
});


// CREATE TASK
app.MapPost("/tasks", async (TaskItem task, TodoDbContext db) =>
{
    db.Tasks.Add(task);

    await db.SaveChangesAsync();

    return Results.Created($"/tasks/{task.Id}", new
    {
        Message = "Task created successfully",
        Task = task
    });
});


// UPDATE TASK
app.MapPut("/tasks/{id}", async (
    int id,
    TaskItem updatedTask,
    TodoDbContext db) =>
{
    var task = await db.Tasks.FindAsync(id);

    if (task == null)
    {
        return Results.NotFound(new
        {
            Message = "Task not found"
        });
    }

    task.Title = updatedTask.Title;
    task.DueDate = updatedTask.DueDate;
    task.Priority = updatedTask.Priority;
    task.Status = updatedTask.Status;
    task.EstimatedHours = updatedTask.EstimatedHours;
    task.RewardForCompletion =
        updatedTask.RewardForCompletion;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        Message = "Task updated successfully",
        UpdatedTask = task
    });
});


// PATCH STATUS
app.MapPatch("/tasks/{id}/toggle", async (
    int id,
    TodoDbContext db) =>
{
    var task = await db.Tasks.FindAsync(id);

    if (task == null)
    {
        return Results.NotFound();
    }

    task.Status =
        task.Status == "Pending"
        ? "Completed"
        : "Pending";

    await db.SaveChangesAsync();

    return Results.Ok(task);
});


// DELETE TASK
app.MapDelete("/tasks/{id}", async (
    int id,
    TodoDbContext db) =>
{
    var task = await db.Tasks.FindAsync(id);

    if (task == null)
    {
        return Results.NotFound(new
        {
            Message = "Task not found"
        });
    }

    db.Tasks.Remove(task);

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        Message = "Deleted successfully",
        DeletedTask = task
    });
});


// FILTER BY DATE
app.MapGet("/tasks/filter/date", async (
    DateTime from,
    DateTime to,
    TodoDbContext db) =>
{
    var tasks = await db.Tasks
        .Where(t =>
            t.DueDate >= from &&
            t.DueDate <= to)
        .ToListAsync();

    return Results.Ok(tasks);
});


// FILTER BY STATUS
app.MapGet("/tasks/filter/status", async (
    int status,
    TodoDbContext db) =>
{
    string taskStatus =
        status == 1
        ? "Completed"
        : "Pending";

    var tasks = await db.Tasks
        .Where(t => t.Status == taskStatus)
        .ToListAsync();

    return Results.Ok(tasks);
});


// SUMMARY
app.MapGet("/tasks/summary", async (
    TodoDbContext db) =>
{
    int pending = await db.Tasks
        .CountAsync(t => t.Status == "Pending");

    int completed = await db.Tasks
        .CountAsync(t => t.Status == "Completed");

    int overdue = await db.Tasks
        .CountAsync(t =>
            t.Status == "Pending" &&
            t.DueDate < DateTime.Now);

    int total = await db.Tasks.CountAsync();

    double completionPercentage =
        total == 0
        ? 0
        : ((double)completed / total) * 100;

    return Results.Ok(new
    {
        Pending = pending,
        Completed = completed,
        Overdue = overdue,
        CompletionPercentage = completionPercentage
    });
});

app.Run();