
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { FileText } from 'lucide-react'

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        subPage: {
            insertSubPage: (attributes: { id: string, title: string }) => ReturnType
        }
    }
}

export const SubPage = Node.create({
    name: 'subPage',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            id: {
                default: null,
            },
            title: {
                default: 'Untitled',
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-type="sub-page"]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'sub-page' })]
    },

    addCommands() {
        return {
            insertSubPage: (attributes) => ({ commands }) => {
                return commands.insertContent({
                    type: this.name,
                    attrs: attributes,
                })
            },
        }
    },

    addNodeView() {
        return ReactNodeViewRenderer(SubPageNodeView)
    },
})

function SubPageNodeView({ node, extension, editor }: any) {
    const { id, title } = node.attrs

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Call the onNavigate callback if provided in extension options
        const onNavigate = extension.options.onNavigate
        if (onNavigate) {
            onNavigate(id)
        }
    }

    return (
        <NodeViewWrapper>
            <div 
                data-type="sub-page"
                className="group flex items-center gap-3 px-3 py-3 my-1 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50 cursor-pointer transition-all duration-200"
                onClick={handleClick}
            >
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {title || 'Untitled'}
                    </div>
                </div>
            </div>
        </NodeViewWrapper>
    )
}
