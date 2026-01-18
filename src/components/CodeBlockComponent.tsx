import { NodeViewContent, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

export interface CodeBlockComponentProps {
    node: {
        attrs: any
        textContent: string
    }
    updateAttributes: (attrs: any) => void
    extension: any
}

export default function CodeBlockComponent({ node, updateAttributes, extension }: CodeBlockComponentProps) {
    const [copied, setCopied] = useState(false)
    const [isVisible, setIsVisible] = useState(false)
    const wrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true)
                observer.disconnect()
            }
        }, { rootMargin: '100px' })

        if (wrapperRef.current) {
            observer.observe(wrapperRef.current)
        }

        return () => {
            observer.disconnect()
        }
    }, [])

    const copyToClipboard = () => {
        const text = node.textContent || ''
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }).catch(err => {
            console.error('Failed to copy: ', err)
        })
    }

    return (
        <NodeViewWrapper className="code-block-wrapper relative group">
            {/* Observation target */}
            <div ref={wrapperRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />

            {isVisible && (
                <button
                    className={`copy-code-button ${copied ? 'copied' : ''}`}
                    onClick={copyToClipboard}
                    contentEditable={false}
                    type="button"
                    aria-label="Copy code"
                >
                    {copied ? (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            <span>Copied!</span>
                        </>
                    ) : (
                        <>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            <span>Copy</span>
                        </>
                    )}
                </button>
            )}

            <pre>
                <NodeViewContent as="code" />
            </pre>
        </NodeViewWrapper>
    )
}
