export const buildDashboardSnapshot = () => {
  try {
    const today = new Date();
    const hours = today.getHours();
    
    let timeGreeting = "evening";
    if (hours < 12) timeGreeting = "morning";
    else if (hours < 17) timeGreeting = "afternoon";

    // Read Tasks
    const tasksRaw = localStorage.getItem('ailifeos_mock_tasks') || '[]';
    const tasks = JSON.parse(tasksRaw);
    const pendingTasks = tasks.filter(t => !t.completed);
    const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');
    const topTask = highPriorityTasks[0] || pendingTasks[0];

    // Read Goals
    const goalsRaw = localStorage.getItem('ailifeos_mock_goals') || '[]';
    const goals = JSON.parse(goalsRaw);
    const activeGoals = goals.filter(g => g.progress < 100);

    // Read Notes
    const notesRaw = localStorage.getItem('ailifeos_mock_notes') || '[]';
    const notes = JSON.parse(notesRaw);
    const recentNotes = notes.slice(-2).map(n => n.title);

    // Fake a streak for now (Phase 5 will have a real stats abstraction)
    const streak = Math.floor(Math.random() * 5) + 1;
    
    let mood = "neutral";
    if (streak > 3 && pendingTasks.length < 5) mood = "productive";
    if (highPriorityTasks.length > 3) mood = "stressed";

    const snapshot = {
      timestamp: today.toISOString(),
      timeOfDay: timeGreeting,
      dayOfWeek: today.toLocaleDateString('en-US', { weekday: 'long' }),
      tasks: {
        pendingCount: pendingTasks.length,
        highPriorityCount: highPriorityTasks.length,
        topTaskTitle: topTask ? topTask.title : null
      },
      goals: {
        activeCount: activeGoals.length,
        topGoal: activeGoals[0] ? { title: activeGoals[0].title, progress: activeGoals[0].progress } : null
      },
      recentNotes,
      stats: {
        streakDays: streak,
        inferredMood: mood
      }
    };

    return snapshot;
  } catch (err) {
    console.error("Failed to build dashboard snapshot:", err);
    return null; // Degrade gracefully
  }
};
