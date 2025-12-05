import { createFileRoute } from "@tanstack/react-router";
import { MarkdownContent } from "../../components/markdown-content";

const content = `# API Reference

Complete API documentation for Crosspost UI.

## Components

### WalletProvider

The main wallet provider component.

\`\`\`tsx
import { WalletProvider } from "@crosspost/ui/integrations/near-wallet";

<WalletProvider network="mainnet" enableSignMessage={true}>
  {/* Your app */}
</WalletProvider>
\`\`\`

### BetterNearAuthProvider

Enhanced authentication provider with session management.

\`\`\`tsx
import { BetterNearAuthProvider } from "@crosspost/ui/integrations/better-near-auth";

<BetterNearAuthProvider>
  {/* Your app */}
</BetterNearAuthProvider>
\`\`\`

## Hooks

### useWallet

Access wallet functionality.

\`\`\`tsx
import { useWallet } from "@crosspost/ui/integrations/near-wallet";

const { accountId, connect, disconnect } = useWallet();
\`\`\`

*More API documentation coming soon...*
`;

export const Route = createFileRoute("/_layout/api")({
  component: () => <MarkdownContent content={content} />,
});

