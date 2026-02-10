import { useCallback, useState } from 'react'
import { TocItem } from '../types'
import { debounce } from '../utils/debounce'
import { runWhenIdle } from '../utils/idle'

export function useTableOfContents(editorRef: React.MutableRefObject<any>) {
    const [tocItems, setTocItems] = useState<TocItem[]>([])
    const [activeId, setActiveId] = useState<string>('')

    const extractHeadings = useCallback(() => {
        const editor = editorRef.current
        if (!editor) return

        const headings: TocItem[] = []
        const doc = editor.state.doc

        doc.descendants((node: any, pos: number) => {
            if (node.type.name === 'heading') {
                let id = node.attrs.id

                // Generate a new ID if one doesn't exist
                if (!id) {
                    id = `heading-${Math.random().toString(36).slice(2, 9)}`

                    if (editor.isEditable) {
                        editor.commands.setNodeSelection(pos)
                        editor.commands.updateAttributes('heading', { id })
                    }
                }

                const text = node.textContent
                const level = node.attrs.level

                headings.push({ id, text, level })
            }
        })

        setTocItems(headings)
    }, [])

    const debouncedExtractHeadings = useCallback(
        debounce(() => {
            runWhenIdle(extractHeadings)
        }, 1000),
        [extractHeadings]
    )


    return {
        tocItems,
        activeId,
        setActiveId,
        extractHeadings,
        debouncedExtractHeadings
    }
}
