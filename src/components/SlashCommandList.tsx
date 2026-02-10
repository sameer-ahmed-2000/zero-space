
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface CommandItem {
    title: string
    description: string
    icon: React.ElementType
    command: ({ editor, range }: { editor: any, range: any }) => void
}

interface SlashCommandListProps {
    items: CommandItem[]
    command: (item: CommandItem) => void
    editor: any
    range: any
}

export const SlashCommandList = forwardRef((props: SlashCommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
    }

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length)
    }

    const enterHandler = () => {
        selectItem(selectedIndex)
    }

    useEffect(() => {
        setSelectedIndex(0)
    }, [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler()
                return true
            }

            if (event.key === 'ArrowDown') {
                downHandler()
                return true
            }

            if (event.key === 'Enter') {
                enterHandler()
                return true
            }

            return false
        },
    }))

    return (
        <div className="flex flex-col p-1.5 w-72 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        className={`flex items-center gap-3 px-3 py-2 text-sm text-left rounded-lg transition-all duration-150 group ${index === selectedIndex
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5'
                            }`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors border ${index === selectedIndex
                                ? 'bg-white dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30'
                                : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 group-hover:border-gray-300 dark:group-hover:border-zinc-600'
                            }`}>
                            <item.icon size={16} className={index === selectedIndex ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-500 dark:text-zinc-400'} />
                        </div>

                        <div className="flex flex-col flex-1 min-w-0">
                            <span className={`font-medium truncate ${index === selectedIndex ? 'text-blue-700 dark:text-blue-300' : 'text-zinc-900 dark:text-zinc-100'}`}>{item.title}</span>
                            <span className={`text-xs truncate ${index === selectedIndex ? 'text-blue-500/80 dark:text-blue-400/70' : 'text-zinc-500 dark:text-zinc-500'}`}>{item.description}</span>
                        </div>
                    </button>
                ))
            ) : (
                <div className="p-3 text-sm text-zinc-500 text-center italic">No commands found</div>
            )}
        </div>
    )
})

SlashCommandList.displayName = 'SlashCommandList'

export default SlashCommandList
