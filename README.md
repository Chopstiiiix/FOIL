# FOIL: AI-Powered Full-Stack Web Development in the Browser

FOIL is an AI-powered web development agent that allows you to prompt, run, edit, and deploy full-stack applications directly from your browser—no local setup required.

## What Makes FOIL Different

- **Full-Stack in the Browser**: FOIL integrates cutting-edge AI models with an in-browser development environment powered by **WebContainers**. This allows you to:
  - Install and run npm tools and libraries (like Vite, Next.js, and more)
  - Run Node.js servers
  - Interact with third-party APIs
  - Deploy to production from chat
  - Share your work via a URL

- **AI with Environment Control**: Unlike traditional dev environments where the AI can only assist in code generation, FOIL gives AI models **complete control** over the entire environment including the filesystem, node server, package manager, terminal, and browser console. This empowers AI agents to handle the entire app lifecycle—from creation to deployment.

Whether you're an experienced developer, a PM or designer, FOIL allows you to build production-grade full-stack applications with ease.

## Tips and Tricks

Here are some tips to get the most out of FOIL:

- **Be specific about your stack**: If you want to use specific frameworks or libraries (like Astro, Tailwind, ShadCN, or any other popular JavaScript framework), mention them in your initial prompt to ensure FOIL scaffolds the project accordingly.

- **Use the enhance prompt icon**: Before sending your prompt, try clicking the 'enhance' icon to have the AI model help you refine your prompt, then edit the results before submitting.

- **Scaffold the basics first, then add features**: Make sure the basic structure of your application is in place before diving into more advanced functionality. This helps FOIL understand the foundation of your project and ensure everything is wired up right before building out more advanced functionality.

- **Batch simple instructions**: Save time by combining simple instructions into one message. For example, you can ask FOIL to change the color scheme, add mobile responsiveness, and restart the dev server, all in one go saving you time and reducing API credit consumption significantly.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Remix + React 18 + TypeScript |
| **Build** | Vite |
| **Hosting** | Cloudflare Pages + Workers |
| **Styling** | UnoCSS + Framer Motion |
| **Code Editor** | CodeMirror 6 |
| **Terminal** | Xterm.js |
| **AI** | Anthropic Claude via Vercel AI SDK |
| **Runtime** | WebContainer API |
| **State** | Nanostores |
| **Persistence** | IndexedDB |

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.18.0 (recommended: v20.15.1)
- **pnpm** v9.4.0 — install via `npm install -g pnpm@9.4.0`
- **Anthropic API Key** — get one from [console.anthropic.com](https://console.anthropic.com/)

## Getting Started

1. **Clone the repository:**

```bash
git clone https://github.com/Chopstiiiix/FOIL.git
cd FOIL
```

2. **Install dependencies:**

```bash
pnpm install
```

3. **Set up environment variables:**

Create a `.env.local` file in the root directory:

```
ANTHROPIC_API_KEY=your_api_key_here
VITE_LOG_LEVEL=debug
```

> **Important:** Never commit your `.env.local` file to version control. It's already included in `.gitignore`.

4. **Start the development server:**

```bash
pnpm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173).

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start the development server |
| `pnpm run build` | Build the project for production |
| `pnpm run start` | Run the built app locally via Wrangler Pages |
| `pnpm run preview` | Build and start locally (production preview) |
| `pnpm test` | Run the test suite (Vitest) |
| `pnpm run typecheck` | Run TypeScript type checking |
| `pnpm run typegen` | Generate TypeScript types via Wrangler |
| `pnpm run deploy` | Build and deploy to Cloudflare Pages |
| `pnpm run lint` | Run ESLint |
| `pnpm run lint:fix` | Run ESLint with auto-fix |

## Project Structure

```
foil/
├── app/
│   ├── components/       # React components (chat, workbench, editor, UI)
│   ├── lib/
│   │   ├── .server/llm/  # Server-only: LLM prompts, model config, streaming
│   │   ├── hooks/         # React hooks (message parser, shortcuts, etc.)
│   │   ├── persistence/   # IndexedDB chat history
│   │   ├── runtime/       # ActionRunner + message parser
│   │   ├── stores/        # Nanostores (workbench, chat, files, theme)
│   │   └── webcontainer/  # WebContainer bootstrap
│   ├── routes/            # Remix routes (chat, API endpoints)
│   ├── styles/            # SCSS stylesheets and CSS variables
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utilities (diff, logging, markdown, etc.)
├── functions/             # Cloudflare Pages serverless functions
├── icons/                 # Custom SVG icons
├── public/                # Static assets
├── .env.local             # Environment variables (not committed)
├── package.json           # Dependencies and scripts
├── uno.config.ts          # UnoCSS configuration
├── vite.config.ts         # Vite build configuration
└── wrangler.toml          # Cloudflare Workers configuration
```

## WebContainer Constraints

Foil runs code in the browser via WebContainers. Keep these limitations in mind:

- No native binaries (C++, g++, etc.)
- Python standard library only (no pip)
- Git is not available
- Must use npm-based web servers (Vite, serve, http-server)

## License

MIT
