import { createFileRoute } from "@tanstack/react-router";
import { MarkdownContent } from "../../components/markdown-content";

const content = `# Getting Started

Welcome to Crosspost UI! This guide will help you get started.

## Installation

\`\`\`bash
bun install
\`\`\`

## Running the Development Server

\`\`\`bash
bun run dev
\`\`\`

## Building for Production

\`\`\`bash
bun run build
\`\`\`

## Next Steps

- Connect your NEAR wallet
- Connect your social media accounts
- Start crossposting!

*More content coming soon...*
`;

export const Route = createFileRoute("/_layout/getting-started")({
  component: () => <MarkdownContent content={content} />,
});

