
import { BubbleMenu } from '@tiptap/react'
import {
    Bold,
    // Code icon removed
    CodeSquare,
    Heading1,
    Heading2,
    Italic,
    Link as LinkIcon,
    Strikethrough,
    Underline as UnderlineIcon
} from 'lucide-react'
import { useCallback } from 'react'

interface EditorMenusProps {
    editor: any
}

export default function EditorMenus({ editor }: EditorMenusProps) {
    if (!editor) return null

    const setLink = useCallback(() => {
        const previousUrl = editor.getAttributes('link').href
        const url = window.prompt('URL', previousUrl)

        // cancelled
        if (url === null) {
            return
        }

        // empty
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run()
            return
        }

        // update
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{ duration: 200, animation: 'shift-away', placement: 'top' }}
            className="flex items-center overflow-hidden bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200/50 dark:border-zinc-800/50 divide-x divide-gray-200/50 dark:divide-zinc-800/50 ring-1 ring-black/5"
        >
            <div className="flex items-center px-1 py-1 gap-1">
                {/* Formatting Group */}
                <MenuButton
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    icon={Bold}
                    label="Bold"
                />
                <MenuButton
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    icon={Italic}
                    label="Italic"
                />
                <MenuButton
                    isActive={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    icon={UnderlineIcon}
                    label="Underline"
                />
                <MenuButton
                    isActive={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    icon={Strikethrough}
                    label="Strike"
                />
                <MenuButton
                    isActive={editor.isActive('codeBlock')}
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    icon={CodeSquare}
                    label="Code Block"
                />
            </div>

            <div className="flex items-center px-1">
                <MenuButton
                    isActive={editor.isActive('link')}
                    onClick={setLink}
                    icon={LinkIcon}
                    label="Link"
                />
            </div>

            <div className="flex items-center px-1">
                <MenuButton
                    isActive={editor.isActive('heading', { level: 1 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    icon={Heading1}
                    label="H1"
                />
                <MenuButton
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    icon={Heading2}
                    label="H2"
                />
            </div>
        </BubbleMenu>
    )
}

function MenuButton({ isActive, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`p-1.5 min-w-[28px] flex items-center justify-center rounded-md text-sm transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 ${isActive
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
            title={label}
        >
            <Icon size={16} />
        </button>
    )
}
