# Foil: AI-Powered Full-Stack Web Development in the Browser

Foil is an AI-powered web development agent that allows you to prompt, run, edit, and deploy full-stack applications directly from your browser—no local setup required.

## What Makes Foil Different

- **Full-Stack in the Browser**: Foil integrates cutting-edge AI models with an in-browser development environment powered by **WebContainers**. This allows you to:
  - Install and run npm tools and libraries (like Vite, Next.js, and more)
  - Run Node.js servers
  - Interact with third-party APIs
  - Deploy to production from chat
  - Share your work via a URL

- **AI with Environment Control**: Unlike traditional dev environments where the AI can only assist in code generation, Foil gives AI models **complete control** over the entire environment including the filesystem, node server, package manager, terminal, and browser console. This empowers AI agents to handle the entire app lifecycle—from creation to deployment.

Whether you're an experienced developer, a PM or designer, Foil allows you to build production-grade full-stack applications with ease.

## Tips and Tricks

Here are some tips to get the most out of Foil:

- **Be specific about your stack**: If you want to use specific frameworks or libraries (like Astro, Tailwind, ShadCN, or any other popular JavaScript framework), mention them in your initial prompt to ensure Foil scaffolds the project accordingly.

- **Use the enhance prompt icon**: Before sending your prompt, try clicking the 'enhance' icon to have the AI model help you refine your prompt, then edit the results before submitting.

- **Scaffold the basics first, then add features**: Make sure the basic structure of your application is in place before diving into more advanced functionality. This helps Foil understand the foundation of your project and ensure everything is wired up right before building out more advanced functionality.

- **Batch simple instructions**: Save time by combining simple instructions into one message. For example, you can ask Foil to change the color scheme, add mobile responsiveness, and restart the dev server, all in one go saving you time and reducing API credit consumption significantly.

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

## Getting Started

```bash
pnpm install
pnpm run dev
```

## License

MIT
