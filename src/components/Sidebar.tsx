import { Page } from '@/types'
import { Moon, Plus, Search, Settings, Sun, Trash2, X } from 'lucide-react'

interface SidebarProps {
    isOpen: boolean
    toggle: () => void
    darkMode: boolean
    toggleDarkMode: () => void
    pages: Page[]
    currentPageId: string
    onPageSelect: (pageId: string) => void
    onNewPage: () => void
    onDeletePage: (pageId: string) => void
}

export default function Sidebar({
    isOpen,
    toggle,
    darkMode,
    toggleDarkMode,
    pages,
    currentPageId,
    onPageSelect,
    onNewPage,
    onDeletePage
}: SidebarProps) {
    return (
        <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="workspace-info">
                    <div className="workspace-icon">📝</div>
                    <div className="workspace-details">
                        <h3>Zero-Space</h3>
                        <p>Personal</p>
                    </div>
                </div>
                <button
                    className="sidebar-toggle"
                    onClick={toggle}
                    title="Close sidebar"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="sidebar-search">
                <Search size={16} />
                <input type="text" placeholder="Search..." />
            </div>

            <nav className="sidebar-nav">
                <button className="nav-item new-page-btn" onClick={onNewPage}>
                    <Plus size={18} />
                    <span>New Page</span>
                </button>

                <div className="pages-list">
                    {pages.map((page) => (
                        <div
                            key={page.id}
                            className={`page-item ${currentPageId === page.id ? 'active' : ''}`}
                        >
                            <button
                                className="page-button"
                                onClick={() => onPageSelect(page.id)}
                            >
                                <span className="sidebar-page-title">{page.title || 'Untitled'}</span>
                            </button>
                            {pages.length > 1 && (
                                <button
                                    className="delete-page-btn"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm(`Delete "${page.title || 'Untitled'}"?`)) {
                                            onDeletePage(page.id)
                                        }
                                    }}
                                    title="Delete page"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={toggleDarkMode}>
                    {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button className="nav-item">
                    <Settings size={18} />
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    )
}
