namespace Cosa_ToDo.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        public string Title { get; set; }

        // Custom Fields
        public DateTime DueDate { get; set; }

        public string Priority { get; set; }

        // Custom Fields
        public string Status { get; set; }

        public int EstimatedHours { get; set; }

        public string RewardForCompletion { get; set; }
    }
}