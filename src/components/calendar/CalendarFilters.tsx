'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Instructor } from '@/lib/hooks/useSchoolData';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface CalendarFiltersProps {
  instructors: Instructor[];
  lessonTypes: string[];
  selectedInstructors: string[];
  selectedLessonTypes: string[];
  onInstructorChange: (ids: string[]) => void;
  onLessonTypeChange: (types: string[]) => void;
}

export function CalendarFilters({
  instructors,
  lessonTypes,
  selectedInstructors,
  selectedLessonTypes,
  onInstructorChange,
  onLessonTypeChange,
}: CalendarFiltersProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const toggleInstructor = (id: string) => {
    if (selectedInstructors.includes(id)) {
      onInstructorChange(selectedInstructors.filter((i) => i !== id));
    } else {
      onInstructorChange([...selectedInstructors, id]);
    }
  };

  const toggleLessonType = (type: string) => {
    if (selectedLessonTypes.includes(type)) {
      onLessonTypeChange(selectedLessonTypes.filter((t) => t !== type));
    } else {
      onLessonTypeChange([...selectedLessonTypes, type]);
    }
  };

  const clearFilters = () => {
    onInstructorChange([]);
    onLessonTypeChange([]);
  };

  const hasFilters = selectedInstructors.length > 0 || selectedLessonTypes.length > 0;

  return (
    <div className="bg-background border rounded-lg p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        <div className="flex items-center gap-2">
            {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2 text-xs">
                    Clear <X className="ml-1 h-3 w-3" />
                </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="h-8">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
        </div>
      </div>

      {(isExpanded || hasFilters) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Instructors */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Instructors</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {instructors.map((instructor) => (
                <div key={instructor.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`inst-${instructor.id}`} 
                    checked={selectedInstructors.includes(instructor.id)}
                    onCheckedChange={() => toggleInstructor(instructor.id)}
                  />
                  <Label htmlFor={`inst-${instructor.id}`} className="text-sm font-normal cursor-pointer truncate" title={instructor.full_name}>
                    {instructor.full_name}
                  </Label>
                </div>
              ))}
              {instructors.length === 0 && <div className="text-sm text-muted-foreground">No instructors found.</div>}
            </div>
          </div>

          {/* Lesson Types */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lesson Types</Label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {lessonTypes.map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`type-${type}`} 
                    checked={selectedLessonTypes.includes(type)}
                    onCheckedChange={() => toggleLessonType(type)}
                  />
                  <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer truncate" title={type}>
                    {type}
                  </Label>
                </div>
              ))}
               {lessonTypes.length === 0 && <div className="text-sm text-muted-foreground">No lesson types found.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
