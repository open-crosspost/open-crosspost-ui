# Crosspost UI Documentation Site

This is the documentation site for Crosspost UI, built with React, TanStack Router, and Tailwind CSS.

## Development

```bash
# Install dependencies (from root)
bun install

# Run development server
bun run dev:docs
# or from this directory
cd apps/docs && bun run dev
```

## Building

```bash
# Build for production
bun run build:docs
# or from this directory
cd apps/docs && bun run build
```

## Structure

- `src/routes/` - TanStack Router routes
- `src/components/` - React components
- `src/contexts/` - React contexts (theme, etc.)
- `public/` - Static assets

## Adding Content

Edit the route files in `src/routes/_layout/` to add or update documentation content. The content is rendered using Markdown via the `MarkdownContent` component.

