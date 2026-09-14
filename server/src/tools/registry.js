export const AGENT_TOOLS_OPENAI_FORMAT = [
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task in the user's dashboard. Call this whenever the user asks you to add, create, remind them of, or schedule a task. Do not call for questions ABOUT tasks — only for creating new ones.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the task" },
          priority: { type: "string", enum: ["low", "medium", "high"], description: "Task priority" },
          dueDate: { type: "string", description: "ISO date string for when the task is due" },
          workspace: { type: "string", description: "Optional workspace category (e.g., work, personal)" }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description: "Update an existing task by its ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the task to update" },
          patch: { type: "string", description: "JSON string of properties to update" }
        },
        required: ["id", "patch"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as completed.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the task to complete" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description: "Fetch a list of tasks, optionally filtered.",
      parameters: {
        type: "object",
        properties: {
          filter: { type: "string", description: "Filter criteria (e.g., 'today', 'high_priority', 'completed')" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_goal",
      description: "Create a new long-term goal.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the goal" },
          targetDate: { type: "string", description: "ISO date string for the goal deadline" },
          milestones: { 
            type: "array", 
            items: { type: "string" },
            description: "Array of milestone titles"
          }
        },
        required: ["title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_goal_progress",
      description: "Update the progress percentage of an active goal.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the goal" },
          percent: { type: "number", description: "New progress percentage (0-100)" }
        },
        required: ["id", "percent"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_note",
      description: "Create a new markdown note to save detailed information or study materials.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The title of the note" },
          contentMarkdown: { type: "string", description: "The full markdown content of the note" },
          tags: { 
            type: "array", 
            items: { type: "string" },
            description: "List of tags"
          }
        },
        required: ["title", "contentMarkdown"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "open_note",
      description: "Open an existing note by ID in the UI.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the note" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_notes",
      description: "Search through existing notes.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keyword or phrase" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "schedule_event",
      description: "Schedule a new calendar event.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Event title" },
          startISO: { type: "string", description: "Start time in ISO format" },
          endISO: { type: "string", description: "End time in ISO format" },
          notes: { type: "string", description: "Optional event description or notes" }
        },
        required: ["title", "startISO", "endISO"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "start_focus_session",
      description: "Start a new study or work focus session (Pomodoro timer).",
      parameters: {
        type: "object",
        properties: {
          minutes: { type: "number", description: "Duration in minutes" },
          topic: { type: "string", description: "The topic or subject to focus on" }
        },
        required: ["minutes", "topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "navigate_ui",
      description: "Navigate the user interface to a specific page or section.",
      parameters: {
        type: "object",
        properties: {
          target: { 
            type: "string", 
            enum: ["dashboard", "tasks", "goals", "notes", "study", "calendar", "analytics", "assistant"],
            description: "The target view" 
          }
        },
        required: ["target"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_study_notes",
      description: "Generate structured markdown study notes on a given topic. This returns the markdown string; you should then call create_note to save it.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The topic to generate notes for" },
          depth: { type: "string", enum: ["quick", "deep", "exam-ready"], description: "Depth of notes" }
        },
        required: ["topic", "depth"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "explain_topic",
      description: "Provide a spoken explanation of a topic. Use this when the user asks you to explain something verbally.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string", description: "The topic to explain" },
          level: { type: "string", enum: ["beginner", "intermediate", "advanced"], description: "Complexity level" }
        },
        required: ["topic"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_dashboard_summary",
      description: "Fetch the latest summary of tasks, goals, and events from the user's dashboard.",
      parameters: {
        type: "object",
        properties: {
          forceRefresh: { type: "boolean", description: "Whether to force a refresh of the dashboard data" }
        }
      }
    }
  }
];
