import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { ScheduledPost } from "@/store/scheduled-posts-store";

interface EditScheduledPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPost: Partial<ScheduledPost>) => void;
  post: ScheduledPost | null;
  isPosting: boolean;
}

export function EditScheduledPostModal({
  isOpen,
  onClose,
  onSave,
  post,
  isPosting,
}: EditScheduledPostModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHours, setSelectedHours] = useState(0);
  const [selectedMinutes, setSelectedMinutes] = useState(0);
  const [postContent, setPostContent] = useState("");

  // Initialize form when post changes
  useEffect(() => {
    if (post) {
      setSelectedDate(post.scheduledDate);
      setSelectedHours(post.scheduledDate.getHours());
      setSelectedMinutes(post.scheduledDate.getMinutes());
      setPostContent(post.content[0]?.text || "");
    }
  }, [post]);

  const handleSave = () => {
    if (selectedDate && post) {
      const updatedDate = new Date(selectedDate);
      updatedDate.setHours(selectedHours);
      updatedDate.setMinutes(selectedMinutes);

      const updatedContent = [
        {
          text: postContent,
          media: post.content[0]?.media || [],
        },
        ...post.content.slice(1), // Keep other parts of the thread
      ];

      onSave({
        content: updatedContent,
        scheduledDate: updatedDate,
      });
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDate(undefined);
    setSelectedHours(0);
    setSelectedMinutes(0);
    setPostContent("");
    onClose();
  };

  const isDateSelected = selectedDate !== undefined;
  const isPastDate =
    selectedDate && selectedDate < new Date(new Date().setHours(0, 0, 0, 0));

  if (!post) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock size={20} />
            Edit Scheduled Post
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Content */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Post Content</label>
            <Textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Enter your post content..."
              className="min-h-[100px]"
              disabled={isPosting}
            />
          </div>

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
              onClick={handleSave}
              disabled={
                isPosting ||
                !isDateSelected ||
                isPastDate ||
                !postContent.trim()
              }
              className="flex-1"
            >
              {isPosting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
