import { DataStore } from './dataStore';

export const executeClientTool = async (callId, name, args, navigate) => {
  try {
    let result = null;
    let actionId = null;

    switch (name) {
      case 'navigate_ui':
        if (args.target) {
          navigate(`/${args.target === 'dashboard' ? '' : args.target}`);
          result = { success: true, message: `Navigated to ${args.target}` };
        } else {
          result = { success: false, error: 'Target missing' };
        }
        break;

      case 'open_note':
        const notesRaw = localStorage.getItem('ailifeos_mock_notes') || '[]';
        const notes = JSON.parse(notesRaw);
        const note = notes.find(n => n.id === args.id);
        
        window.dispatchEvent(new CustomEvent('voice-open-note', {
          detail: {
            title: note ? note.title : 'Study Note',
            content: note ? note.contentMarkdown : 'Content not found'
          }
        }));
        
        result = { success: true, message: `Opened note ${args.id} in overlay` };
        break;

      case 'start_focus_session':
        navigate('/study');
        result = { success: true, message: `Started ${args.minutes}m focus session on ${args.topic}` };
        break;

      case 'create_task':
        const createRes = DataStore.mutate('tasks', args, 'create');
        result = createRes;
        actionId = createRes.actionId;
        break;
      
      case 'update_task':
      case 'complete_task':
        const updateRes = DataStore.mutate('tasks', args, 'update');
        result = updateRes;
        actionId = updateRes.actionId;
        break;

      case 'create_goal':
        const goalCreateRes = DataStore.mutate('goals', args, 'create');
        result = goalCreateRes;
        actionId = goalCreateRes.actionId;
        break;

      case 'update_goal_progress':
        const goalUpdateRes = DataStore.mutate('goals', args, 'update');
        result = goalUpdateRes;
        actionId = goalUpdateRes.actionId;
        break;

      case 'create_note':
        const noteCreateRes = DataStore.mutate('notes', args, 'create');
        result = noteCreateRes;
        actionId = noteCreateRes.actionId;
        break;

      case 'schedule_event':
        const eventCreateRes = DataStore.mutate('events', args, 'create');
        result = eventCreateRes;
        actionId = eventCreateRes.actionId;
        break;
        
      default:
        result = { success: false, error: `Unknown client tool: ${name}` };
    }

    return { call_id: callId, result, actionId };
  } catch (error) {
    console.error(`[ToolExecutor] Error executing ${name}:`, error);
    return { call_id: callId, result: { success: false, error: error.message } };
  }
};
