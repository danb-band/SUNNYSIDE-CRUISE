---
name: sunnyside-feature
description: >
  Guide for adding a new domain feature to apps/assassin in the SUNNYSIDE-CRUISE project.
  Apply this skill whenever a new feature, domain, or module needs to be built inside the
  features/ directory — following the project's layered architecture:
  schema → repository → service → actions → queries/mutations → hooks.
  Use this skill for requests like "add a new feature", "create a new domain", "build a feature
  for X", "add a feature folder", or any request that involves creating files under src/features/.
---

# SUNNYSIDE-CRUISE Feature Creation Guide

## Project Context

- **App**: `apps/assassin` (Next.js 16, React 19, TypeScript)
- **Stack**: Supabase Auth + Prisma ORM + TanStack Query + Zod + Tailwind CSS + Radix UI
- **Feature location**: `apps/assassin/src/features/<featureName>/`
- **Path aliases**: `@libs/...` → `src/libs/`, `@features/...` → `src/features/`

---

## Directory Structure

```
features/<featureName>/
├── schema.ts          1. Zod schemas & TypeScript types
├── repository.ts      2. Prisma DB access (pure queries only)
├── service.ts         3. Business logic
├── actions.ts         4. Next.js Server Actions ("use server")
├── queries/
│   ├── keys.ts        5. TanStack Query key factory
│   └── use<Name>.ts   6. useQuery hooks
├── mutations/
│   └── use<Name>.ts   7. useMutation hooks (with optimistic updates)
└── hooks/
    └── use<Name>.ts   8. Composed hooks combining queries + mutations
```

Skip layers that aren't needed — a read-only feature doesn't need `mutations/`, for example.

---

## Layer Rules

### 1. schema.ts — Zod Schemas & Types

Define schemas that mirror the Prisma model, plus any view models (e.g., join results the UI needs). Export TypeScript types via `z.infer`.

```ts
import * as z from "zod";

export const exampleSchema = z.object({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Example = z.infer<typeof exampleSchema>;
```

### 2. repository.ts — DB Access

Pure Prisma queries — no business logic here. Group functions in an object and use a default export. This keeps imports clean and makes it easy to mock in tests.

```ts
import { prisma } from "@libs/prisma/client";

async function findById(id: string) {
  return prisma.example.findUnique({ where: { id } });
}

const ExampleRepository = { findById };
export default ExampleRepository;
```

### 3. service.ts — Business Logic

Orchestrate repository calls and apply domain rules. Use `safeParse` to validate DB results before returning typed data — this catches schema drift early.

```ts
import ExampleRepository from "./repository";
import { exampleSchema } from "./schema";
import type { Example } from "./schema";

const getById = async (id: string): Promise<Example | null> => {
  const raw = await ExampleRepository.findById(id);
  if (!raw) return null;
  const parsed = exampleSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
};

const ExampleService = { getById };
export default ExampleService;
```

### 4. actions.ts — Server Actions

Add `"use server"` at the top. Always authenticate with `getCurrentUser()` — never accept `userId` from the client. Call `revalidatePath()` after mutations to invalidate the Next.js cache.

Name actions as `<verb><Entity>Action`.

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@libs/supabase/auth";
import ExampleService from "./service";

export const getExampleAction = async (id: string) => {
  return ExampleService.getById(id);
};

export const createExampleAction = async (data: CreateExampleInput) => {
  const user = await getCurrentUser();
  const result = await ExampleService.create(data, user.id);
  revalidatePath("/example");
  return result;
};
```

### 5. queries/keys.ts — Query Key Factory

Use `as const` to keep types narrow. Structure keys hierarchically from broad to specific — this makes targeted cache invalidation easy.

```ts
export const exampleKeys = {
  all: ["example"] as const,
  byId: (id: string) => [...exampleKeys.all, "byId", id] as const,
  byUser: (userId: string) => [...exampleKeys.all, "byUser", userId] as const,
};
```

### 6. queries/use\<Name\>.ts — useQuery Hooks

Use the Server Action as `queryFn`. Set `staleTime` to avoid unnecessary refetches — `1000 * 60` (1 minute) is a reasonable default.

```ts
import { useQuery } from "@tanstack/react-query";
import { getExampleAction } from "../actions";
import { exampleKeys } from "./keys";

export const useExample = (id: string) => {
  return useQuery({
    queryKey: exampleKeys.byId(id),
    queryFn: () => getExampleAction(id),
    staleTime: 1000 * 60,
  });
};
```

### 7. mutations/use\<Name\>.ts — useMutation Hooks

Apply optimistic updates when it meaningfully improves perceived performance. The pattern: `onMutate` updates the cache immediately, `onError` rolls back, `onSuccess` invalidates to sync with the server.

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExampleAction } from "../actions";
import { exampleKeys } from "../queries/keys";

export const useCreateExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExampleAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.all });
    },
  });
};
```

### 8. hooks/use\<Name\>.ts — Composed Hooks

Combine queries, mutations, and derived state into a single interface. Components should import from this layer — not directly from `queries/` or `mutations/`. This keeps components thin and makes logic reusable.

```ts
import { useExample } from "../queries/useExample";
import { useCreateExample } from "../mutations/useCreateExample";

export const useExampleLogic = (id: string) => {
  const { data: example, isLoading } = useExample(id);
  const { mutate: create, isPending } = useCreateExample();

  return { example, isLoading, create, isPending };
};
```

---

## Implementation Checklist

Work through layers in order — each layer depends on the one before it.

```
[ ] 1. Confirm the Prisma model exists (if not, a migration is needed first)
[ ] 2. schema.ts — define Zod schemas and export types
[ ] 3. repository.ts — write Prisma queries
[ ] 4. service.ts — implement business logic
[ ] 5. actions.ts — write Server Actions
[ ] 6. queries/keys.ts — define query key factory
[ ] 7. queries/use*.ts — write useQuery hooks
[ ] 8. mutations/use*.ts — write useMutation hooks (if needed)
[ ] 9. hooks/use*.ts — write composed hooks (if needed)
[ ] 10. Use the composed hook in your component
```

---

## Important Notes

- **Prisma model names** come from `apps/assassin/src/generated/prisma/client` — never edit this directory manually.
- **Authentication in actions**: always call `getCurrentUser()` server-side. Never trust a `userId` passed from the client.
- **New Prisma models**: if the feature needs a new DB table, modify `apps/assassin/prisma/schema.prisma` and run a migration separately — that's outside this skill's scope.
- **Component files**: place in `src/features/<name>/` for feature-specific components, or `src/components/` for shared UI.
