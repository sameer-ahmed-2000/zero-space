import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import 'tippy.js/dist/tippy.css'

// Simple slash command plugin
export const SlashCommandExtension = Extension.create({
    name: 'slashCommand',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('slashCommand'),
                props: {
                    handleKeyDown(view, event) {
                        // This is a simplified version - you can enhance it
                        return false
                    },
                },
            }),
        ]
    },
})
