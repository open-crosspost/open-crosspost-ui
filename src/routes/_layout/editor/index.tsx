import { createFileRoute, useNavigate } from "@tanstack/react-router";
import React, { useState } from "react";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { useNearAuth } from "../../../store/nearAuthStore";
import { useSelectedAccounts } from "../../../store/platformAccountsStore";
import { useDraftsStore, PostContent } from "../../../store/draftsStore";
import { createPost } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { DraftsModal } from "../../../components/drafts-modal";
import { PlatformAccountsSelector } from "../../../components/platform-accounts-selector";
import { toast } from "../../../hooks/use-toast";
import { requireAuthorization } from "../../../lib/auth/route-guards";

export const Route = createFileRoute("/_layout/editor/")({
  beforeLoad: () => {
    // Check if user is authorized before loading the route
    requireAuthorization();
  },
  component: EditorPage,
});

function EditorPage() {
  const navigate = useNavigate();
  const { signedAccountId } = useWalletSelector();
  const { isAuthorized } = useNearAuth();
  const selectedAccounts = useSelectedAccounts();
  const { addDraft, setModalOpen } = useDraftsStore();
  
  const [text, setText] = useState("");
  const [media, setMedia] = useState<{ data: string; mimeType: string; altText?: string }[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  
  
  // Handle text input
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };
  
  // Handle media upload
  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMedia(prev => [
            ...prev,
            {
              data: event.target!.result as string,
              mimeType: file.type,
            }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  
  // Handle media removal
  const handleRemoveMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle post submission
  const handleSubmit = async () => {
    if (!text.trim() && media.length === 0) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedAccounts.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one account to post to",
        variant: "destructive",
      });
      return;
    }
    
    setIsPosting(true);
    
    try {
      const postContent: PostContent = {
        text,
        media,
      };
      
      const postRequest = {
        targets: selectedAccounts.map(account => ({
          platform: account.platform,
          userId: account.userId,
        })),
        content: [postContent],
      };
      
      const response = await createPost(postRequest);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Your post has been published successfully",
        });
        
        // Clear form
        setText("");
        setMedia([]);
      } else {
        throw new Error(response.error || "Failed to publish post");
      }
    } catch (error) {
      toast({
        title: "Post Failed",
        description: error instanceof Error ? error.message : "Failed to publish post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };
  
  // Handle save as draft
  const handleSaveAsDraft = () => {
    if (!text.trim() && media.length === 0) {
      toast({
        title: "Error",
        description: "Draft content cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const postContent: PostContent = {
      text,
      media,
    };
    
    addDraft([postContent]);
    
    toast({
      title: "Draft Saved",
      description: "Your draft has been saved successfully",
    });
  };
  
  // Handle load draft
  const handleLoadDraft = (posts: PostContent[]) => {
    if (posts.length > 0) {
      setText(posts[0].text);
      setMedia(posts[0].media || []);
    }
  };
  
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Compose Post</h1>
        <p className="text-gray-500">
          Your post will be published to {selectedAccounts.length} selected account{selectedAccounts.length !== 1 ? 's' : ''}
        </p>
      </div>
      
      <PlatformAccountsSelector />
      
      <div className="mt-6 space-y-4">
        <Textarea
          placeholder="What's on your mind?"
          value={text}
          onChange={handleTextChange}
          className="min-h-[150px] resize-y"
        />
        
        {media.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {media.map((item, index) => (
              <div key={index} className="relative">
                {item.mimeType.startsWith('image/') ? (
                  <img 
                    src={item.data} 
                    alt={item.altText || "Uploaded media"} 
                    className="w-24 h-24 object-cover rounded-md"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 flex items-center justify-center rounded-md">
                    <span className="text-xs text-gray-600">{item.mimeType}</span>
                  </div>
                )}
                <button
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  onClick={() => handleRemoveMedia(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="hidden"
              multiple
            />
            <div className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              Add Media
            </div>
          </label>
          
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
            >
              Drafts
            </Button>
            
            <Button
              variant="outline"
              onClick={handleSaveAsDraft}
            >
              Save Draft
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={isPosting || (!text.trim() && media.length === 0) || selectedAccounts.length === 0}
            >
              {isPosting ? "Posting..." : "Post"}
            </Button>
          </div>
        </div>
      </div>
      
      <DraftsModal onSelect={handleLoadDraft} />
    </div>
  );
}
