import { FileText, Moon, Plus, Search, Settings, Sun, X } from 'lucide-react'

interface SidebarProps {
    isOpen: boolean
    toggle: () => void
    darkMode: boolean
    toggleDarkMode: () => void
}

export default function Sidebar({ isOpen, toggle, darkMode, toggleDarkMode }: SidebarProps) {
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
                <button className="nav-item active">
                    <FileText size={18} />
                    <span>Current Page</span>
                </button>
                <button className="nav-item">
                    <Plus size={18} />
                    <span>New Page</span>
                </button>
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
