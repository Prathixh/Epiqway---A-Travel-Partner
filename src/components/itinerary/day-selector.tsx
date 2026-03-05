'use client';

import { Button } from "@/components/ui/button";
import Icons from "@/components/icons";

interface DaySelectorProps {
  totalDays: number;
  currentDay: number;
  onDayChange: (day: number) => void;
}

export default function DaySelector({ totalDays, currentDay, onDayChange }: DaySelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDayChange(currentDay - 1)}
        disabled={currentDay === 1}
        aria-label="Previous day"
      >
        <Icons.ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="font-semibold text-base md:text-lg w-16 text-center">Day {currentDay}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onDayChange(currentDay + 1)}
        disabled={currentDay === totalDays}
        aria-label="Next day"
      >
        <Icons.ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
