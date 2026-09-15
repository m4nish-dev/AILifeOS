/**
 * DataStore abstraction
 * For Phase 5, this wraps localStorage updates but isolates the storage engine
 * from the clientToolExecutor, allowing a future swap to MongoDB/REST APIs.
 */

// Simple action history for undo
const history = new Map();

export const DataStore = {
  mutate: (entity, data, action = 'create') => {
    try {
      const key = `ailifeos_mock_${entity}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      const actionId = `action_${Date.now()}`;
      
      if (action === 'create') {
        const newItem = { id: `mock-${Date.now()}`, ...data, createdAt: new Date().toISOString() };
        existing.push(newItem);
        localStorage.setItem(key, JSON.stringify(existing));
        
        history.set(actionId, { type: 'create', entity, itemId: newItem.id });
        return { success: true, item: newItem, actionId };
      } else {
        // update
        const idx = existing.findIndex(e => e.id === data.id);
        if (idx > -1) {
          const oldItem = { ...existing[idx] };
          existing[idx] = { ...existing[idx], ...data, updatedAt: new Date().toISOString() };
          localStorage.setItem(key, JSON.stringify(existing));
          
          history.set(actionId, { type: 'update', entity, oldItem });
          return { success: true, item: existing[idx], actionId };
        }
        return { success: false, error: 'Item not found' };
      }
    } catch (e) {
      return { success: false, error: 'Local storage error' };
    }
  },

  revert: (actionId) => {
    const action = history.get(actionId);
    if (!action) return false;

    const key = `ailifeos_mock_${action.entity}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');

    if (action.type === 'create') {
      const newItems = existing.filter(e => e.id !== action.itemId);
      localStorage.setItem(key, JSON.stringify(newItems));
    } else if (action.type === 'update') {
      const idx = existing.findIndex(e => e.id === action.oldItem.id);
      if (idx > -1) {
        existing[idx] = action.oldItem;
        localStorage.setItem(key, JSON.stringify(existing));
      }
    }

    history.delete(actionId);
    window.dispatchEvent(new Event('mockDataUpdated'));
    return true;
  }
};
