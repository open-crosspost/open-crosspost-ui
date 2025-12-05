import { createFileRoute } from "@tanstack/react-router";
import { MarkdownContent } from "../../components/markdown-content";

const homeContent = `# Crosspost UI Documentation

Welcome to the Crosspost UI documentation.

## Getting Started

This documentation will help you get started with Crosspost UI.

## Features

- **Crosspost to multiple platforms** - Post to Twitter, Farcaster, and more
- **Schedule posts** - Plan your content in advance
- **Manage accounts** - Connect and manage multiple social accounts
- **Dark mode** - Beautiful dark and light themes
- **Real-time preview** - See how your posts will look before publishing

## Quick Links

- [Getting Started](/getting-started) - Learn how to set up and use Crosspost UI
- [API Reference](/api) - Complete API documentation
- [Guides](/guides) - Step-by-step tutorials and guides

*Content coming soon...*
`;

export const Route = createFileRoute("/_layout/")({
  component: () => <MarkdownContent content={homeContent} />,
});

