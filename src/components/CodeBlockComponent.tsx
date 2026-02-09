import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useCallback, useRef } from 'react'

export interface CodeBlockComponentProps {
    node: {
        attrs: any
        textContent: string
    }
    updateAttributes: (attrs: any) => void
    extension: any
}

export default function CodeBlockComponent({ node }: CodeBlockComponentProps) {
    const copiedRef = useRef<HTMLSpanElement>(null)

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(node.textContent || '')
        if (copiedRef.current) {
            copiedRef.current.style.opacity = '1'
            setTimeout(() => {
                if (copiedRef.current) {
                    copiedRef.current.style.opacity = '0'
                }
            }, 2000)
        }
    }, [node.textContent])

    return (
        <NodeViewWrapper className="code-block-wrapper group">
            <button
                className="copy-code-button"
                onClick={copyToClipboard}
                contentEditable={false}
                type="button"
            >
                Copy
                <span ref={copiedRef} className="copied-indicator">
                    ✓
                </span>
            </button>

            <pre>
                <NodeViewContent as="code" />
            </pre>
        </NodeViewWrapper>
    )
}
