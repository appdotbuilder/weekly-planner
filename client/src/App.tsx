
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckSquare, Calendar, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { trpc } from '@/utils/trpc';

// Import types with proper relative paths (2 levels up from App.tsx)
import type { 
  Section, 
  Task, 
  WeeklyPlan, 
  CreateTaskInput, 
  UpdateTaskInput,
  CreateSectionInput,
  CreateWeeklyPlanInput
} from '../../server/src/schema';

// Import components
import { TaskManager } from './components/TaskManager';
import { WeeklyPlanner } from './components/WeeklyPlanner';

function App() {
  const [sections, setSections] = useState<Section[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('tasks');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [sectionsData, plansData] = await Promise.all([
        trpc.getSections.query(),
        trpc.getAllWeeklyPlans.query()
      ]);
      
      setSections(sectionsData);
      setWeeklyPlans(plansData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Unable to connect to the server. Please check that the backend is running and try again.');
      
      // Set empty data as fallback
      setSections([]);
      setWeeklyPlans([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Task operations
  const handleCreateTask = useCallback(async (data: CreateTaskInput) => {
    try {
      const newTask = await trpc.createTask.mutate(data);
      setSections((prev: Section[]) =>
        prev.map((section: Section) =>
          section.name === data.section_name
            ? { ...section, tasks: [...section.tasks, newTask] }
            : section
        )
      );
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }, []);

  const handleUpdateTask = useCallback(async (data: UpdateTaskInput) => {
    try {
      const updatedTask = await trpc.updateTask.mutate(data);
      setSections((prev: Section[]) =>
        prev.map((section: Section) =>
          section.name === data.section_name
            ? {
                ...section,
                tasks: section.tasks.map((task: Task) =>
                  task.id === data.task_id ? updatedTask : task
                )
              }
            : section
        )
      );
    } catch (error) {
      console.error('Failed to update task:', error);
      throw error;
    }
  }, []);

  const handleDeleteTask = useCallback(async (sectionName: string, taskId: string) => {
    try {
      await trpc.deleteTask.mutate({ section_name: sectionName, task_id: taskId });
      setSections((prev: Section[]) =>
        prev.map((section: Section) =>
          section.name === sectionName
            ? {
                ...section,
                tasks: section.tasks.filter((task: Task) => task.id !== taskId)
              }
            : section
        )
      );
    } catch (error) {
      console.error('Failed to delete task:', error);
      throw error;
    }
  }, []);

  // Section operations
  const handleCreateSection = useCallback(async (data: CreateSectionInput) => {
    try {
      const newSection = await trpc.createSection.mutate(data);
      setSections((prev: Section[]) => [...prev, newSection]);
    } catch (error) {
      console.error('Failed to create section:', error);
      throw error;
    }
  }, []);

  const handleDeleteSection = useCallback(async (sectionName: string) => {
    try {
      await trpc.deleteSection.mutate({ name: sectionName });
      setSections((prev: Section[]) =>
        prev.filter((section: Section) => section.name !== sectionName)
      );
    } catch (error) {
      console.error('Failed to delete section:', error);
      throw error;
    }
  }, []);

  const handleRenameSection = useCallback(async (oldName: string, newName: string) => {
    try {
      await trpc.renameSection.mutate({
        old_name: oldName,
        new_name: newName
      });
      // Since the API only returns boolean, we need to update the state manually
      setSections((prev: Section[]) =>
        prev.map((section: Section) =>
          section.name === oldName 
            ? { ...section, name: newName }
            : section
        )
      );
    } catch (error) {
      console.error('Failed to rename section:', error);
      throw error;
    }
  }, []);

  // Weekly plan operations
  const handleCreateWeeklyPlan = useCallback(async (data: CreateWeeklyPlanInput) => {
    try {
      const newPlan = await trpc.createWeeklyPlan.mutate(data);
      setWeeklyPlans((prev: WeeklyPlan[]) => {
        const filteredPlans = prev.filter((p: WeeklyPlan) => 
          p.week_start.getTime() !== newPlan.week_start.getTime()
        );
        return [newPlan, ...filteredPlans];
      });
    } catch (error) {
      console.error('Failed to create weekly plan:', error);
      throw error;
    }
  }, []);

  const handleUpdateWeeklyPlan = useCallback(async (weekStart: Date, shortNote?: string | null, content?: string) => {
    try {
      const updatedPlan = await trpc.updateWeeklyPlan.mutate({
        week_start: weekStart,
        short_week_note: shortNote,
        content: content
      });
      setWeeklyPlans((prev: WeeklyPlan[]) =>
        prev.map((plan: WeeklyPlan) =>
          plan.week_start.getTime() === weekStart.getTime() ? updatedPlan : plan
        )
      );
    } catch (error) {
      console.error('Failed to update weekly plan:', error);
      throw error;
    }
  }, []);

  const handleDeleteWeeklyPlan = useCallback(async (weekStart: Date) => {
    try {
      await trpc.deleteWeeklyPlan.mutate({ week_start: weekStart });
      setWeeklyPlans((prev: WeeklyPlan[]) =>
        prev.filter((plan: WeeklyPlan) => plan.week_start.getTime() !== weekStart.getTime())
      );
    } catch (error) {
      console.error('Failed to delete weekly plan:', error);
      throw error;
    }
  }, []);

  // Calculate summary statistics
  const totalTasks = sections.reduce((sum: number, section: Section) => sum + section.tasks.length, 0);
  const completedTasks = sections.reduce((sum: number, section: Section) => 
    sum + section.tasks.filter((task: Task) => task.completed).length, 0
  );
  const upcomingTasks = sections.reduce((sum: number, section: Section) => 
    sum + section.tasks.filter((task: Task) => 
      !task.completed && 
      task.due_date && 
      new Date(task.due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    ).length, 0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <div className="bg-indigo-600 rounded-lg p-2">
              <CheckSquare className="h-8 w-8 text-white" />
            </div>
            Task Master Pro
          </h1>
          <p className="text-gray-600 text-lg">
            Organize your tasks and plan your weeks like a professional ✨
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadData}
                  className="ml-4 border-red-200 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              <p className="text-xs text-gray-500 mt-1">
                {completedTasks} completed
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due This Week
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-gray-900">{upcomingTasks}</p>
              <p className="text-xs text-gray-500 mt-1">
                {upcomingTasks === 0 ? "All caught up! 🎉" : "Stay focused"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Weekly Plans
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-gray-900">{weeklyPlans.length}</p>
              <p className="text-xs text-gray-500 mt-1">
                {weeklyPlans.length === 0 ? "Create your first plan" : "Planning ahead"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card className="bg-white shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-50">
              <TabsTrigger 
                value="tasks" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
              >
                <CheckSquare className="h-4 w-4" />
                Task Management
              </TabsTrigger>
              <TabsTrigger 
                value="planning" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
              >
                <Calendar className="h-4 w-4" />
                Weekly Planning
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-0">
              <TaskManager
                sections={sections}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onCreateSection={handleCreateSection}
                onDeleteSection={handleDeleteSection}
                onRenameSection={handleRenameSection}
              />
            </TabsContent>

            <TabsContent value="planning" className="mt-0">
              <WeeklyPlanner
                weeklyPlans={weeklyPlans}
                onCreatePlan={handleCreateWeeklyPlan}
                onUpdatePlan={handleUpdateWeeklyPlan}
                onDeletePlan={handleDeleteWeeklyPlan}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

export default App;
