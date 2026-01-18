import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet } from '@tiptap/pm/view'

export interface CommandsOptions {
    onShow?: () => void
    onHide?: () => void
    onUpdate?: (query: string) => void
}

export const Commands = Extension.create<CommandsOptions>({
    name: 'commands',

    addOptions() {
        return {
            onShow: undefined,
            onHide: undefined,
            onUpdate: undefined,
        }
    },

    addProseMirrorPlugins() {
        const { editor } = this

        return [
            new Plugin({
                key: new PluginKey('commands'),

                state: {
                    init() {
                        return {
                            active: false,
                            range: null,
                            query: '',
                        }
                    },

                    apply(tr, prev) {
                        const { selection } = tr
                        const next = { ...prev }

                        // Check if we should activate
                        const { $from } = selection
                        const textBefore = $from.nodeBefore?.text || ''

                        if (textBefore.endsWith('/')) {
                            next.active = true
                            next.range = {
                                from: $from.pos - 1,
                                to: $from.pos,
                            }
                            next.query = ''
                        } else if (prev.active && textBefore.includes('/')) {
                            const slashIndex = textBefore.lastIndexOf('/')
                            next.query = textBefore.substring(slashIndex + 1)
                        } else if (prev.active) {
                            next.active = false
                            next.range = null
                            next.query = ''
                        }

                        return next
                    },
                },

                props: {
                    decorations(state) {
                        return DecorationSet.empty
                    },

                    handleKeyDown(view, event) {
                        // Let the menu handle arrow keys and enter
                        return false
                    },
                },
            }),
        ]
    },
})
