export class Graph<T> {
  private adj = new Map<T, Set<T>>();

  addNode(value: T): void {
    if (!this.adj.has(value)) {
      this.adj.set(value, new Set());
    }
  }

  addEdge(from: T, to: T): void {
    this.addNode(from);
    this.addNode(to);
    this.adj.get(from)!.add(to);
  }

  neighbors(node: T): T[] {
    return Array.from(this.adj.get(node) || []);
  }

  bfs(start: T, visit: (node: T) => void): void {
    const visited = new Set<T>();
    const queue: T[] = [start];
    visited.add(start);
    while (queue.length) {
      const node = queue.shift()!;
      visit(node);
      for (const neighbor of this.neighbors(node)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  dfs(start: T, visit: (node: T) => void): void {
    const visited = new Set<T>();
    const stack: T[] = [start];
    while (stack.length) {
      const node = stack.pop()!;
      if (visited.has(node)) continue;
      visited.add(node);
      visit(node);
      const neighbors = this.neighbors(node);
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }
}
