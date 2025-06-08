# GPT Playground Monorepo

This repository contains a collection of small Vue 3 + TypeScript applications. The projects are managed with Yarn workspaces. Yarn v4 uses Plug'n'Play which means `node_modules` are not generated after `yarn install` — dependencies are stored inside the `.yarn` folder instead.

## Getting Started

Using the provided `Makefile` simplifies common tasks:

```bash
# install dependencies for all apps
make setup

# run the sliding puzzle app
make sliding-puzzle

# run the solar system demo
make solar-system
```

You can still run the underlying Yarn commands directly if you prefer.

## Apps

- **sliding-puzzle** – 15‑puzzle game implemented with Vue 3.
- **solar-system** – interactive 3D solar system demo built with Three.js.
