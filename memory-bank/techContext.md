# Technical Context: Open Crosspost

## Technology Stack

### Frontend
- **Framework**: React
- **Build Tool**: Bun (preferred over npm/yarn)
- **Routing**: TanStack Router (formerly React Router)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **State Management**: Custom stores with React hooks

### API Integration
- **SDK**: @crosspost/sdk for API communication and error handling
- **Authentication**: NEAR Wallet integration via SDK
- **Social Platforms**: Twitter, LinkedIn, NEAR Social, etc.

### Development Tools
- **Package Manager**: Bun
- **TypeScript**: For type safety
- **ESLint/Prettier**: Code quality and formatting
- **Playwright**: End-to-end testing

## Key Dependencies

### Core Libraries
- `@crosspost/sdk`: SDK for API communication and error handling
- `@crosspost/types`: TypeScript types for API requests and responses
- `@near-wallet-selector/react-hook`: NEAR wallet integration
- `@tanstack/react-router`: Routing library
- `tailwindcss`: Utility-first CSS framework
- Custom UI components based on shadcn/ui patterns

### State Management
- Custom stores using React's Context API and hooks
- Event-based system for cross-component communication
- SDK for managing authentication state

## API Integration

### SDK Integration
- `@crosspost/sdk` provides a unified interface to the API
- Client methods for all API operations
- Built-in error handling and type checking
- Authentication management and token persistence

### NEAR Integration
- Authentication via NEAR wallet
- Posting to NEAR Social via transactions
- Profile data from NEAR Social

### External Platform APIs
- Integration with multiple social media platforms
- OAuth authentication flows
- Platform-specific error handling

### Proxy API
- Custom backend API that proxies requests to social platforms
- Handles authentication, rate limiting, and error normalization
- Returns standardized response format

## SDK and Error Handling

### Error Types
```typescript
// ApiError for general API errors
class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  details?: Record<string, any>;
  recoverable: boolean;
}

// PlatformError for platform-specific errors
class PlatformError extends Error {
  platform: string;
  code: ApiErrorCode;
  originalError?: any;
  recoverable: boolean;
  status?: number;
  userId?: string;
  details?: Record<string, any>;
}
```

### Error Utilities
```typescript
// Error type checking
isAuthError(error: unknown): boolean
isPlatformError(error: unknown): boolean
isContentError(error: unknown): boolean
isMediaError(error: unknown): boolean
isNetworkError(error: unknown): boolean
isPostError(error: unknown): boolean
isRateLimitError(error: unknown): boolean
isValidationError(error: unknown): boolean
isRecoverableError(error: unknown): boolean

// Error information extraction
getErrorMessage(error: unknown, defaultMessage?: string): string
getErrorDetails(error: unknown): Record<string, any> | undefined
```

### Response Format
```typescript
// Success response
{
  "success": true,
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 3,
      "failed": 0
    },
    "results": [
      {
        "platform": "twitter",
        "userId": "1234567890",
        "status": "success",
        "postId": "abc123",
        "postUrl": "https://twitter.com/user/status/abc123"
      }
      // More successful results...
    ],
    "errors": []
  }
}

// Partial success response
{
  "success": true,
  "data": {
    "summary": {
      "total": 3,
      "succeeded": 2,
      "failed": 1
    },
    "results": [
      // Successful posts...
    ],
    "errors": [
      {
        "platform": "twitter",
        "userId": "1877554594651451392",
        "status": "error",
        "error": "Failed to create thread",
        "errorCode": "THREAD_CREATION_FAILED",
        "recoverable": false,
        "details": {
          "twitterErrorCode": 187,
          "twitterMessage": "Status is a duplicate"
        }
      }
    ]
  }
}
```

## Development Constraints

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support required

### Performance Considerations
- Optimize for mobile devices
- Minimize bundle size
- Efficient state updates

### Security Requirements
- Secure handling of OAuth tokens
- No storage of sensitive credentials on client
- HTTPS for all API communications

## Development Workflow

### Local Development
- Bun for package management and running scripts
- Local development server with hot reloading
- Environment variables for configuration

### Testing Strategy
- Component testing with React Testing Library
- End-to-end testing with Playwright
- Manual testing for social platform integrations

### Deployment
- CI/CD pipeline for automated builds and deployments
- Environment-specific configurations
