import { X } from 'lucide-react'
import { memo } from 'react'
import { TocItem } from '../types'

interface TableOfContentsProps {
    isOpen: boolean
    toggle: () => void
    items: TocItem[]
    activeId: string
    onItemClick: (id: string) => void
}

function TableOfContents({ isOpen, toggle, items, activeId, onItemClick }: TableOfContentsProps) {
    return (
        <aside className={`toc-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="toc-header">
                <h3>On this page</h3>
                <button
                    onClick={toggle}
                    className="toc-close"
                    title="Close"
                >
                    <X size={16} />
                </button>
            </div>

            {isOpen && (
                <nav className="toc-nav">
                    {items.length === 0 ? (
                        <p className="toc-empty">No headings yet</p>
                    ) : (
                        <ul>
                            {items.map((item) => (
                                <li
                                    key={item.id}
                                    className={`toc-item level-${item.level} ${activeId === item.id ? 'active' : ''}`}
                                    onClick={() => onItemClick(item.id)}
                                >
                                    <span>{item.text || 'Untitled'}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </nav>
            )}
        </aside>
    )
}

export default memo(TableOfContents)
