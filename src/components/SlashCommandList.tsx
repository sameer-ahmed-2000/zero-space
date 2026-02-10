
import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface CommandItem {
    title: string
    description: string
    icon: React.ElementType
    group: string
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
        <div className="flex flex-col p-2 w-[400px] bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-200">
            {props.items.length ? (
                <div className="max-h-[330px] overflow-y-auto pr-1 custom-scrollbar">
                    {props.items.map((item, index) => {
                        const isFirstInGroup = index === 0 || item.group !== props.items[index - 1].group

                        return (
                            <React.Fragment key={index}>
                                {isFirstInGroup && (
                                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 py-2 mt-2 first:mt-0 select-none">
                                        {item.group}
                                    </div>
                                )}
                                <button
                                    className={`flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-lg transition-all duration-150 group ${index === selectedIndex
                                            ? 'bg-indigo-50/80 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-l-2 border-indigo-500 dark:border-indigo-400'
                                            : 'text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 border-l-2 border-transparent'
                                        }`}
                                    key={index}
                                    onClick={() => selectItem(index)}
                                    // Scroll into view if selected
                                    ref={el => {
                                        if (index === selectedIndex && el) {
                                            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                                        }
                                    }}
                                >
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors ${index === selectedIndex
                                            ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-100/50 dark:bg-indigo-500/20'
                                            : 'text-zinc-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800'
                                        }`}>
                                        <item.icon size={16} strokeWidth={2} />
                                    </div>

                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={`text-sm font-medium truncate ${index === selectedIndex ? 'text-indigo-700 dark:text-indigo-200' : 'text-zinc-900 dark:text-zinc-100'
                                            }`}>
                                            {item.title}
                                        </span>
                                        <span className={`text-xs truncate ${index === selectedIndex ? 'text-indigo-500/80 dark:text-indigo-300/70' : 'text-zinc-500 dark:text-zinc-500'
                                            }`}>
                                            {item.description}
                                        </span>
                                    </div>
                                </button>
                            </React.Fragment>
                        )
                    })}
                </div>
            ) : (
                <div className="p-3 text-sm text-zinc-500 text-center italic">No commands found</div>
            )}
        </div>
    )
})

SlashCommandList.displayName = 'SlashCommandList'

export default SlashCommandList
