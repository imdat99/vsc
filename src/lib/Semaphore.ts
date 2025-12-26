export class Semaphore {
  private max: number
  private current = 0
  private queue: Array<() => void> = []

  constructor(max: number) {
    this.max = max
  }

  acquire(): Promise<void> {
    return new Promise(resolve => {
      if (this.current < this.max) {
        this.current++
        resolve()
      } else {
        this.queue.push(resolve)
      }
    })
  }

  release() {
    this.current--
    if (this.queue.length > 0) {
      this.current++
      const next = this.queue.shift()
      next?.()
    }
  }
}
