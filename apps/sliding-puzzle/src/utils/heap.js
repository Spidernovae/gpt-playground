class MaxHeap {
    constructor() {
      this.heap = []
    }

    add(el) {
      const heap = this.heap
      heap.push(el)

      if (heap.length > 0) {
        let currentIndex = heap.length - 1
        do {
            const parentIndex = Math.floor((currentIndex - 1) / 2)
            if (heap[currentIndex] > heap[parentIndex]) {
                [heap[currentIndex], heap[parentIndex]] = [
                    heap[parentIndex], heap[currentIndex]
                ]
            }
            currentIndex = Math.floor(currentIndex / 2)
        } while (currentIndex !== 0)
      }
    }

    _bubbleDown(index) {
      const heap = this.heap;
      const length = heap.length;

      while (true) {
        const left = 2 * index + 1;
        const right = 2 * index + 2;
        let largest = index;

        if (left < length && heap[left] > heap[largest]) {
            largest = left;
        }

        if (right < length && heap[right] > heap[largest]) {
            largest = right;
        }

        if (largest === index) break;

        [heap[index], heap[largest]] = [heap[largest], heap[index]];
        index = largest;
      }
    }

    pop() {
      const heap = this.heap;
      if (heap.length === 0) return -1;
      if (heap.length === 1) return heap.pop();

      const max = heap[0];
      heap[0] = heap.pop(); // Move last element to root
      this._bubbleDown(0);

      return max;
    }
}

const heap = new MaxHeap()
heap.add(2)
heap.add(1)
heap.add(5)
heap.add(3)
heap.add(8)
heap.add(9)
console.log(heap.pop())
console.log(heap.pop())
console.log(heap.pop())
console.log(heap.pop())

