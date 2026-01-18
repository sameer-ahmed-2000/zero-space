import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export const SlashCommands = Extension.create({
    name: 'slashCommands',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('slashCommands'),

                props: {
                    handleKeyDown: (view, event) => {
                        // This will be handled by React state
                        return false
                    },
                },
            }),
        ]
    },
})
