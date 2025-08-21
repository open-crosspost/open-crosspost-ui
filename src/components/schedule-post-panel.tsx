import React, { useState } from "react";
import { Button } from "./ui/button";
import { Clock, Edit, Trash2, Twitter, Eye, RefreshCw, Check } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "./ui/badge";
import { useScheduledPostsStore } from "@/store/scheduled-posts-store";
import { EditScheduledPostModal } from "./edit-scheduled-post-modal";
import { ViewScheduledPostModal } from "./view-scheduled-post-modal";
import { useSubmitPost } from "@/hooks/use-submit-post";
import { toast } from "@/hooks/use-toast";

interface SchedulePostPanelProps {
  isPosting: boolean;
}

export function SchedulePostPanel({
  isPosting,
}: SchedulePostPanelProps) {
  const scheduledPosts = useScheduledPostsStore((state) => state.scheduledPosts);
  
  // Use static references to prevent re-renders
  const removeScheduledPost = useScheduledPostsStore.getState().removeScheduledPost;
  const updateScheduledPost = useScheduledPostsStore.getState().updateScheduledPost;
  const getScheduledPost = useScheduledPostsStore.getState().getScheduledPost;
  const cleanupExpiredPosts = useScheduledPostsStore.getState().cleanupExpiredPosts;
  const cleanupPublishedPosts = useScheduledPostsStore.getState().cleanupPublishedPosts;
  const markPostAsPublished = useScheduledPostsStore.getState().markPostAsPublished;
  const markPostAsFailed = useScheduledPostsStore.getState().markPostAsFailed;
  const { submitPost } = useSubmitPost();
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [viewingPost, setViewingPost] = useState<string | null>(null);

  const handleEditPost = (id: string) => {
    setEditingPost(id);
  };

  const handleViewPost = (id: string) => {
    setViewingPost(id);
  };

  const handleSaveEdit = (updatedPost: any) => {
    if (editingPost) {
      updateScheduledPost(editingPost, updatedPost);
      setEditingPost(null);
    }
  };

  const handleCloseEdit = () => {
    setEditingPost(null);
  };

  const handleCloseView = () => {
    setViewingPost(null);
  };

  const handleRetryPost = async (postId: string) => {
    const post = getScheduledPost(postId);
    if (!post) return;

    try {
      // Mark as publishing
      updateScheduledPost(postId, { status: "publishing" as any });
      
      console.log(`Retrying failed post: ${postId}`);
      
      // Use the real submitPost function to retry posting
      const result = await submitPost(
        post.content,
        post.selectedAccounts,
        post.postType,
        post.targetUrl || ""
      );
      
      if (result === "success") {
        // Mark as published
        markPostAsPublished(postId);
        console.log(`Successfully retried post: ${postId}`);
      } else {
        // Mark as failed again
        markPostAsFailed(postId, `Retry failed: ${result}`);
        console.error(`Failed to retry post: ${postId} - result: ${result}`);
      }
    } catch (error) {
      console.error(`Failed to retry post: ${postId}`, error);
      markPostAsFailed(postId, error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleDismissFailedPost = (postId: string) => {
    removeScheduledPost(postId);
  };



  // Function to check and publish scheduled posts automatically
  const checkAndPublishScheduledPosts = React.useCallback(async () => {
    const now = new Date();
    const currentScheduledPosts = useScheduledPostsStore.getState().scheduledPosts;
    const postsToPublish = currentScheduledPosts.filter(
      (post) => post.status === "scheduled" && post.scheduledDate <= now
    );

    for (const post of postsToPublish) {
      try {
        // Mark as publishing
        updateScheduledPost(post.id, { status: "publishing" as any });
        
        console.log(`Publishing scheduled post: ${post.id}`);
        
        // Use the real submitPost function to actually post to platforms
        // Authentication already happened at scheduling time, so this should work
        const result = await submitPost(
          post.content,
          post.selectedAccounts,
          post.postType,
          post.targetUrl || ""
        );
        
        if (result === "success") {
          // Mark as published
          markPostAsPublished(post.id);
          console.log(`Successfully published post: ${post.id}`);
        } else {
          // Mark as failed with more detailed error information
          let errorMessage = `Failed to publish: ${result}`;
          
          // Check for specific Twitter API errors
          if (result.includes("v2") || result.includes("Cannot read properties of null")) {
            errorMessage = "Twitter API configuration error. Please contact support or try again later.";
          } else if (result.includes("UNKNOWN_ERROR")) {
            errorMessage = "Server configuration error. Please try again later or contact support.";
          }
          
          markPostAsFailed(post.id, errorMessage);
          console.error(`Failed to publish post: ${post.id} - result: ${result}`);
        }
      } catch (error) {
        console.error(`Failed to publish post: ${post.id}`, error);
        let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        // Check for specific Twitter API errors
        if (errorMessage.includes("v2") || errorMessage.includes("Cannot read properties of null")) {
          errorMessage = "Twitter API configuration error. Please contact support or try again later.";
        } else if (errorMessage.includes("UNKNOWN_ERROR")) {
          errorMessage = "Server configuration error. Please try again later or contact support.";
        }
        markPostAsFailed(post.id, errorMessage);
      }
    }
  }, [updateScheduledPost, submitPost, markPostAsPublished, markPostAsFailed]);

  // Clean up expired posts and check for posts to publish when component mounts and periodically
  React.useEffect(() => {
    cleanupExpiredPosts();
    cleanupPublishedPosts();
    checkAndPublishScheduledPosts();
    
    // Set up interval to check every 30 seconds
    const interval = setInterval(() => {
      cleanupExpiredPosts();
      cleanupPublishedPosts();
      checkAndPublishScheduledPosts();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [checkAndPublishScheduledPosts]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "twitter":
        return <Twitter size={16} className="text-blue-400" />;
      default:
        return <Clock size={16} />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "published":
        return "default" as const;
      case "failed":
        return "destructive" as const;
      case "publishing":
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="w-full max-w-sm bg-white border-2 border-gray-800 shadow-[2px_2px_0_rgba(0,0,0,1)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock size={20} />
          Scheduled Posts {scheduledPosts.length}
        </h3>
      </div>

      {/* Scheduled Posts List */}
      <div className="space-y-3 mb-4">
        {scheduledPosts.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
          >
            <div className="flex items-start justify-between mb-2">
                             <div className="flex items-center gap-2">
                 <Badge variant={getStatusBadgeVariant(post.status)} className="text-xs">
                   {post.status === "publishing" ? (
                     <div className="flex items-center gap-1">
                       <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                       Publishing...
                     </div>
                   ) : (
                     <>
                       <Clock size={12} className="mr-1" />
                       {post.status}
                     </>
                   )}
                 </Badge>
                 {getPlatformIcon(post.selectedAccounts[0]?.platform || "Unknown")}
               </div>
                             <div className="flex gap-1">
                 <Button
                   variant="ghost"
                   size="sm"
                   onClick={() => handleViewPost(post.id)}
                   className="h-6 w-6 p-0"
                   title="View post"
                 >
                   <Eye size={12} />
                 </Button>
                                   {post.status === "failed" && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryPost(post.id)}
                        className="h-6 w-6 p-0 text-orange-500 hover:text-orange-700"
                        title="Retry post"
                      >
                        <RefreshCw size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissFailedPost(post.id)}
                        className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                        title="Dismiss failed post"
                      >
                        <Check size={12} />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditPost(post.id)}
                    className="h-6 w-6 p-0"
                    title="Edit post"
                  >
                    <Edit size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeScheduledPost(post.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    title="Delete post"
                  >
                    <Trash2 size={12} />
                  </Button>
               </div>
            </div>
            
                         <p className="text-sm text-gray-800 mb-2">
               {post.content[0]?.text || "No content"}
             </p>
             
             {post.status === "failed" && post.errorMessage && (
               <div className="text-xs text-red-600 mb-2 bg-red-50 p-2 rounded border border-red-200">
                 <strong>Error:</strong> {post.errorMessage}
                 {post.errorMessage.includes("v2") && (
                   <div className="mt-1 text-xs text-gray-600">
                     <strong>Troubleshooting:</strong> This error suggests Twitter API configuration issues. 
                     Please check that Twitter API credentials are properly configured on the backend.
                   </div>
                 )}
               </div>
             )}
            
            <div className="text-xs text-gray-600">
              {format(post.scheduledDate, "MMM d, h:mm a")}
            </div>
            
                         <div className="text-xs text-gray-500 mt-1">
               {post.status === "published" ? (
                 <span className="text-green-600">
                   Published • Will be removed in {post.publishedAt ? 
                     Math.max(0, Math.ceil((60 - (Date.now() - post.publishedAt.getTime()) / 1000) / 60)) : 0}m
                 </span>
               ) : (
                 formatDistanceToNow(post.scheduledDate, { addSuffix: true })
               )}
             </div>
          </div>
        ))}
      </div>

      {/* Empty state when no scheduled posts */}
      {scheduledPosts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Clock size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No scheduled posts</p>
          <p className="text-xs">Schedule posts will appear here</p>
        </div>
             )}

       {/* Edit Modal */}
       <EditScheduledPostModal
         isOpen={editingPost !== null}
         onClose={handleCloseEdit}
         onSave={handleSaveEdit}
         post={editingPost ? getScheduledPost(editingPost) || null : null}
         isPosting={isPosting}
       />

       {/* View Modal */}
       <ViewScheduledPostModal
         isOpen={viewingPost !== null}
         onClose={handleCloseView}
         post={viewingPost ? getScheduledPost(viewingPost) || null : null}
       />
     </div>
   );
 }
