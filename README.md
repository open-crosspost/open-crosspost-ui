<div align="center">
  <h1>every profile template</h1>
  <p>
    <strong>A customizable web4 profile for easy integration with everything</strong>
  </p>
</div>

## Quick Start: Deploy Your Profile

1. Install dependencies:

```bash
bun install
```

2. Initialize your web4 configuration:

```bash
bun run init
```

This will:

- Prompt for network (mainnet/testnet) and account name
- Create a web4 subaccount if needed
- Save configuration to `bos.config.json`

> **Important**: Your web4 account must be saved to the legacy keychain. If you need to add it later, you'll have to export and import it again to the legacy keychain.

3. Build and deploy:

```bash
bun run build
bun run deploy
```

Your profile will be available at:

- Testnet: `https://web4.ACCOUNT_NAME.testnet.page`
- Mainnet: `https://web4.ACCOUNT_NAME.near.page`

## Customize Your Profile

This template includes:

- [TanStack Router](https://tanstack.com/router) for type-safe routing
- Landing page that links to your website
- Donation page powered by [Potlock](https://potlock.org)

1. Start the development server:

```bash
bun run dev
```

2. Customize the app:

- `src/routes/_layout/index.tsx`: Main landing page
- `src/routes/_layout/donate/`: Donation page with Potlock integration
- `src/index.css`: Global styles (uses Tailwind)

The app uses [shadcn/ui](https://ui.shadcn.com/) components for the UI, which you can customize in `src/components/ui/`.

## Technical Details: Module Federation

This template uses [module federation](https://module-federation.io/) to integrate with other applications. Key points:

- Exports an App module that can be imported by other applications
- Shares dependencies with the host application to avoid duplication
- Configuration is in `rsbuild.config.ts`

Important rules:

- Do not modify `src/App.tsx`
- Feel free to add new routes, components, and features

## Contributing

We welcome contributions! Please read our [contribution guide](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

<div align="right">
<a href="https://nearbuilders.org" target="_blank">
<img
  src="https://builders.mypinata.cloud/ipfs/QmWt1Nm47rypXFEamgeuadkvZendaUvAkcgJ3vtYf1rBFj"
  alt="Near Builders"
  height="40"
/>
</a>
</div>
