import { Editor } from '@tiptap/react'
import { useEffect, useRef, useState } from 'react'

interface Command {
    title: string
    description: string
    keywords: string[]
    action: (editor: Editor) => void
}

const commands: Command[] = [
    {
        title: 'Text',
        description: 'Start writing with plain text',
        keywords: ['text', 'paragraph', 'p'],
        action: (editor) => editor.chain().focus().setParagraph().run(),
    },
    {
        title: 'Heading 1',
        description: 'Big section heading',
        keywords: ['h1', 'heading', 'title'],
        action: (editor) => editor.chain().focus().setHeading({ level: 1 }).run(),
    },
    {
        title: 'Heading 2',
        description: 'Medium section heading',
        keywords: ['h2', 'heading', 'subtitle'],
        action: (editor) => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
        title: 'Heading 3',
        description: 'Small section heading',
        keywords: ['h3', 'heading'],
        action: (editor) => editor.chain().focus().setHeading({ level: 3 }).run(),
    },
    {
        title: 'Bullet List',
        description: 'Create a simple bulleted list',
        keywords: ['bullet', 'list', 'ul'],
        action: (editor) => editor.chain().focus().toggleBulletList().run(),
    },
    {
        title: 'Numbered List',
        description: 'Create a list with numbering',
        keywords: ['number', 'list', 'ol', 'ordered'],
        action: (editor) => editor.chain().focus().toggleOrderedList().run(),
    },
    {
        title: 'Quote',
        description: 'Capture a quote',
        keywords: ['quote', 'blockquote'],
        action: (editor) => editor.chain().focus().setBlockquote().run(),
    },
    {
        title: 'Code Block',
        description: 'Capture a code snippet',
        keywords: ['code', 'codeblock'],
        action: (editor) => editor.chain().focus().setCodeBlock().run(),
    },
    {
        title: 'Divider',
        description: 'Visually divide blocks',
        keywords: ['divider', 'hr', 'line', 'horizontal'],
        action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    },
]

interface UseSlashCommandsProps {
    editor: Editor | null
}

export function useSlashCommands({ editor }: UseSlashCommandsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const slashPosRef = useRef<number | null>(null)
    const isOpenRef = useRef(false)
    const queryRef = useRef('')

    // Keep refs in sync
    useEffect(() => {
        isOpenRef.current = isOpen
        queryRef.current = query
    }, [isOpen, query])

    const filteredCommands = commands.filter((cmd) => {
        if (!query) return true
        const searchTerm = query.toLowerCase()
        return (
            cmd.title.toLowerCase().includes(searchTerm) ||
            cmd.description.toLowerCase().includes(searchTerm) ||
            cmd.keywords.some((k) => k.includes(searchTerm))
        )
    })

    useEffect(() => {
        if (!editor) return

        const handleUpdate = () => {
            const { state } = editor
            const { selection } = state
            const { $from } = selection

            // Get current line text
            const currentText = $from.parent.textContent
            const cursorPos = $from.parentOffset

            // Early return for performance - skip if menu closed and no slash
            if (!isOpen && !currentText.includes('/')) {
                return
            }

            // Only trigger if user just typed "/" (not on new line or existing text)
            if (!isOpen) {
                // Check if the character just before cursor is "/"
                const charBeforeCursor = currentText.charAt(cursorPos - 1)
                // Only open if line is reasonable length (prevents opening on paste)
                if (charBeforeCursor === '/' && currentText.length < 100) {
                    const coords = editor.view.coordsAtPos($from.pos)
                    setPosition({ top: coords.bottom + 5, left: coords.left })
                    setIsOpen(true)
                    setQuery('')
                    setSelectedIndex(0)
                    slashPosRef.current = $from.pos - 1
                }
            } else if (isOpen && slashPosRef.current !== null) {
                // Menu is already open, update query
                const slashStillExists = currentText.includes('/')

                if (slashStillExists) {
                    // Find the slash position and extract text after it
                    const slashIndex = currentText.lastIndexOf('/')
                    const textAfterSlash = currentText.substring(slashIndex + 1)
                    setQuery(textAfterSlash)

                    // Update position if cursor moved
                    const coords = editor.view.coordsAtPos($from.pos)
                    setPosition({ top: coords.bottom + 5, left: coords.left })
                } else {
                    // Slash was deleted, close menu
                    setIsOpen(false)
                    slashPosRef.current = null
                    setQuery('')
                }
            }
        }

        // Throttle updates to prevent performance issues
        let updateTimeout: NodeJS.Timeout | null = null
        const throttledUpdate = () => {
            if (updateTimeout) return
            updateTimeout = setTimeout(() => {
                handleUpdate()
                updateTimeout = null
            }, 16) // ~60fps
        }

        editor.on('update', throttledUpdate)

        return () => {
            editor.off('update', throttledUpdate)
            if (updateTimeout) clearTimeout(updateTimeout)
        }
    }, [editor])

    const executeCommand = (command: Command) => {
        if (!editor || slashPosRef.current === null) return

        // Delete the "/" and query text
        const { state } = editor
        const { selection } = state
        const queryLength = query.length

        editor
            .chain()
            .focus()
            .deleteRange({
                from: slashPosRef.current,
                to: selection.from,
            })
            .run()

        // Execute the command
        command.action(editor)

        setIsOpen(false)
        slashPosRef.current = null
        setQuery('')
    }

    const handleKeyDown = (event: KeyboardEvent) => {
        if (!isOpen) return false

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectedIndex((prev) => (prev + 1) % filteredCommands.length)
            return true
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectedIndex(
                (prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length
            )
            return true
        }

        if (event.key === 'Enter') {
            event.preventDefault()
            if (filteredCommands[selectedIndex]) {
                executeCommand(filteredCommands[selectedIndex])
            }
            return true
        }

        if (event.key === 'Escape') {
            event.preventDefault()
            setIsOpen(false)
            slashPosRef.current = null
            return true
        }

        return false
    }

    useEffect(() => {
        const handler = (e: KeyboardEvent) => handleKeyDown(e)
        if (isOpen) {
            document.addEventListener('keydown', handler)
            return () => document.removeEventListener('keydown', handler)
        }
    }, [isOpen, selectedIndex, filteredCommands])

    return {
        isOpen,
        commands: filteredCommands,
        selectedIndex,
        position,
        executeCommand,
        setSelectedIndex,
    }
}
