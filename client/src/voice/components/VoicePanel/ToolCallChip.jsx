import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export const ToolCallChip = ({ toolName }) => {
  const [canUndo, setCanUndo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setCanUndo(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const formatToolName = (name) => {
    switch (name) {
      case 'create_task': return 'Created task';
      case 'create_goal': return 'Created goal';
      case 'navigate_ui': return 'Navigated';
      case 'start_focus_session': return 'Started focus';
      case 'schedule_event': return 'Scheduled event';
      default: return 'Executed action';
    }
  };

  return (
    <div className="tool-chip">
      <CheckCircle2 size={14} color="var(--primary)" />
      <span>{formatToolName(toolName)}</span>
      {canUndo && (
        <button className="undo-btn" onClick={() => alert('Undo not yet implemented')}>
          Undo
        </button>
      )}
    </div>
  );
};
