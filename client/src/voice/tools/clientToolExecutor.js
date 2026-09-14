export const executeClientTool = async (callId, name, args, navigate) => {
  try {
    let result = null;

    switch (name) {
      case 'navigate_ui':
        if (args.target) {
          // target is one of: dashboard, tasks, goals, notes, study, calendar, analytics, assistant
          navigate(`/${args.target === 'dashboard' ? '' : args.target}`);
          result = { success: true, message: `Navigated to ${args.target}` };
        } else {
          result = { success: false, error: 'Target missing' };
        }
        break;

      case 'open_note':
        // For Phase 2, we just navigate to notes, since modal logic requires UI changes
        navigate('/notes');
        result = { success: true, message: `Opened note ${args.id}` };
        break;

      case 'start_focus_session':
        navigate('/study');
        result = { success: true, message: `Started ${args.minutes}m focus session on ${args.topic}` };
        break;

      case 'create_task':
        // Mock data store mutation for Phase 2
        result = mockDataMutation('tasks', args);
        break;
      
      case 'update_task':
      case 'complete_task':
        result = mockDataMutation('tasks', args, 'update');
        break;

      case 'create_goal':
        result = mockDataMutation('goals', args);
        break;

      case 'update_goal_progress':
        result = mockDataMutation('goals', args, 'update');
        break;

      case 'create_note':
        result = mockDataMutation('notes', args);
        break;

      case 'schedule_event':
        result = mockDataMutation('events', args);
        break;
        
      default:
        result = { success: false, error: `Unknown client tool: ${name}` };
    }

    return { call_id: callId, result };
  } catch (error) {
    console.error(`[ToolExecutor] Error executing ${name}:`, error);
    return { call_id: callId, result: { success: false, error: error.message } };
  }
};

/**
 * Temporary mock data mutation for Phase 2 until data store is fully implemented
 */
const mockDataMutation = (entity, data, action = 'create') => {
  try {
    const key = `ailifeos_mock_${entity}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (action === 'create') {
      const newItem = { id: `mock-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
      existing.push(newItem);
      localStorage.setItem(key, JSON.stringify(existing));
      return { success: true, item: newItem };
    } else {
      // update
      const idx = existing.findIndex(e => e.id === data.id);
      if (idx > -1) {
        existing[idx] = { ...existing[idx], ...data, updatedAt: new Date().toISOString() };
        localStorage.setItem(key, JSON.stringify(existing));
        return { success: true, item: existing[idx] };
      }
      return { success: false, error: 'Item not found' };
    }
  } catch (e) {
    return { success: false, error: 'Local storage error' };
  }
};
