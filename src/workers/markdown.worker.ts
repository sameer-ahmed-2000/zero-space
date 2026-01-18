import { marked } from 'marked';
import { defaultMarkdownParser } from 'prosemirror-markdown';

function createCodeBlock(text: string, attrs: any) {
    return {
        type: 'codeBlock',
        attrs: attrs,
        content: [{ type: 'text', text: text }]
    }
}

function transformNode(node: any): any | any[] {
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

    // Split huge code blocks to prevent rendering freeze
    if (newNode.type === 'codeBlock') {
        let text = ''
        if (newNode.content) {
            text = newNode.content.map((n: any) => n.text).join('')
        }

        if (text.length > 5000) {
            const lines = text.split('\n')
            const chunks: any[] = []
            let currentChunkText = ''

            for (const line of lines) {
                if (currentChunkText.length + line.length > 5000) {
                    chunks.push(createCodeBlock(currentChunkText, newNode.attrs))
                    currentChunkText = ''
                }
                currentChunkText += line + '\n'
            }
            if (currentChunkText) chunks.push(createCodeBlock(currentChunkText, newNode.attrs))

            return chunks
        }
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
        newNode.content = newNode.content.flatMap(transformNode)
    }

    return newNode
}

self.onmessage = async (event: MessageEvent) => {
    const { id, type, payload } = event.data

    try {
        let result

        switch (type) {
            case 'PARSE_MARKDOWN':
                // marked.parse can be async if using async extensions, but usually sync/promise
                result = await marked.parse(payload as string)
                break

            case 'PARSE_MARKDOWN_JSON':
                const doc = defaultMarkdownParser.parse(payload as string)
                const json = doc?.toJSON()

                if (json) {
                    result = transformNode(json)
                } else {
                    result = null
                }
                break

            case 'STRINGIFY_CONTENT':
                result = JSON.stringify(payload)
                break

            case 'PARSE_JSON':
                result = JSON.parse(payload)
                break

            default:
                throw new Error(`Unknown message type: ${type}`)
        }

        self.postMessage({ id, type: `${type}_RESULT`, payload: result })
    } catch (error: any) {
        self.postMessage({
            id,
            error: error.message || 'Unknown worker error'
        })
    }
}
