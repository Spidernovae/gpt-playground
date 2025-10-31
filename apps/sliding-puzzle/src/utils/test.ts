import { GraphTest } from 'data-structures-lib';

export function run() {
    const graph = new GraphTest()
    graph.addEdge(1, 2)
    graph.addEdge(1, 3)
    graph.addEdge(1, 5)
    graph.addEdge(2, 3)
    graph.addEdge(2, 5)
    graph.addEdge(3, 4)
    graph.addEdge(4, 6)
    graph.addEdge(4, 7)
    graph.addEdge(5, 6)
    // graph.dfs()
    const [bfs, dfs] = [graph.bfs(), graph.dfs()]
    console.log(bfs, dfs)
}

// 1 -> 2,3,5
// 2 -> 3, 5
// 3 -> 4
// 4 -> 6, 7
// 5 -> 6