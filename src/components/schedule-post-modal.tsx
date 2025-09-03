import React, { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { EditorContent } from "../store/drafts-store";
import { PlatformName } from "@crosspost/types";
import { useScheduledPostsStore } from "../store/scheduled-posts-store";
import { toast } from "../hooks/use-toast";
import { useAuth } from "../contexts/auth-context";
import { sign } from "near-sign-verify";
import { near } from "../lib/near";

interface SchedulePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: EditorContent[];
  selectedPlatforms: PlatformName[];
  onScheduled: () => void;
}

export function SchedulePostModal({
  isOpen,
  onClose,
  posts,
  selectedPlatforms,
  onScheduled,
}: SchedulePostModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { saveScheduledPost } = useScheduledPostsStore();
  const { currentAccountId, isSignedIn } = useAuth();

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for scheduling.",
        variant: "destructive",
      });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({
        title: "No Platforms Selected",
        description: "Please select at least one platform to post to.",
        variant: "destructive",
      });
      return;
    }

    if (!isSignedIn || !currentAccountId) {
      toast({
        title: "Authentication Required",
        description: "Please connect your NEAR wallet to schedule posts.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${selectedDate}T${selectedTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      toast({
        title: "Invalid Date",
        description: "Please select a future date and time.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAuthenticating(true);

      // Save scheduled post without pre-authentication
      // Authentication will happen at execution time
      saveScheduledPost(posts, selectedPlatforms, scheduledDateTime);

      toast({
        title: "Post Scheduled",
        description: `Your post has been scheduled for ${scheduledDateTime.toLocaleString()} with fresh authentication.`,
        variant: "success",
      });

      onScheduled();
      onClose();
    } catch (error) {
      console.error("Scheduling authentication error:", error);
      toast({
        title: "Scheduling Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to authenticate or schedule the post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Get current date and time for minimum values
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-black rounded-lg p-6 w-full max-w-md mx-4 base-component">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 ">
          <Calendar size={20} />
          Schedule Post
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 ">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={currentDate}
              className="w-full p-2 border-2 border-primary  rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 "
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 ">Time</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              min={selectedDate === currentDate ? currentTime : undefined}
              className="w-full p-2 border-2 border-primary  rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 "
            />
          </div>

          {selectedDate && selectedTime && (
            <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded">
              <p className="text-sm text-blue-800 dark:text-white flex items-center gap-2">
                <Clock size={16} />
                Scheduled for:{" "}
                {new Date(`${selectedDate}T${selectedTime}`).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            className="flex-1"
            disabled={
              !selectedDate ||
              !selectedTime ||
              selectedPlatforms.length === 0 ||
              isAuthenticating
            }
          >
            {isAuthenticating ? "Authenticating..." : "Schedule Post"}
          </Button>
        </div>
      </div>
    </div>
  );
}
