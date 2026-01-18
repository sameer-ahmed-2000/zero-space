import { WorkerManager } from './workerManager'

describe('WorkerManager', () => {
    it('should fall back to main thread when worker is not available', async () => {
        // Mock window.Worker to be undefined or throw to force fallback
        const originalWorker = global.Worker
        // @ts-ignore
        delete global.Worker

        const manager = new WorkerManager()
        const result = await manager.stringifyContent({ test: 'data' })
        expect(result).toBe('{"test":"data"}')

        // Restore
        global.Worker = originalWorker
    })

    it('should parse JSON using fallback', async () => {
        const originalWorker = global.Worker
        // @ts-ignore
        delete global.Worker

        const manager = new WorkerManager()
        const result = await manager.parseJson('{"test":"data"}')
        expect(result).toEqual({ test: 'data' })

        global.Worker = originalWorker
    })
})
