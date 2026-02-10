
import { Page } from '@/types'
import { FileText, Moon, Plus, Search, Settings, Sun, Trash2, X } from 'lucide-react'
import { memo, useState } from 'react'

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

function Sidebar({
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
    const [searchQuery, setSearchQuery] = useState('')

    const filteredPages = pages.filter(page =>
        (page.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="workspace-info">
                    <div className="workspace-icon">Z</div>
                    <div className="workspace-details">
                        <h3>Zero-Space</h3>
                        <p>Personal Workspace</p>
                    </div>
                </div>
                <button
                    className="nav-item"
                    style={{ width: 'auto', padding: 6 }}
                    onClick={toggle}
                    title="Close sidebar"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="sidebar-search">
                <Search size={14} />
                <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>

            <nav className="sidebar-nav">
                <button className="nav-item new-page-btn" onClick={onNewPage}>
                    <Plus size={16} />
                    <span>New Page</span>
                </button>

                <div className="pages-list">
                    {filteredPages.length > 0 ? (
                        filteredPages.map((page) => (
                            <div
                                key={page.id}
                                className={`page-item ${currentPageId === page.id ? 'active' : ''}`}
                            >
                                <button
                                    className="page-button"
                                    onClick={() => onPageSelect(page.id)}
                                >
                                    <span className="page-icon">
                                        <FileText size={14} />
                                    </span>
                                    <span className="sidebar-page-title">{page.title || 'Untitled'}</span>
                                </button>

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
                                    <Trash2 size={13} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-xs text-center text-gray-500 dark:text-gray-400 italic">
                            No pages found
                        </div>
                    )}
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-item" onClick={toggleDarkMode}>
                    {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button className="nav-item">
                    <Settings size={16} />
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    )
}

export default memo(Sidebar)
