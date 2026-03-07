---
name: Convex React
description: Skill for integrating and managing Convex backend with React applications.
---

# Convex React Skill

This skill provides instructions, best practices, and snippets for working with Convex in a React environment.

## Overview
Convex is a backend-as-a-service that provides a reactive database, serverless functions, and file storage. The React client allows for seamless integration with hooks.

## Core Concepts

### 1. Provider Setup
Wrap your application with `ConvexProvider`.

```tsx
import { ConvexProvider, ConvexReactClient } from "convex/react";
const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// In your root component
<ConvexProvider client={convex}>
  <App />
</ConvexProvider>
```

### 2. Fetching Data (useQuery)
Queries are reactive. They update automatically when data changes.

```tsx
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const data = useQuery(api.myModule.myQuery, { arg1: "val" });
```

### 3. Modifying Data (useMutation)
Mutations are used to change data in the database.

```tsx
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const createItem = useMutation(api.myModule.createItem);
// Usage: await createItem({ name: "New Item" });
```

### 4. Calling Actions (useAction)
Actions are for side effects (API calls, etc.).

```tsx
import { useAction } from "convex/react";
import { api } from "../convex/_generated/api";

const runAction = useAction(api.myModule.myAction);
```

## Best Practices
- **Strict Types:** Always use the generated `api` object for type safety.
- **Conditional Loading:** Use the `"skip"` argument in `useQuery` for conditional fetching.
- **Optimistic Updates:** Implement optimistic updates for a smoother UI.
- **Error Handling:** Always wrap mutations and actions in `try/catch` or use `.catch()`.

## Directory Structure
- `convex/`: Backend functions and schema.
- `convex/schema.ts`: Database schema definition.
- `convex/_generated/`: Auto-generated API and types.
- `src/`: React frontend.
