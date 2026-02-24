# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - link "FOIL" [ref=e7] [cursor=pointer]:
        - /url: /
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "Navigate your artistic vision" [level=1] [ref=e12]
        - paragraph [ref=e13]: Bring ideas to life in seconds or get help on existing projects
      - generic [ref=e16]:
        - textbox "How can FOIL help you today?" [ref=e17]
        - button "Enhance prompt" [disabled] [ref=e20]
  - generic [ref=e25]:
    - generic [ref=e26]: "[plugin:vite:import-analysis] Failed to resolve import \"./GitHubModal.client\" from \"app/components/header/HeaderActionButtons.client.tsx\". Does the file exist?"
    - generic [ref=e27]: C:/Users/leeak/FOIL/app/components/header/HeaderActionButtons.client.tsx:7:28
    - generic [ref=e28]: "13 | import { classNames } from \"~/utils/classNames\"; 14 | import { DeploymentModal } from \"./DeploymentModal.client\"; 15 | import { GitHubModal } from \"./GitHubModal.client\"; | ^ 16 | export function HeaderActionButtons({}) { 17 | _s();"
    - generic [ref=e29]: at TransformPluginContext._formatError (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:49703:41) at TransformPluginContext.error (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:49698:16) at normalizeUrl (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:64260:23) at process.processTicksAndRejections (node:internal/process/task_queues:105:5) at async file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:64392:39 at async Promise.all (index 12) at async TransformPluginContext.transform (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:64319:7) at async PluginContainer.transform (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:49544:18) at async loadAndTransform (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:52366:27) at async viteTransformMiddleware (file:///C:/Users/leeak/FOIL/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.9_sass@1.77.6/node_modules/vite/dist/node/chunks/dep-BcXSligG.js:62102:24
    - generic [ref=e30]:
      - text: Click outside, press Esc key, or fix the code to dismiss.
      - text: You can also disable this overlay by setting
      - code [ref=e31]: server.hmr.overlay
      - text: to
      - code [ref=e32]: "false"
      - text: in
      - code [ref=e33]: vite.config.ts
      - text: .
```