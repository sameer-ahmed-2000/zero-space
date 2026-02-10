import { useState } from 'react'
import { workerManager } from '../utils/workerManager'

export function usePasteHandler(editorRef: React.MutableRefObject<any>) {
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStatus, setProcessingStatus] = useState('')
    const [processingProgress, setProcessingProgress] = useState(0)

    const yieldToMainThread = () =>
        new Promise<void>(resolve => {
            requestAnimationFrame(() => resolve())
        })

    const handlePaste = (view: any, event: ClipboardEvent) => {
        const text = event.clipboardData?.getData('text/plain')
        if (!text) return false

        // Small paste → let TipTap handle it normally
        if (text.length < 50000) {
            return false
        }

        event.preventDefault()

        setIsProcessing(true)
        setProcessingProgress(0)
        setProcessingStatus('Parsing markdown…')

            ; (async () => {
                try {
                    // 1️⃣ Parse markdown in worker
                    const json = await workerManager.parseMarkdownToJson(text)

                    if (!editorRef.current) return

                    const editor = editorRef.current
                    const nodes = json.content || []
                    const total = nodes.length

                    if (total === 0) {
                        setIsProcessing(false)
                        return
                    }

                    setProcessingStatus('Inserting content…')

                    // 2️⃣ Disable history (huge perf win)
                    editor.commands.setMeta('addToHistory', false)

                    // 3️⃣ Insert chunk-by-chunk
                    for (let i = 0; i < total; i++) {
                        editor.commands.insertContent(nodes[i], {
                            parseOptions: { preserveWhitespace: 'full' },
                        })

                        // 4️⃣ Progress update
                        if (i % 5 === 0 || i === total - 1) {
                            const percent = Math.round(((i + 1) / total) * 100)
                            setProcessingProgress(percent)
                            await yieldToMainThread()
                        }
                    }

                    // 5️⃣ Re-enable history
                    editor.commands.setMeta('addToHistory', true)

                    setProcessingStatus('Finalizing…')

                    // 6️⃣ Let layout + NodeViews settle
                    await yieldToMainThread()

                } catch (err) {
                    console.error('Large paste failed:', err)
                } finally {
                    setProcessingProgress(100)
                    setTimeout(() => {
                        setIsProcessing(false)
                        setProcessingStatus('')
                        setProcessingProgress(0)
                    }, 300)
                }
            })()

        return true
    }

    return {
        isProcessing,
        processingStatus,
        processingProgress,
        handlePaste
    }
}
