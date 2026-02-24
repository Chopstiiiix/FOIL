# Contributing to Foil

> Welcome to the **Foil** open-source codebase! This repo provides an AI-powered full-stack web development agent that runs entirely in the browser.

## Architecture

Foil combines the capabilities of AI with sandboxed development environments to create a collaborative experience where code can be developed by the assistant and the programmer together. Foil combines [WebContainer API](https://webcontainers.io/api) with [Claude Sonnet](https://www.anthropic.com/) using [Remix](https://remix.run/) and the [AI SDK](https://sdk.vercel.ai/).

### WebContainer API

Foil uses [WebContainers](https://webcontainers.io/) to run generated code in the browser. WebContainers provide a full-stack sandbox environment using [WebContainer API](https://webcontainers.io/api). WebContainers run full-stack applications directly in the browser without the cost and security concerns of cloud hosted AI agents.

### Remix App

Foil is built with [Remix](https://remix.run/) and deployed using [CloudFlare Pages](https://pages.cloudflare.com/) and [CloudFlare Workers](https://workers.cloudflare.com/).

### AI SDK Integration

Foil uses the [AI SDK](https://github.com/vercel/ai) to integrate with AI models. You can get an API key from the [Anthropic API Console](https://console.anthropic.com/) to use with Foil.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v20.15.1)
- pnpm (v9.4.0)

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create a `.env.local` file in the root directory and add your Anthropic API key:

```
ANTHROPIC_API_KEY=XXX
```

Optionally, you can set the debug level:

```
VITE_LOG_LEVEL=debug
```

**Important**: Never commit your `.env.local` file to version control. It's already included in .gitignore.

## Available Scripts

- `pnpm run dev`: Starts the development server.
- `pnpm run build`: Builds the project.
- `pnpm run start`: Runs the built application locally using Wrangler Pages.
- `pnpm run preview`: Builds the project and then starts it locally.
- `pnpm test`: Runs the test suite using Vitest.
- `pnpm run typecheck`: Runs TypeScript type checking.
- `pnpm run typegen`: Generates TypeScript types using Wrangler.
- `pnpm run deploy`: Builds the project and deploys it to Cloudflare Pages.

## Development

To start the development server:

```bash
pnpm run dev
```

## Testing

Run the test suite with:

```bash
pnpm test
```

## Deployment

To deploy the application to Cloudflare Pages:

```bash
pnpm run deploy
```

Make sure you have the necessary permissions and Wrangler is correctly configured for your Cloudflare account.
