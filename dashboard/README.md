# Netflix Architecture Dashboard

Real-time monitoring dashboard for the Nest.js resilience demo, visualizing circuit breaker patterns and microservices health.

## Features

- **Real-time SSE Connection** to Nest.js Gateway
- **Circuit Breaker Visualization** (CLOSED/OPEN/HALF_OPEN states)
- **Live Request Stream** showing success/fallback/failed requests
- **Service Health Monitoring** for Gateway and Recommendation Service
- **Traffic Simulation** with auto-request generation
- **Crash Simulation Control** to test circuit breaker behavior

## Tech Stack

- React 19
- TypeScript
- Vite
- HeroUI v2 Components
- Lucide React Icons
- Tailwind CSS

## Setup

1. **Install dependencies:**
```bash
npm install
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
