declare module 'data-structures-lib' {
  export class Graph<T = any> {
    constructor();
    addVertex(vertex: T): void;
    addEdge(from: T, to: T, weight?: number): void;
    removeVertex(vertex: T): void;
    removeEdge(from: T, to: T): void;
    getVertices(): T[];
    getEdges(): Array<{ from: T; to: T; weight?: number }>;
    hasVertex(vertex: T): boolean;
    hasEdge(from: T, to: T): boolean;
    getNeighbors(vertex: T): T[];
    getWeight(from: T, to: T): number | undefined;
    clear(): void;
    size(): number;
    isEmpty(): boolean;
    toString(): string;
  }

  export class PriorityQueue<T> {
    constructor(comparator?: (a: T, b: T) => number);
    enqueue(item: T): void;
    dequeue(): T | undefined;
    peek(): T | undefined;
    size(): number;
    isEmpty(): boolean;
    clear(): void;
  }

  export function dijkstra<T>(graph: Graph<T>, start: T, end: T): { path: T[]; distance: number } | null;
  export function bfs<T>(graph: Graph<T>, start: T): T[];
  export function dfs<T>(graph: Graph<T>, start: T): T[];
} 