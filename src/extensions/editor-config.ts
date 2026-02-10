import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { ReactNodeViewRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { Markdown } from 'tiptap-markdown'

import CodeBlockComponent from '../components/CodeBlockComponent'
import { SlashCommand, suggestion } from './slash-command'

const lowlight = createLowlight(common)

export const editorExtensions = [
    Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: false,
        breaks: true,
        linkify: true,
    }),
    StarterKit.configure({
        codeBlock: false,
        heading: false,
    }),
    Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
            class: 'heading',
        },
    }).extend({
        addAttributes() {
            return {
                ...this.parent?.(),
                id: {
                    default: null,
                    parseHTML: (element: HTMLElement) => element.getAttribute('id'),
                    renderHTML: (attributes: { id?: string }) => {
                        if (!attributes.id) {
                            return {}
                        }
                        return { id: attributes.id }
                    },
                },
            }
        },
    }),
    Placeholder.configure({
        placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
                return 'Heading'
            }
            return "Type '/' for commands, or start writing..."
        },
    }),
    CodeBlockLowlight.extend({
        addNodeView() {
            return ReactNodeViewRenderer(CodeBlockComponent)
        },
    }).configure({
        lowlight,
        defaultLanguage: 'javascript',
    }),
    Underline,
    Link.configure({
        openOnClick: false,
    }),
    SlashCommand.configure({
        suggestion,
    }),
]
