'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Lesson } from '@/lib/lesson-service';
import { useCreateLesson, useUpdateLesson } from '@/lib/hooks/useSchoolSettings';
import { AddLessonTypeModal } from './AddLessonTypeModal';
import { EditLessonTypeModal } from './EditLessonTypeModal';
import { useState } from 'react';
import { Pencil } from 'lucide-react';

interface LessonTypesListProps {
  lessonTypes?: Lesson[];
}

export function LessonTypesList({ lessonTypes = [] }: LessonTypesListProps) {
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const [editingType, setEditingType] = useState<Lesson | null>(null);

  const handleAdd = (data: Omit<Lesson, 'id' | 'active'>) => {
    createLesson.mutate({
      ...data,
      active: true,
    });
  };

  const handleEdit = (id: number, data: Partial<Lesson>) => {
    updateLesson.mutate({ id, updates: data });
  };

  const handleToggleActive = (id: number, currentActive: boolean) => {
    updateLesson.mutate({ id, updates: { active: !currentActive } });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Lesson Types</CardTitle>
          <CardDescription>Manage the types of lessons offered.</CardDescription>
        </div>
        <AddLessonTypeModal onAdd={handleAdd} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lessonTypes.length === 0 && <p className="text-muted-foreground text-sm">No lesson types defined.</p>}
          {lessonTypes.map((type) => (
            <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {type.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${type.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {type.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">{type.description}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {type.duration_minutes} min • ${type.price}
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-2 mr-4">
                    <Checkbox 
                        id={`active-${type.id}`} 
                        checked={type.active} 
                        onCheckedChange={() => handleToggleActive(type.id, type.active)}
                    />
                    <label htmlFor={`active-${type.id}`} className="text-sm cursor-pointer">Active</label>
                 </div>
                <Button variant="outline" size="icon" onClick={() => setEditingType(type)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <EditLessonTypeModal 
        lessonType={editingType} 
        open={!!editingType} 
        onOpenChange={(open) => !open && setEditingType(null)}
        onSave={handleEdit}
      />
    </Card>
  );
}
