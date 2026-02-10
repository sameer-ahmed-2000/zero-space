
import { Extension } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import Suggestion from '@tiptap/suggestion'
import {
    CodeSquare,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    TextQuote
} from 'lucide-react'
import tippy from 'tippy.js'
import SlashCommandList from '../components/SlashCommandList'

const getSuggestionItems = ({ query }: { query: string }) => {
    return [
        // BASIC BLOCKS
        {
            title: 'Heading 1',
            description: 'Big section heading',
            searchTerms: ['h1', 'heading', 'title'],
            icon: Heading1,
            group: 'Basic Blocks',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
            },
        },
        {
            title: 'Heading 2',
            description: 'Medium section heading',
            searchTerms: ['h2', 'heading', 'subtitle'],
            icon: Heading2,
            group: 'Basic Blocks',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
            },
        },
        {
            title: 'Heading 3',
            description: 'Small section heading',
            searchTerms: ['h3', 'heading', 'subsubtitle'],
            icon: Heading3,
            group: 'Basic Blocks',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
            },
        },
        {
            title: 'Bullet List',
            description: 'Simple list',
            searchTerms: ['unordered', 'point'],
            icon: List,
            group: 'Basic Blocks',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run()
            },
        },
        {
            title: 'Numbered List',
            description: 'Ordered list',
            searchTerms: ['ordered'],
            icon: ListOrdered,
            group: 'Basic Blocks',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run()
            },
        },

        // CODE BLOCKS
        {
            title: 'Code Block',
            description: 'Syntax highlighted',
            searchTerms: ['codeblock'],
            icon: CodeSquare,
            group: 'Code Blocks',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
            },
        },

        // ADVANCED
        {
            title: 'Callout',
            description: 'Info/warning box',
            searchTerms: ['quote', 'callout'],
            icon: TextQuote,
            group: 'Advanced',
            command: ({ editor, range }: any) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run()
            },
        },
    ].filter(item => {
        if (typeof query === 'string' && query.length > 0) {
            const search = query.toLowerCase()
            return (
                item.title.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                (item.searchTerms && item.searchTerms.some((term: string) => term.includes(search)))
            )
        }
        return true
    })
}

export const SlashCommand = Extension.create({
    name: 'slashCommand',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})

export const suggestion = {
    items: getSuggestionItems,
    render: () => {
        let component: any
        let popup: any

        return {
            onStart: (props: any) => {
                component = new ReactRenderer(SlashCommandList, {
                    props,
                    editor: props.editor,
                })

                if (!props.clientRect) {
                    return
                }

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
            },

            onUpdate(props: any) {
                component.updateProps(props)

                if (!props.clientRect) {
                    return
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                })
            },

            onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                    popup[0].hide()

                    return true
                }

                return component.ref?.onKeyDown(props)
            },

            onExit() {
                popup[0].destroy()
                component.destroy()
            },
        }
    },
}
