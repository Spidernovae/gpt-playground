# Data Structures Library

This workspace provides reusable data structures written in TypeScript. It can be published as an npm package so it can be installed in other projects.

## Building the package

Compile the TypeScript sources to the `dist` directory:

```bash
# from the repository root
yarn workspace data-structures-lib build
```

## Usage

After publishing or building locally you can import the utilities:

```ts
import { PriorityQueue, Graph, range, zip } from 'data-structures-lib';

const pq = new PriorityQueue<number>();
pq.push(5);
pq.push(1);
console.log(pq.pop()); // 1

const graph = new Graph<string>();
graph.addEdge('A', 'B');
graph.bfs('A', console.log);
```

## Publishing to Artifactory

1. Ensure you have access to the Artifactory npm registry and have set your npm auth token with `npm adduser --registry <REGISTRY_URL>`.
2. Update the version number in `package.json`.
3. Publish the package specifying your Artifactory registry:

```bash
npm publish --registry <REGISTRY_URL>
```

Replace `<REGISTRY_URL>` with the URL of your Artifactory npm repository. Once published the package can be installed in another project with:

```bash
npm install data-structures-lib --registry <REGISTRY_URL>
```
