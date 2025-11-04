import React, { useState, useEffect, useCallback, useRef } from 'react';

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  selected: boolean;
}

type ActionType = 
  | { type: 'ADD_TODO'; payload: TodoItem }
  | { type: 'UPDATE_TODO'; payload: { id: string; text?: string; completed?: boolean; selected?: boolean } }
  | { type: 'DELETE_TODO'; payload: string }
  | { type: 'DELETE_SELECTED'; payload: string[] }
  | { type: 'MOVE_TODO'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'TOGGLE_SELECT_ALL'; payload: boolean }
  | { type: 'CLEAR_COMPLETED'; payload: string[] }
  | { type: 'LOAD_TODOS'; payload: TodoItem[] };

interface TodoState {
  items: TodoItem[];
  history: { items: TodoItem[] }[];
  historyIndex: number;
  editingId: string | null;
}

const TodoList: React.FC = () => {
  const [state, setState] = useState<TodoState>({
    items: [],
    history: [],
    historyIndex: -1,
    editingId: null
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const editingRef = useRef<HTMLInputElement>(null);

  // Load todos from localStorage on initial render
  useEffect(() => {
    try {
      const savedTodos = localStorage.getItem('todoList');
      if (savedTodos) {
        const parsedTodos = JSON.parse(savedTodos);
        setState(prev => ({
          ...prev,
          items: parsedTodos,
          history: [],
          historyIndex: -1
        }));
      }
    } catch (error) {
      console.error('Failed to load todos from localStorage:', error);
    }
  }, []);

  // Save todos to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('todoList', JSON.stringify(state.items));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('LocalStorage 空间不足，无法保存更多待办事项。请清理一些空间或使用其他浏览器。');
      } else {
        console.error('Failed to save todos to localStorage:', error);
      }
    }
  }, [state.items]);

  // Handle action and update history
  const handleAction = useCallback((action: ActionType) => {
    setState(prevState => {
      // Create new state based on action
      let newItems: TodoItem[] = [...prevState.items];
      
      switch (action.type) {
        case 'ADD_TODO':
          newItems = [...newItems, action.payload];
          break;
        case 'UPDATE_TODO':
          newItems = newItems.map(item => 
            item.id === action.payload.id 
              ? { ...item, ...action.payload }
              : item
          );
          break;
        case 'DELETE_TODO':
          newItems = newItems.filter(item => item.id !== action.payload);
          break;
        case 'DELETE_SELECTED':
          newItems = newItems.filter(item => !action.payload.includes(item.id));
          break;
        case 'MOVE_TODO':
          const [movedItem] = newItems.splice(action.payload.fromIndex, 1);
          newItems.splice(action.payload.toIndex, 0, movedItem);
          break;
        case 'TOGGLE_SELECT_ALL':
          newItems = newItems.map(item => ({ ...item, selected: action.payload }));
          break;
        case 'CLEAR_COMPLETED':
          newItems = newItems.filter(item => !action.payload.includes(item.id));
          break;
        case 'LOAD_TODOS':
          newItems = action.payload;
          break;
      }

      // Update history
      const newHistory = prevState.history.slice(0, prevState.historyIndex + 1);
      newHistory.push({ items: [...prevState.items] });
      
      // Keep history at maximum 10 entries
      if (newHistory.length > 10) {
        newHistory.shift();
      }

      return {
        ...prevState,
        items: newItems,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  // Undo/Redo functionality
  const handleUndoRedo = useCallback((isRedo: boolean) => {
    setState(prevState => {
      let newIndex = isRedo ? prevState.historyIndex + 1 : prevState.historyIndex - 1;
      
      if (newIndex < 0 || newIndex >= prevState.history.length) {
        return prevState; // Cannot undo/redo further
      }

      const historicalState = prevState.history[newIndex];
      
      return {
        ...prevState,
        items: [...historicalState.items],
        historyIndex: newIndex
      };
    });
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndoRedo(false);
      }
      
      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        handleUndoRedo(true);
      }
      
      // Delete key for deleting selected items
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedIds = state.items.filter(item => item.selected).map(item => item.id);
        if (selectedIds.length > 0) {
          handleAction({ type: 'DELETE_SELECTED', payload: selectedIds });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.items, handleAction, handleUndoRedo]);

  // Add new todo
  const handleAddTodo = useCallback((text: string) => {
    if (text.trim()) {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        text: text.trim(),
        completed: false,
        selected: false
      };
      handleAction({ type: 'ADD_TODO', payload: newTodo });
    }
  }, [handleAction]);



  // Toggle todo completion
  const handleToggleComplete = useCallback((id: string) => {
    handleAction({ type: 'UPDATE_TODO', payload: { id, completed: !state.items.find(item => item.id === id)?.completed } });
  }, [state.items, handleAction]);



  // Toggle todo selection
  const handleToggleSelect = useCallback((id: string) => {
    handleAction({ type: 'UPDATE_TODO', payload: { id, selected: !state.items.find(item => item.id === id)?.selected } });
  }, [state.items, handleAction]);

  // Toggle select all todos
  const handleToggleSelectAll = useCallback(() => {
    const shouldSelectAll = selectedCount !== totalCount;
    handleAction({ type: 'TOGGLE_SELECT_ALL', payload: shouldSelectAll });
  }, [selectedCount, totalCount, handleAction]);

  // Delete todo
  const handleDeleteTodo = useCallback((id: string) => {
    handleAction({ type: 'DELETE_TODO', payload: id });
  }, [handleAction]);

  // Delete selected todos
  const handleDeleteSelected = useCallback(() => {
    const selectedIds = state.items.filter(item => item.selected).map(item => item.id);
    if (selectedIds.length > 0) {
      handleAction({ type: 'DELETE_SELECTED', payload: selectedIds });
    }
  }, [state.items, handleAction]);

  // Clear completed todos
  const handleClearCompleted = useCallback(() => {
    const completedIds = state.items.filter(item => item.completed).map(item => item.id);
    if (completedIds.length > 0) {
      handleAction({ type: 'CLEAR_COMPLETED', payload: completedIds });
    }
  }, [state.items, handleAction]);

  // Start editing todo
  const handleStartEditing = useCallback((id: string) => {
    setState(prev => ({ ...prev, editingId: id }));
  }, []);

  // Save edited todo
  const handleSaveEditing = useCallback((id: string, text: string) => {
    if (text.trim()) {
      handleAction({ type: 'UPDATE_TODO', payload: { id, text: text.trim() } });
    } else {
      handleDeleteTodo(id); // Delete if text is empty
    }
    setState(prev => ({ ...prev, editingId: null }));
  }, [handleAction, handleDeleteTodo]);

  // Cancel editing todo
  const handleCancelEditing = useCallback(() => {
    setState(prev => ({ ...prev, editingId: null }));
  }, []);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    if (e.target instanceof HTMLDivElement) {
      e.target.classList.add('opacity-50');
    }
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLDivElement) {
      e.target.classList.remove('opacity-50');
    }
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.target instanceof HTMLDivElement) {
      e.target.classList.add('bg-gray-100');
    }
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLDivElement) {
      e.target.classList.remove('bg-gray-100');
    }
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, toIndex: number) => {
    e.preventDefault();
    if (e.target instanceof HTMLDivElement) {
      e.target.classList.remove('bg-gray-100');
    }
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== toIndex && !isNaN(fromIndex)) {
      handleAction({ type: 'MOVE_TODO', payload: { fromIndex, toIndex } });
    }
  }, [handleAction]);

  // Handle import JSON
  const handleImportJson = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedData)) {
          // Validate imported data
          const isValid = importedData.every((item: any) => 
            item.id && typeof item.text === 'string' && typeof item.completed === 'boolean'
          );

          if (isValid) {
            // Add selected property to imported items
            const todosWithSelection = importedData.map(item => ({
              ...item,
              selected: false
            }));
            handleAction({ type: 'LOAD_TODOS', payload: todosWithSelection });
            setImportError('');
            setIsImporting(false);
          } else {
            setImportError('导入的JSON格式不正确，请确保包含id、text和completed字段');
          }
        } else {
          setImportError('导入的JSON不是有效的数组');
        }
      } catch (error) {
        setImportError('导入JSON失败：' + error);
      }
    };
    reader.readAsText(file);
  }, [handleAction]);

  // Handle export JSON
  const handleExportJson = useCallback(() => {
    try {
      const jsonData = JSON.stringify(state.items, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'todo-list.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出JSON失败：', error);
      alert('导出JSON失败，请稍后重试');
    }
  }, [state.items]);

  // Filter and search todos
  const filteredTodos = state.items.filter(item => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && !item.completed) || 
      (filter === 'completed' && item.completed);
    const matchesSearch = searchTerm === '' || 
      item.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Count statistics
  const totalCount = state.items.length;
  const activeCount = state.items.filter(item => !item.completed).length;
  const completedCount = totalCount - activeCount;
  const selectedCount = state.items.filter(item => item.selected).length;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">待办事项列表</h2>

      {/* Todo input form */}
      <div className="flex mb-4">
        <input
          type="text"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="添加新的待办事项..."
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo(e.currentTarget.value)}
          onBlur={(e) => e.currentTarget.value && handleAddTodo(e.currentTarget.value)}
        />
        <button
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded-r-lg transition-colors duration-300"
          onClick={(e) => {
            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
            handleAddTodo(input.value);
            input.value = '';
          }}
        >
          添加
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text"
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="搜索待办事项..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex gap-1">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'active' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setFilter('active')}
          >
            未完成
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium ${filter === 'completed' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setFilter('completed')}
          >
            已完成
          </button>
        </div>
      </div>

      {/* Todo list */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 mb-4">
        {filteredTodos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? '未找到匹配的待办事项' : '暂无待办事项'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTodos.map((todo, index) => (
              <div
                key={todo.id}
                className={`p-3 rounded-lg border border-gray-200 transition-colors duration-300 ${todo.selected ? 'bg-indigo-50 border-indigo-300' : ''} ${todo.completed ? 'bg-gray-50 line-through text-gray-500' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
              >
                {state.editingId === todo.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      ref={editingRef}
                      type="text"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={todo.text}
                      onChange={(e) => handleAction({ type: 'UPDATE_TODO', payload: { id: todo.id, text: e.target.value } })}
                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEditing(todo.id, e.currentTarget.value)}
                      onBlur={(e) => handleSaveEditing(todo.id, e.currentTarget.value)}
                      autoFocus
                    />
                    <button
                      className="text-green-500 hover:text-green-600"
                      onClick={() => handleSaveEditing(todo.id, todo.text)}
                    >
                      保存
                    </button>
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={handleCancelEditing}
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                      checked={todo.selected}
                      onChange={() => handleToggleSelect(todo.id)}
                    />
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      checked={todo.completed}
                      onChange={() => handleToggleComplete(todo.id)}
                    />
                    <span
                      className="flex-1 cursor-pointer"
                      onClick={() => handleStartEditing(todo.id)}
                    >
                      {todo.text}
                    </span>
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDeleteTodo(todo.id)}
                    >
                      删除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Todo stats and actions */}
      <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          总计: {totalCount}, 未完成: {activeCount}, 已完成: {completedCount}
          {selectedCount > 0 && `, 已选择: ${selectedCount}`}
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedCount > 0 && (
            <button
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors duration-300"
              onClick={handleDeleteSelected}
            >
              删除选中项
            </button>
          )}

          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium transition-colors duration-300"
            onClick={handleToggleSelectAll}
          >
            {selectedCount === totalCount ? '取消全选' : '全选'}
          </button>

          <button
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium transition-colors duration-300"
            onClick={handleClearCompleted}
          >
            清除已完成
          </button>

          <div className="relative">
            <button
              className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded text-sm font-medium transition-colors duration-300"
              onClick={() => setIsImporting(!isImporting)}
            >
              导入/导出
            </button>

            {isImporting && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded-lg shadow-lg z-10 overflow-hidden">
                <div className="p-2">
                  <button
                    className="w-full text-left px-2 py-1 rounded hover:bg-gray-100"
                    onClick={handleExportJson}
                  >
                    导出为JSON
                  </button>
                  <div className="mt-1">
                    <label className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 cursor-pointer block">
                      导入JSON
                      <input
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={handleImportJson}
                      />
                    </label>
                  </div>
                  {importError && (
                    <div className="mt-2 text-xs text-red-500 px-2 py-1">
                      {importError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mt-4 text-xs text-gray-500">
        <p>快捷键: Ctrl/Cmd+Z (撤销) | Ctrl/Cmd+Shift+Z (重做) | Delete (删除选中项)</p>
      </div>
    </div>
  );
};

export default TodoList;