import React, { useState } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface SchedulePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (scheduledDate: Date) => void;
  isPosting: boolean;
}

export function SchedulePopup({
  isOpen,
  onClose,
  onSchedule,
  isPosting,
}: SchedulePopupProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHours, setSelectedHours] = useState(new Date().getHours());
  const [selectedMinutes, setSelectedMinutes] = useState(
    new Date().getMinutes(),
  );

  const handleSchedule = () => {
    if (selectedDate) {
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(selectedHours);
      scheduledDate.setMinutes(selectedMinutes);
      onSchedule(scheduledDate);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedHours(new Date().getHours());
    setSelectedMinutes(new Date().getMinutes());
    onClose();
  };

  const isDateSelected = selectedDate !== undefined;
  const isPastDate =
    selectedDate && selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={20} />
            Schedule Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Time</label>
            <div className="flex gap-2">
              <select
                value={selectedHours}
                onChange={(e) => setSelectedHours(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={isPosting}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
              <span className="text-gray-500 flex items-center">:</span>
              <select
                value={selectedMinutes}
                onChange={(e) => setSelectedMinutes(parseInt(e.target.value))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                disabled={isPosting}
              >
                {Array.from({ length: 60 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          {isDateSelected && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled for:</label>
              <div className="flex items-center gap-2">
                <Badge variant={isPastDate ? "destructive" : "default"}>
                  {isPastDate ? "Past Date" : "Scheduled"}
                </Badge>
                <span className="text-sm text-gray-600">
                  {format(selectedDate, "PPP")} at{" "}
                  {selectedHours.toString().padStart(2, "0")}:
                  {selectedMinutes.toString().padStart(2, "0")}
                </span>
              </div>
              {isPastDate && (
                <p className="text-sm text-red-600">
                  This date is in the past. Please select today or a future
                  date.
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isPosting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={isPosting || !isDateSelected || isPastDate}
              className="flex-1"
            >
              {isPosting ? "Scheduling..." : "Schedule Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
