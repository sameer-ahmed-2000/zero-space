interface SlashMenuProps {
    commands: Array<{
        title: string
        description: string
        action: any
    }>
    selectedIndex: number
    position: { top: number; left: number }
    onSelect: (index: number) => void
}

export function SlashMenu({ commands, selectedIndex, position, onSelect }: SlashMenuProps) {
    if (commands.length === 0) {
        return (
            <div
                className="slash-commands-menu"
                style={{
                    position: 'fixed',
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                }}
            >
                <div className="slash-command-empty">No results</div>
            </div>
        )
    }

    return (
        <div
            className="slash-commands-menu"
            style={{
                position: 'fixed',
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            {commands.map((command, index) => (
                <button
                    key={index}
                    className={`slash-command-item ${index === selectedIndex ? 'selected' : ''}`}
                    onClick={() => onSelect(index)}
                    onMouseEnter={() => onSelect(index)}
                >
                    <div className="slash-command-content">
                        <div className="slash-command-title">{command.title}</div>
                        <div className="slash-command-description">{command.description}</div>
                    </div>
                </button>
            ))}
        </div>
    )
}
