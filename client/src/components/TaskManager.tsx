
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  MessageSquare, 
  CheckSquare2, 
  Square,
  FolderPlus,
  Folder,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Import types with correct relative path (3 levels up from components/)
import type { 
  Section, 
  Task, 
  CreateTaskInput, 
  UpdateTaskInput,
  CreateSectionInput,
  TaskPriority 
} from '../../../server/src/schema';

interface TaskManagerProps {
  sections: Section[];
  onCreateTask: (data: CreateTaskInput) => Promise<void>;
  onUpdateTask: (data: UpdateTaskInput) => Promise<void>;
  onDeleteTask: (sectionName: string, taskId: string) => Promise<void>;
  onCreateSection: (data: CreateSectionInput) => Promise<void>;
  onDeleteSection: (sectionName: string) => Promise<void>;
  onRenameSection: (oldName: string, newName: string) => Promise<void>;
}

export function TaskManager({
  sections,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCreateSection,
  onDeleteSection,
  onRenameSection
}: TaskManagerProps) {
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateSectionOpen, setIsCreateSectionOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskLoading, setIsTaskLoading] = useState(false);
  const [isSectionLoading, setIsSectionLoading] = useState(false);
  const [renameingSectionName, setRenameingSectionName] = useState<string>('');

  // Task form state
  const [taskForm, setTaskForm] = useState<CreateTaskInput>({
    section_name: '',
    description: '',
    priority: 'Medium' as TaskPriority,
    due_date: null,
    comments: null
  });

  // Section form state
  const [sectionForm, setSectionForm] = useState<CreateSectionInput>({
    name: ''
  });

  const [newSectionName, setNewSectionName] = useState('');

  const resetTaskForm = () => {
    setTaskForm({
      section_name: selectedSection || '',
      description: '',
      priority: 'Medium' as TaskPriority,
      due_date: null,
      comments: null
    });
  };

  const resetSectionForm = () => {
    setSectionForm({ name: '' });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.section_name) return;

    try {
      setIsTaskLoading(true);
      await onCreateTask({
        ...taskForm,
        due_date: taskForm.due_date || null,
        comments: taskForm.comments || null
      });
      resetTaskForm();
      setIsCreateTaskOpen(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      setIsTaskLoading(true);
      await onUpdateTask({
        section_name: taskForm.section_name,
        task_id: editingTask.id,
        description: taskForm.description,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        comments: taskForm.comments || null
      });
      setEditingTask(null);
      resetTaskForm();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsTaskLoading(false);
    }
  };

  const handleToggleTask = async (task: Task, sectionName: string) => {
    try {
      await onUpdateTask({
        section_name: sectionName,
        task_id: task.id,
        completed: !task.completed
      });
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSectionLoading(true);
      await onCreateSection(sectionForm);
      resetSectionForm();
      setIsCreateSectionOpen(false);
    } catch (error) {
      console.error('Failed to create section:', error);
    } finally {
      setIsSectionLoading(false);
    }
  };

  const handleRenameSection = async (oldName: string) => {
    if (!newSectionName.trim() || newSectionName === oldName) {
      setRenameingSectionName('');
      setNewSectionName('');
      return;
    }

    try {
      await onRenameSection(oldName, newSectionName.trim());
      setRenameingSectionName('');
      setNewSectionName('');
      if (selectedSection === oldName) {
        setSelectedSection(newSectionName.trim());
      }
    } catch (error) {
      console.error('Failed to rename section:', error);
    }
  };

  const startEditingTask = (task: Task, sectionName: string) => {
    setEditingTask(task);
    setTaskForm({
      section_name: sectionName,
      description: task.description,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date) : null,
      comments: task.comments
    });
  };

  const getPriorityColor = (priority: TaskPriority): string => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isOverdue = (date: Date | string): boolean => {
    return new Date(date) < new Date() && new Date(date).toDateString() !== new Date().toDateString();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="text-gray-600 mt-1">Organize your work into projects and track progress 📋</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateSectionOpen} onOpenChange={setIsCreateSectionOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={resetSectionForm}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Section</DialogTitle>
                <DialogDescription>
                  Create a new project section to organize your tasks.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSection} className="space-y-4">
                <Input
                  placeholder="Section name"
                  value={sectionForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSectionForm((prev: CreateSectionInput) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateSectionOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSectionLoading}>
                    {isSectionLoading ? 'Creating...' : 'Create Section'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateTaskOpen} onOpenChange={(open) => {
            setIsCreateTaskOpen(open);
            if (open) {
              resetTaskForm();
              setEditingTask(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={sections.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to your selected section.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <Select
                  value={taskForm.section_name || ''}
                  onValueChange={(value: string) =>
                    setTaskForm((prev: CreateTaskInput) => ({ ...prev, section_name: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((section: Section) => (
                      <SelectItem key={section.name} value={section.name}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Task description"
                  value={taskForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setTaskForm((prev: CreateTaskInput) => ({ ...prev, description: e.target.value }))
                  }
                  required
                />

                <Select
                  value={taskForm.priority || 'Medium'}
                  onValueChange={(value: TaskPriority) =>
                    setTaskForm((prev: CreateTaskInput) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="High">High Priority</SelectItem>
                    <SelectItem value="Medium">Medium Priority</SelectItem>
                    <SelectItem value="Low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  value={taskForm.due_date ? taskForm.due_date.toISOString().split('T')[0] : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTaskForm((prev: CreateTaskInput) => ({
                      ...prev,
                      due_date: e.target.value ? new Date(e.target.value) : null
                    }))
                  }
                />

                <Textarea
                  placeholder="Comments (optional)"
                  value={taskForm.comments || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setTaskForm((prev: CreateTaskInput) => ({
                      ...prev,
                      comments: e.target.value || null
                    }))
                  }
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateTaskOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isTaskLoading}>
                    {isTaskLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {sections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
            <p className="text-gray-600 mb-4">Create your first project section to start organizing tasks.</p>
            <Button onClick={() => setIsCreateSectionOpen(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create First Section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sections.map((section: Section) => (
            <Card key={section.name} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    {renameingSectionName === section.name ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newSectionName}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenameSection(section.name);
                            } else if (e.key === 'Escape') {
                              setRenameingSectionName('');
                              setNewSectionName('');
                            }
                          }}
                          onBlur={() => handleRenameSection(section.name)}
                          autoFocus
                          className="text-lg font-semibold"
                        />
                      </div>
                    ) : (
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Folder className="h-5 w-5 text-indigo-600" />
                          {section.name}
                        </CardTitle>
                        <CardDescription>
                          {section.tasks.length} tasks • {section.tasks.filter((task: Task) => task.completed).length} completed
                        </CardDescription>
                      </div>
                    )}
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setRenameingSectionName(section.name);
                          setNewSectionName(section.name);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Section</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{section.name}"? This will also delete all {section.tasks.length} tasks in this section. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteSection(section.name)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Section
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {section.tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckSquare2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tasks in this section yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {section.tasks.map((task: Task) => (
                      <div key={task.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          
                          <button
                            onClick={() => handleToggleTask(task, section.name)}
                            className="mt-0.5 transition-colors"
                          >
                            {task.completed ? (
                              <CheckSquare2 className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                          </button>

                          <div className="flex-1">
                            <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {task.description}
                            </p>
                            
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>

                              {task.due_date && (
                                <Badge 
                                  variant={isOverdue(task.due_date) ? "destructive" : "secondary"}
                                  className="flex items-center gap-1"
                                >
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(task.due_date)}
                                </Badge>
                              )}

                              {task.comments && (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Notes
                                </Badge>
                              )}
                            </div>

                            {task.comments && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border-l-2 border-l-gray-200">
                                {task.comments}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditingTask(task, section.name)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this task? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onDeleteTask(section.name, task.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Task
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={editingTask !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingTask(null);
          resetTaskForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateTask} className="space-y-4">
            <Textarea
              placeholder="Task description"
              value={taskForm.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTaskForm((prev: CreateTaskInput) => ({ ...prev, description: e.target.value }))
              }
              required
            />

            <Select
              value={taskForm.priority || 'Medium'}
              onValueChange={(value: TaskPriority) =>
                setTaskForm((prev: CreateTaskInput) => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">High Priority</SelectItem>
                <SelectItem value="Medium">Medium Priority</SelectItem>
                <SelectItem value="Low">Low Priority</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={taskForm.due_date ? taskForm.due_date.toISOString().split('T')[0] : ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTaskForm((prev: CreateTaskInput) => ({
                  ...prev,
                  due_date: e.target.value ? new Date(e.target.value) : null
                }))
              }
            />

            <Textarea
              placeholder="Comments (optional)"
              value={taskForm.comments || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setTaskForm((prev: CreateTaskInput) => ({
                  ...prev,
                  comments: e.target.value || null
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setEditingTask(null);
                resetTaskForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isTaskLoading}>
                {isTaskLoading ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
