# Thunderstore UI

Monorepo containing Next.js frontend for [thunderstore.io](https://thunderstore.io)
and reusable UI components.

## Monorepo Setup

- [`yarn` workspaces](https://classic.yarnpkg.com/en/docs/workspaces/) manages
  the packages in the monorepo (see `packages` key in base `package.json` file)
  and handles dependency installation/deduplication.
- [`preconstruct`](https://preconstruct.tools/) automates building and linking
  the packages within the monorepo. Instead of using relative paths, local
  packages can be imported as if they were installed via a package manager.
  - Packages can be linked locally by running `yarn preconstruct dev`, but this
    is handled automatically by `postinstall` hook, so developers don't need to
    worry about it.

```
// first time setup
git clone git@github.com:thunderstore-io/thunderstore-ui.git thunderstore-ui
cd thunderstore-ui
yarn install

// start Next.js dev server
yarn workspace @thunderstore/nextjs dev
```

That's it. Changes done to `apps/nextjs` and `packages/components` should both
be automatically visible at [http://localhost:3000/].

### Adding dependencies

To add new dependencies to existing packages, simply run something like:

```
yarn workspace @thunderstore/components add react-table @types/react-table
```

### Adding a new package

To add a completely new package, start by creating the following file structure:

```
// packages/greeter/package.json:
{
  "name": "@thunderstore/greeter",
  "version": "1.0.0",
  "description": "Example package"
}

// packages/greeter/src/index.tsx:
import React from "react";

export const Greeter: React.FC = () => <p>Hello, world!</p>;
```

To add some required fields to the new package's `package.json`, run
`yarn preconstruct init` and allow modifying `package.json` when asked.

To install dependencies, if any, run e.g.
`yarn workspace @thunderstore/greeter add react react-dom @types/react`.

To "install" the new package to Next.js app, update the `dependencies` section
in `apps/nextjs/package.json` with `"@thunderstore/greeter": "^1.0.0",`.

Then run `yarn` one more time to let Preconstruct work its magic. After that the
new package should be usable in the Next.js app by simply importing it:

```
import { Greeter } from "@thunderstore/greeter";
```

### About VS Code...

VS Code may have problem detecting installed packages in this monorepo/workspace
setup. Installing
[Monorepo Workspace extension](https://marketplace.visualstudio.com/items?itemName=folke.vscode-monorepo-workspace)
may solve them.