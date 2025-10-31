export class GraphTest<T> {
  private adj = new Map<T, Set<T>>();

  addEdge(start: T, end: T) {
    if (!this.adj.has(start)) {
      this.adj.set(start, new Set<T>());
    }
    this.adj.get(start)?.add(end);
  }

  private dfsUtil(node: T, visited: Map<T, Boolean>, result: T[]) {
    // Mark as visited first to prevent infinite loops
    visited.set(node, true);
    result.push(node); // Add to result array instead of console.log
    
    const children = this.adj.get(node);
    if (children && children.size > 0) {
      for (let child of children) {
        if (!visited.get(child)) {
          this.dfsUtil(child, visited, result);
        }
      }
    }
  }

  dfs(): T[] {
    const visited = new Map<T, Boolean>();
    const result: T[] = [];
    this.adj.forEach((_, key) => visited.set(key, false));
    
    // Start DFS from each unvisited node (handles disconnected components)
    for (const [key] of this.adj.entries()) {
      if (!visited.get(key)) {
        this.dfsUtil(key, visited, result);
      }
    }
    
    return result;
  }

  bfs(): T[] {
    const visited = new Map<T, Boolean>();
    const result: T[] = [];
    const queue = new Array<T>();
    
    this.adj.forEach((_, key) => visited.set(key, false));
    
    // Start BFS from each unvisited node (handles disconnected components)
    for (const [key] of this.adj.entries()) {
      if (!visited.get(key)) {
        queue.push(key);
        visited.set(key, true);
        
        while (queue.length !== 0) {
          const current = queue.shift()!; // Remove and get the first element
          result.push(current); // Add to result array instead of console.log
          
          const children = this.adj.get(current);
          if (children && children.size > 0) {
            for (let child of children) {
              if (!visited.get(child)) {
                visited.set(child, true);
                queue.push(child);
              }
            }
          }
        }
      }
    }
    
    return result;
  }

  // Optional: Keep console.log versions for debugging
  dfsWithLog(): T[] {
    const result = this.dfs();
    console.log('DFS traversal:', result);
    return result;
  }

  bfsWithLog(): T[] {
    const result = this.bfs();
    console.log('BFS traversal:', result);
    return result;
  }
}

// 1 -> 2
// 1 -> 3
// 1 -> 2
// 1 -> 3