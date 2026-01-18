import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export const SlashCommandsMenu = forwardRef((props: any, ref) => {
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

    useEffect(() => setSelectedIndex(0), [props.items])

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
        <div className="slash-commands-menu">
            {props.items.length > 0 ? (
                props.items.map((item: any, index: number) => (
                    <button
                        key={index}
                        className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => selectItem(index)}
                    >
                        <div className="slash-command-content">
                            <div className="slash-command-title">{item.title}</div>
                            <div className="slash-command-description">{item.description}</div>
                        </div>
                    </button>
                ))
            ) : (
                <div className="slash-command-empty">No results</div>
            )}
        </div>
    )
})

SlashCommandsMenu.displayName = 'SlashCommandsMenu'
