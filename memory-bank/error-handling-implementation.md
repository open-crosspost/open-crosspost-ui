# Error Handling Implementation Plan

This document outlines the detailed implementation plan for enhancing the error handling system in Open Crosspost.

## 1. API Types Updates

### New Types in `api-types.ts`

```typescript
// Post result for a successful post
export interface PostResult {
  platform: SupportedPlatform;
  userId: string;
  status: "success";
  postId: string;
  postUrl?: string;
}

// Error information for a failed post
export interface PostError {
  platform: SupportedPlatform;
  userId: string;
  status: "error";
  error: string;
  errorCode?: string;
  recoverable: boolean;
  details?: Record<string, any>;
}

// Summary of post results
export interface PostSummary {
  total: number;
  succeeded: number;
  failed: number;
}

// Complete post response
export interface PostResponse {
  summary: PostSummary;
  results: PostResult[];
  errors: PostError[];
}
```

## 2. Component Structure

### New Components

1. **PlatformIcon Component**

   - Reusable component for displaying platform icons
   - Props: platform, size, className
   - Used in multiple places for consistent platform representation

2. **PostResultsSummary Component**

   - Displays summary of post results (total, succeeded, failed)
   - Props: summary, className
   - Used in the error details dialog

3. **SuccessfulPostsList Component**

   - Displays list of successful posts with platform icons and links
   - Props: results, className
   - Used in the error details dialog

4. **FailedPostsList Component**

   - Displays list of failed posts with error details and retry buttons
   - Props: errors, onRetry, isRetrying, className
   - Used in the error details dialog

5. **PostErrorDetails Component**
   - Main dialog component for displaying detailed error information
   - Composes the above components
   - Handles retry functionality
   - Props: open, onOpenChange, successResults, errorResults, postContent

### Component Hierarchy

```
PostErrorDetails
├── PostResultsSummary
├── SuccessfulPostsList
│   └── PlatformIcon (multiple)
└── FailedPostsList
    └── PlatformIcon (multiple)
```

## 3. State Management

### Local State in PostErrorDetails

```typescript
// Track which posts are currently being retried
const [retrying, setRetrying] = useState<Record<string, boolean>>({});

// Track updated results after retries
const [currentSuccessResults, setCurrentSuccessResults] =
  useState(successResults);
const [currentErrorResults, setCurrentErrorResults] = useState(errorResults);
```

### Context for Sharing Error State (if needed)

```typescript
// Create context for sharing error state across components
interface PostErrorContext {
  successResults: PostResult[];
  errorResults: PostError[];
  retrying: Record<string, boolean>;
  handleRetry: (error: PostError) => Promise<void>;
  handleRetryAll: () => Promise<void>;
}

const PostErrorContext = createContext<PostErrorContext | undefined>(undefined);

// Provider component
export function PostErrorProvider({ children, ...props }) {
  // State and handlers
  return (
    <PostErrorContext.Provider value={...}>
      {children}
    </PostErrorContext.Provider>
  );
}

// Custom hook for consuming the context
export function usePostError() {
  const context = useContext(PostErrorContext);
  if (context === undefined) {
    throw new Error('usePostError must be used within a PostErrorProvider');
  }
  return context;
}
```

## 4. Toast Enhancements

### Toast Variants

1. **Success Toast**

   ```typescript
   toast({
     title: "Success",
     description: `Your post has been published successfully to all ${summary.total} platforms`,
     variant: "default", // green success toast
   });
   ```

2. **Warning Toast (Partial Success)**

   ```typescript
   toast({
     title: "Partial Success",
     description: `Posted to ${summary.succeeded} of ${summary.total} platforms`,
     variant: "warning",
     action: (
       <ToastAction altText="View Details" onClick={() => showErrorDetails(results, errors)}>
         View Details
       </ToastAction>
     ),
   });
   ```

3. **Error Toast**
   ```typescript
   toast({
     title: "Post Failed",
     description: `Failed to publish to any platform`,
     variant: "destructive",
     action: (
       <ToastAction altText="View Details" onClick={() => showErrorDetails(results, errors)}>
         View Details
       </ToastAction>
     ),
   });
   ```

## 5. Retry Functionality

### Individual Retry

```typescript
const handleRetry = async (error: PostError) => {
  const retryKey = `${error.platform}-${error.userId}`;
  setRetrying({ ...retrying, [retryKey]: true });

  try {
    const postRequest = {
      targets: [{ platform: error.platform, userId: error.userId }],
      content: postContent,
    };

    const response = await apiClient.createPost(postRequest);

    if (response.success && response.data?.summary.succeeded > 0) {
      // Handle successful retry
      toast({
        title: "Retry Successful",
        description: `Successfully posted to ${error.platform}`,
      });

      // Update results
      updateResultsAfterRetry(error, response.data);
    } else {
      // Handle failed retry
      toast({
        title: "Retry Failed",
        description: `Failed to post to ${error.platform}: ${
          response.data?.errors[0]?.error || response.error || "Unknown error"
        }`,
        variant: "destructive",
      });
    }
  } catch (error) {
    // Handle exceptions
    toast({
      title: "Retry Failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive",
    });
  } finally {
    setRetrying({ ...retrying, [retryKey]: false });
  }
};
```

### Batch Retry

```typescript
const handleRetryAll = async () => {
  const recoverableErrors = currentErrorResults.filter(
    (error) => error.recoverable,
  );

  if (recoverableErrors.length === 0) {
    toast({
      title: "No Retryable Errors",
      description: "None of the failed posts can be retried automatically",
      variant: "warning",
    });
    return;
  }

  // Set all as retrying
  const retryingState: Record<string, boolean> = {};
  recoverableErrors.forEach((error) => {
    retryingState[`${error.platform}-${error.userId}`] = true;
  });
  setRetrying(retryingState);

  // Create targets for all recoverable errors
  const targets = recoverableErrors.map((error) => ({
    platform: error.platform,
    userId: error.userId,
  }));

  try {
    const postRequest = {
      targets,
      content: postContent,
    };

    const response = await apiClient.createPost(postRequest);

    if (response.success && response.data) {
      const { summary } = response.data;

      if (summary.succeeded > 0) {
        // Handle successful retries
        toast({
          title: "Retry Successful",
          description: `Successfully posted to ${summary.succeeded} of ${summary.total} platforms`,
          variant: summary.failed === 0 ? "default" : "warning",
        });

        // Update results
        updateResultsAfterBatchRetry(recoverableErrors, response.data);
      } else {
        // Handle all retries failed
        toast({
          title: "Retry Failed",
          description: "Failed to retry any posts",
          variant: "destructive",
        });
      }
    }
  } catch (error) {
    // Handle exceptions
    toast({
      title: "Retry Failed",
      description: error instanceof Error ? error.message : "Unknown error",
      variant: "destructive",
    });
  } finally {
    setRetrying({});
  }
};
```

## 6. Editor Component Updates

### Update handleSubmit in Editor

```typescript
const handleSubmit = useCallback(async () => {
  // Existing validation code...

  setIsPosting(true);

  try {
    // Prepare post content...

    // Handle NEAR Social posts...

    // Handle other platform posts
    if (otherAccounts.length > 0) {
      const postRequest = {
        targets: otherAccounts.map(/* ... */),
        content: postContents,
      };

      const response = await apiClient.createPost(postRequest);

      if (response.success && response.data) {
        const { summary, results, errors } = response.data;

        // All successful
        if (summary.failed === 0) {
          toast({
            title: "Success",
            description: `Your post has been published successfully to all ${summary.total} platforms`,
            variant: "default", // green success toast
          });

          // Clear form
          setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
          clearAutoSave();
        }
        // Partial success
        else if (summary.succeeded > 0) {
          toast({
            title: "Partial Success",
            description: `Posted to ${summary.succeeded} of ${summary.total} platforms`,
            variant: "warning",
            action: (
              <ToastAction altText="View Details" onClick={() => showErrorDetails(results, errors)}>
                View Details
              </ToastAction>
            ),
          });

          // Clear form since we had partial success
          setPosts([{ text: "", mediaId: null, mediaPreview: null }]);
          clearAutoSave();
        }
        // All failed
        else {
          toast({
            title: "Post Failed",
            description: `Failed to publish to any platform`,
            variant: "destructive",
            action: (
              <ToastAction altText="View Details" onClick={() => showErrorDetails(results, errors)}>
                View Details
              </ToastAction>
            ),
          });
        }
      } else {
        // Handle complete API failure
        toast({
          title: "Post Failed",
          description: response.error || "Failed to publish post",
          variant: "destructive",
        });
      }
    }
  } catch (error) {
    // Handle exceptions...
  } finally {
    setIsPosting(false);
  }
}, [/* dependencies */]);

// Function to show error details dialog
const showErrorDetails = useCallback((results: PostResult[], errors: PostError[]) => {
  setErrorDialogData({ results, errors });
  setErrorDialogOpen(true);
}, []);
```

## 7. Testing Scenarios

### Success Scenario

- All posts succeed
- Show success toast
- Clear form

### Partial Success Scenario

- Some posts succeed, some fail
- Show warning toast with "View Details" button
- Clicking button opens error details dialog
- Dialog shows successful and failed posts
- User can retry failed posts
- Clear form

### All Failed Scenario

- All posts fail
- Show error toast with "View Details" button
- Clicking button opens error details dialog
- Dialog shows all failed posts
- User can retry recoverable errors
- Form is not cleared

### Retry Scenarios

- Retry individual post succeeds
- Retry individual post fails
- Retry all recoverable posts with mixed results
- Retry all recoverable posts all succeed
- Retry all recoverable posts all fail

## 8. Implementation Order

1. Update API types
2. Create reusable components (PlatformIcon, etc.)
3. Implement PostErrorDetails dialog
4. Update Editor component to handle new response format
5. Implement retry functionality
6. Test all scenarios
7. Refine UI based on testing feedback
