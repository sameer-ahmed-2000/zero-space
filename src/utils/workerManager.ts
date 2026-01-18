export type WorkerMessage =
    | { type: 'PARSE_MARKDOWN'; payload: string }
    | { type: 'PARSE_MARKDOWN_JSON'; payload: string }
    | { type: 'STRINGIFY_CONTENT'; payload: any }
    | { type: 'PARSE_JSON'; payload: string }

export type WorkerResponse =
    | { type: 'PARSE_MARKDOWN_RESULT'; payload: string } // HTML string
    | { type: 'PARSE_MARKDOWN_JSON_RESULT'; payload: any }
    | { type: 'STRINGIFY_CONTENT_RESULT'; payload: string }
    | { type: 'PARSE_JSON_RESULT'; payload: any }
    | { type: 'ERROR'; payload: string }

export class WorkerManager {
    private worker: Worker | null = null
    private pendingPromises: Map<string, { resolve: (value: any) => void; reject: (reason: any) => void }> = new Map()

    constructor() {
        if (typeof window !== 'undefined') {
            this.initWorker()
        }
    }

    private initWorker() {
        try {
            this.worker = new Worker(new URL('../workers/markdown.worker.ts', import.meta.url))

            this.worker.onmessage = (event) => {
                const { id, type, payload, error } = event.data

                if (id && this.pendingPromises.has(id)) {
                    const { resolve, reject } = this.pendingPromises.get(id)!
                    if (error) {
                        reject(new Error(error))
                    } else {
                        resolve(payload)
                    }
                    this.pendingPromises.delete(id)
                }
            }

            this.worker.onerror = (error) => {
                console.error('Worker error:', error)
            }
        } catch (e) {
            console.error('Failed to initialize worker:', e)
        }
    }

    public async parseMarkdown(markdown: string): Promise<string> {
        return this.postMessage('PARSE_MARKDOWN', markdown)
    }

    public async parseMarkdownToJson(markdown: string): Promise<any> {
        return this.postMessage('PARSE_MARKDOWN_JSON', markdown)
    }

    public async stringifyContent(content: any): Promise<string> {
        return this.postMessage('STRINGIFY_CONTENT', content)
    }

    public async parseJson(jsonString: string): Promise<any> {
        return this.postMessage('PARSE_JSON', jsonString)
    }

    private postMessage(type: WorkerMessage['type'], payload: any): Promise<any> {
        if (!this.worker) {
            // Fallback for when worker is not available (e.g. server-side or failed init)
            console.warn('Worker not available, falling back to main thread')
            return this.fallback(type, payload)
        }

        const id = Math.random().toString(36).substring(7)

        return new Promise((resolve, reject) => {
            this.pendingPromises.set(id, { resolve, reject })
            this.worker!.postMessage({ id, type, payload })

            // Timeout fallback
            setTimeout(() => {
                if (this.pendingPromises.has(id)) {
                    this.pendingPromises.delete(id)
                    reject(new Error('Worker timeout'))
                }
            }, 30000)
        })
    }

    private async fallback(type: WorkerMessage['type'], payload: any): Promise<any> {
        // Dynamic import to avoid bundling marked on server if not needed, 
        // though this runs on client mostly.
        switch (type) {
            case 'PARSE_MARKDOWN':
                const { marked } = await import('marked')
                return marked.parse(payload as string)
            case 'PARSE_MARKDOWN_JSON':
                const { defaultMarkdownParser } = await import('prosemirror-markdown')
                const doc = defaultMarkdownParser.parse(payload as string)
                const json = doc?.toJSON()
                return json ? this.transformNode(json) : null
            case 'STRINGIFY_CONTENT':
                return JSON.stringify(payload)
            case 'PARSE_JSON':
                return JSON.parse(payload)
            default:
                throw new Error(`Unknown message type: ${type}`)
        }
    }

    private transformNode(node: any): any {
        if (!node) return node

        // Copy the node to avoid mutating original
        const newNode = { ...node }

        // Map types
        switch (newNode.type) {
            case 'bullet_list': newNode.type = 'bulletList'; break;
            case 'ordered_list': newNode.type = 'orderedList'; break;
            case 'list_item': newNode.type = 'listItem'; break;
            case 'code_block': newNode.type = 'codeBlock'; break;
            case 'hard_break': newNode.type = 'hardBreak'; break;
            case 'horizontal_rule': newNode.type = 'horizontalRule'; break;
        }

        if (newNode.marks && Array.isArray(newNode.marks)) {
            newNode.marks = newNode.marks.map((mark: any) => {
                const newMark = { ...mark }
                if (newMark.type === 'strong') newMark.type = 'bold'
                if (newMark.type === 'em') newMark.type = 'italic'
                return newMark
            })
        }

        if (newNode.content && Array.isArray(newNode.content)) {
            newNode.content = newNode.content.map((child: any) => this.transformNode(child))
        }

        return newNode
    }

    public terminate() {
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
    }
}

export const workerManager = new WorkerManager()
