
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  FileText, 
  Eye,
  CalendarDays
} from 'lucide-react';

// Import types with correct relative path (3 levels up from components/)
import type { 
  WeeklyPlan, 
  CreateWeeklyPlanInput 
} from '../../../server/src/schema';

interface WeeklyPlannerProps {
  weeklyPlans: WeeklyPlan[];
  onCreatePlan: (data: CreateWeeklyPlanInput) => Promise<void>;
  onUpdatePlan: (weekStart: Date, shortNote?: string | null, content?: string) => Promise<void>;
  onDeletePlan: (weekStart: Date) => Promise<void>;
}

export function WeeklyPlanner({
  weeklyPlans,
  onCreatePlan,
  onUpdatePlan,
  onDeletePlan
}: WeeklyPlannerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<WeeklyPlan | null>(null);
  const [viewingPlan, setViewingPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [planForm, setPlanForm] = useState<CreateWeeklyPlanInput>({
    week_start: new Date(),
    short_week_note: null,
    content: ''
  });

  const resetForm = () => {
    const monday = getMonday(new Date());
    setPlanForm({
      week_start: monday,
      short_week_note: null,
      content: ''
    });
  };

  // Get the Monday of the current week
  const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  // Format week range
  const formatWeekRange = (weekStart: Date): string => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Check if week is current week
  const isCurrentWeek = (weekStart: Date): boolean => {
    const currentMonday = getMonday(new Date());
    return weekStart.getTime() === currentMonday.getTime();
  };

  // Generate default content template
  const generateTemplate = (weekStart: Date): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDate = new Date(weekStart);
    
    let template = '';
    days.forEach((day, index) => {
      const dayDate = new Date(currentDate);
      dayDate.setDate(currentDate.getDate() + index);
      template += `# ${day} - ${dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}\n\n- \n\n`;
    });
    
    template += `# Weekly Goals\n\n- \n\n`;
    template += `# Notes & Reflections\n\n`;
    
    return template;
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await onCreatePlan({
        ...planForm,
        short_week_note: planForm.short_week_note || null,
        content: planForm.content || generateTemplate(planForm.week_start)
      });
      resetForm();
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create weekly plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    try {
      setIsLoading(true);
      await onUpdatePlan(
        editingPlan.week_start,
        planForm.short_week_note || null,
        planForm.content
      );
      setEditingPlan(null);
      resetForm();
    } catch (error) {
      console.error('Failed to update weekly plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditingPlan = (plan: WeeklyPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      week_start: plan.week_start,
      short_week_note: plan.short_week_note,
      content: plan.content
    });
  };

  const handleQuickCreateCurrent = async () => {
    const monday = getMonday(new Date());
    const existingPlan = weeklyPlans.find((plan: WeeklyPlan) => 
      plan.week_start.getTime() === monday.getTime()
    );

    if (existingPlan) {
      setViewingPlan(existingPlan);
      return;
    }

    try {
      setIsLoading(true);
      await onCreatePlan({
        week_start: monday,
        short_week_note: null,
        content: generateTemplate(monday)
      });
    } catch (error) {
      console.error('Failed to create current week plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Planning</h2>
          <p className="text-gray-600 mt-1">Plan your weeks and track your progress over time 📅</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleQuickCreateCurrent} disabled={isLoading}>
            <CalendarDays className="h-4 w-4 mr-2" />
            {weeklyPlans.some((plan: WeeklyPlan) => isCurrentWeek(plan.week_start)) ? 'View' : 'Plan'} This Week
          </Button>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (open) {
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Create Weekly Plan</DialogTitle>
                <DialogDescription>
                  Create a new weekly plan for the selected week.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlan} className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Week Starting (Monday)
                    </label>
                    <Input
                      type="date"
                      value={planForm.week_start.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const selectedDate = new Date(e.target.value);
                        const monday = getMonday(selectedDate);
                        setPlanForm((prev: CreateWeeklyPlanInput) => ({ 
                          ...prev, 
                          week_start: monday,
                          content: prev.content || generateTemplate(monday)
                        }));
                      }}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Week: {formatWeekRange(planForm.week_start)}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Quick Note (Optional)
                    </label>
                    <Input
                      placeholder="Brief note about this week..."
                      value={planForm.short_week_note || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPlanForm((prev: CreateWeeklyPlanInput) => ({
                          ...prev,
                          short_week_note: e.target.value || null
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Plan Content (Markdown)
                  </label>
                  <Textarea
                    placeholder="Write your weekly plan in markdown format..."
                    value={planForm.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setPlanForm((prev: CreateWeeklyPlanInput) => ({ ...prev, content: e.target.value }))
                    }
                    className="flex-1 min-h-[300px] font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setPlanForm((prev: CreateWeeklyPlanInput) => ({
                      ...prev,
                      content: generateTemplate(prev.week_start)
                    }))}
                  >
                    Use Template
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {weeklyPlans.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No weekly plans yet</h3>
            <p className="text-gray-600 mb-4">Start planning your weeks to stay organized and focused.</p>
            <Button onClick={handleQuickCreateCurrent}>
              <Plus className="h-4 w-4 mr-2" />
              Plan This Week
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {weeklyPlans.map((plan: WeeklyPlan) => (
            <Card key={plan.week_start.getTime()} className={`transition-all ${isCurrentWeek(plan.week_start) ? 'ring-2 ring-indigo-500 bg-indigo-50' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      {formatWeekRange(plan.week_start)}
                      {isCurrentWeek(plan.week_start) && (
                        <Badge className="bg-indigo-100 text-indigo-800">Current Week</Badge>
                      )}
                    </CardTitle>
                    {plan.short_week_note && (
                      <CardDescription className="mt-1 font-medium">
                        {plan.short_week_note}
                      </CardDescription>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingPlan(plan)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingPlan(plan)}
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
                          <AlertDialogTitle>Delete Weekly Plan</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the plan for {formatWeekRange(plan.week_start)}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeletePlan(plan.week_start)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete Plan
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border-l-4 border-l-indigo-500">
                  <div className="font-mono whitespace-pre-line line-clamp-3">
                    {plan.content.substring(0, 200)}
                    {plan.content.length > 200 && '...'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Plan Dialog */}
      <Dialog open={viewingPlan !== null} onOpenChange={(open) => {
        if (!open) setViewingPlan(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {viewingPlan && formatWeekRange(viewingPlan.week_start)}
            </DialogTitle>
            {viewingPlan?.short_week_note && (
              <DialogDescription className="font-medium">
                {viewingPlan.short_week_note}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <div className="prose prose-sm max-w-none bg-white p-4 rounded border">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                {viewingPlan?.content}
              </pre>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                if (viewingPlan) {
                  startEditingPlan(viewingPlan);
                  setViewingPlan(null);
                }
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Plan
            </Button>
            <Button onClick={() => setViewingPlan(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={editingPlan !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingPlan(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Weekly Plan</DialogTitle>
            <DialogDescription>
              {editingPlan && `Update the plan for ${formatWeekRange(editingPlan.week_start)}`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePlan} className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Quick Note (Optional)
              </label>
              <Input
                placeholder="Brief note about this week..."
                value={planForm.short_week_note || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPlanForm((prev: CreateWeeklyPlanInput) => ({
                    ...prev,
                    short_week_note: e.target.value || null
                  }))
                }
              />
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Plan Content (Markdown)
              </label>
              <Textarea
                placeholder="Write your weekly plan in markdown format..."
                value={planForm.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setPlanForm((prev: CreateWeeklyPlanInput) => ({ ...prev, content: e.target.value }))
                }
                className="flex-1 min-h-[300px] font-mono text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setEditingPlan(null);
                resetForm();
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Updating...' : 'Update Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
