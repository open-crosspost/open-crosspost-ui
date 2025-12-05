import { createFileRoute } from "@tanstack/react-router";
import { MarkdownContent } from "../../components/markdown-content";

const content = `# Guides

Step-by-step tutorials and guides for using Crosspost UI.

## Available Guides

### Connecting Your Wallet

Learn how to connect your NEAR wallet to Crosspost UI.

### Connecting Social Accounts

Step-by-step guide to connecting your social media accounts.

### Scheduling Posts

How to schedule posts for later publication.

### Managing Multiple Accounts

Tips for managing multiple social media accounts.

*Guides coming soon...*
`;

export const Route = createFileRoute("/_layout/guides")({
  component: () => <MarkdownContent content={content} />,
});

