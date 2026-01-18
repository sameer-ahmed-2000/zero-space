'use client'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Heading from '@tiptap/extension-heading'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { List } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Markdown } from 'tiptap-markdown'

import CodeBlockComponent from '../components/CodeBlockComponent'
import EditorMenus from '../components/EditorMenus'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import TopBar from '../components/TopBar'
import { Page, TocItem } from '../types'
import { runWhenIdle } from '../utils/idle'

// Initialize lowlight for syntax highlighting
const lowlight = createLowlight(common)

// Default page icons
const DEFAULT_ICONS = ['📄', '📝', '📋', '📑', '📓', '📔', '📕', '📗', '📘', '📙']

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export default function NotionEditor() {
  const [mounted, setMounted] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Multi-page state
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const editorRef = useRef<any>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const pendingUpdateRef = useRef<boolean>(false)

  // Debounced function to update page content (includes expensive JSON operations)
  const debouncedUpdateContent = useCallback(
    debounce((pageId: string, editor: any) => {
      // Perform expensive operations asynchronously
      runWhenIdle(() => {
        const json = editor.getJSON()
        const contentString = JSON.stringify(json)

        setPages(prevPages => {
          const updatedPages = prevPages.map(page =>
            page.id === pageId
              ? { ...page, content: contentString, updatedAt: Date.now() }
              : page
          )

          // Save to localStorage
          saveToLocalStorage(updatedPages)

          return updatedPages
        })

        pendingUpdateRef.current = false
      })
    }, 300),
    []
  )

  // Debounced function to save pages to localStorage
  const saveToLocalStorage = useCallback(
    debounce((pagesToSave: Page[]) => {
      localStorage.setItem('zero-space-pages', JSON.stringify(pagesToSave))
    }, 500),
    []
  )

  // Debounced function to extract headings
  const debouncedExtractHeadings = useCallback(
    debounce(() => {
      const editor = editorRef.current
      if (!editor) return

      const headings: TocItem[] = []
      const doc = editor.state.doc

      doc.descendants((node: any, pos: number) => {
        if (node.type.name === 'heading') {
          let id = node.attrs.id

          // Generate a new ID if one doesn't exist
          if (!id) {
            id = `heading-${Math.random().toString(36).slice(2, 9)}`

            if (editor.isEditable) {
              editor.commands.setNodeSelection(pos)
              editor.commands.updateAttributes('heading', { id })
            }
          }

          const text = node.textContent
          const level = node.attrs.level

          headings.push({ id, text, level })
        }
      })

      setTocItems(headings)
    }, 500),
    []
  )

  // Function to extract headings from editor (non-debounced version for initial load)
  const extractHeadings = useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const headings: TocItem[] = []
    const doc = editor.state.doc

    doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'heading') {
        let id = node.attrs.id

        // Generate a new ID if one doesn't exist
        if (!id) {
          id = `heading-${Math.random().toString(36).slice(2, 9)}`

          if (editor.isEditable) {
            editor.commands.setNodeSelection(pos)
            editor.commands.updateAttributes('heading', { id })
          }
        }

        const text = node.textContent
        const level = node.attrs.level

        headings.push({ id, text, level })
      }
    })

    setTocItems(headings)
  }, [])

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: false,
        breaks: true,
        linkify: true,
      }),
      StarterKit.configure({
        codeBlock: false,
        heading: false,
      }),
      Heading.configure({
        levels: [1, 2, 3],
        HTMLAttributes: {
          class: 'heading',
        },
      }).extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            id: {
              default: null,
              parseHTML: (element: HTMLElement) => element.getAttribute('id'),
              renderHTML: (attributes: { id?: string }) => {
                if (!attributes.id) {
                  return {}
                }
                return { id: attributes.id }
              },
            },
          }
        },
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return 'Heading'
          }
          return "Type '/' for commands, or start writing..."
        },
      }),
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent)
        },
      }).configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleDOMEvents: {
        paste: (view, event) => {
          const text = event.clipboardData?.getData('text/plain')

          // Show loader for large pastes
          if (text && text.length > 50000) {
            setIsProcessing(true)
            // Loader will be hidden by onUpdate callback
          }

          // Let the default paste handler work
          return false
        }
      }
    },
    onUpdate: ({ editor }) => {
      if (!currentPageId) return

      // Store editor in ref immediately
      editorRef.current = editor

      // Mark that we have a pending update
      pendingUpdateRef.current = true

      // Defer expensive JSON operations to avoid blocking the UI
      debouncedUpdateContent(currentPageId, editor)

      // Debounce heading extraction to avoid blocking on large documents
      debouncedExtractHeadings()

      // Hide loader after content is processed
      if (isProcessing) {
        setTimeout(() => setIsProcessing(false), 500)
      }
    },
    onCreate: ({ editor }) => {
      // Store editor in ref when created
      editorRef.current = editor
    },
  })

  // Generate unique ID
  const generateId = () => {
    return `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  // Create initial page if none exist
  const createInitialPage = () => {
    const initialPage: Page = {
      id: generateId(),
      title: 'Untitled',
      icon: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setPages([initialPage])
    setCurrentPageId(initialPage.id)
  }

  // Initialize pages from localStorage
  useEffect(() => {
    setMounted(true)

    const savedPages = localStorage.getItem('zero-space-pages')
    const savedCurrentPageId = localStorage.getItem('zero-space-current-page')

    if (savedPages) {
      try {
        const parsedPages: Page[] = JSON.parse(savedPages)
        setPages(parsedPages)

        if (savedCurrentPageId && parsedPages.find(p => p.id === savedCurrentPageId)) {
          setCurrentPageId(savedCurrentPageId)
        } else if (parsedPages.length > 0) {
          setCurrentPageId(parsedPages[0].id)
        }
      } catch (e) {
        console.error('Failed to load pages:', e)
        createInitialPage()
      }
    } else {
      createInitialPage()
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('zero-space-dark-mode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Note: Pages are now saved to localStorage via debounced saveToLocalStorage in onUpdate handler

  // Save current page ID
  useEffect(() => {
    if (currentPageId) {
      localStorage.setItem('zero-space-current-page', currentPageId)
    }
  }, [currentPageId])

  // Load current page content into editor
  useEffect(() => {
    if (!editor || !currentPageId) return

    const currentPage = pages.find(p => p.id === currentPageId)
    if (!currentPage) return

    try {
      if (currentPage.content) {
        const json = JSON.parse(currentPage.content)
        editor.commands.setContent(json)
      } else {
        editor.commands.setContent('')
      }

      // Extract headings after content loads
      setTimeout(() => {
        extractHeadings()
      }, 100)
    } catch (e) {
      console.error('Failed to load page content:', e)
    }
  }, [editor, currentPageId, pages])

  // Update document title
  useEffect(() => {
    const currentPage = pages.find(p => p.id === currentPageId)
    document.title = currentPage?.title || 'Untitled'
  }, [currentPageId, pages])

  // Track active heading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const wrapper = editorWrapperRef.current
      if (!wrapper) return

      const headingElements = document.querySelectorAll('.tiptap-editor h1, .tiptap-editor h2, .tiptap-editor h3')
      const scrollPosition = wrapper.scrollTop + 100

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i] as HTMLElement
        if (heading.offsetTop <= scrollPosition) {
          setActiveId(heading.id || '')
          break
        }
      }
    }

    const wrapper = editorWrapperRef.current
    if (wrapper) {
      wrapper.addEventListener('scroll', handleScroll)
      handleScroll()
      return () => wrapper.removeEventListener('scroll', handleScroll)
    }
  }, [tocItems])

  // Handle new page creation
  const handleNewPage = () => {
    const newPage: Page = {
      id: generateId(),
      title: 'Untitled',
      icon: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setPages(prevPages => [...prevPages, newPage])
    setCurrentPageId(newPage.id)
  }

  // Handle page selection
  const handlePageSelect = (pageId: string) => {
    setCurrentPageId(pageId)
  }

  // Handle page deletion
  const handleDeletePage = (pageId: string) => {
    setPages(prevPages => {
      const newPages = prevPages.filter(p => p.id !== pageId)

      // If deleting current page, switch to another
      if (pageId === currentPageId && newPages.length > 0) {
        setCurrentPageId(newPages[0].id)
      }

      return newPages
    })
  }

  // Handle page title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === currentPageId
          ? { ...page, title: newTitle, updatedAt: Date.now() }
          : page
      )
    )
  }

  // Handle TOC item click
  const handleTocClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (editor && text) {
        editor.commands.focus('end')
        editor.commands.insertContent('\n\n')
        editor.commands.insertContent(text)
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  // Handle PDF export
  const handleExport = () => {
    window.print()
  }

  // Handle clear editor
  const handleClear = () => {
    if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
      editor?.commands.clearContent()
      setPages(prevPages =>
        prevPages.map(page =>
          page.id === currentPageId
            ? { ...page, content: '', updatedAt: Date.now() }
            : page
        )
      )
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('zero-space-dark-mode', String(newDarkMode))

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  if (!mounted || !editor) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    )
  }

  const currentPage = pages.find(p => p.id === currentPageId)

  return (
    <div className={`app-container ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${(sidebarOpen || tocOpen) ? 'active' : ''}`}
        onClick={() => {
          setSidebarOpen(false)
          setTocOpen(false)
        }}
      />

      {/* Processing Overlay for Large Pastes */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="loading-spinner"></div>
            <p>Processing large content...</p>
          </div>
        </div>
      )}

      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        pages={pages}
        currentPageId={currentPageId}
        onPageSelect={handlePageSelect}
        onNewPage={handleNewPage}
        onDeletePage={handleDeletePage}
      />

      {/* Main Content */}
      <main className="main-content">
        <TopBar
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(true)}
          toggleToc={() => setTocOpen(!tocOpen)}
          onImportFile={handleFileImport}
          onExport={handleExport}
          onClear={handleClear}
        />

        {/* Editor Container */}
        <div className="editor-wrapper" ref={editorWrapperRef}>
          <div className="editor-container">
            {/* Page Icon & Title */}
            <div className="page-header">
              {currentPage?.icon && <div className="page-icon">{currentPage.icon}</div>}
              <input
                type="text"
                className="editor-page-title"
                placeholder="Untitled"
                value={currentPage?.title || ''}
                onChange={handleTitleChange}
              />
            </div>

            <EditorMenus editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      <TableOfContents
        isOpen={tocOpen}
        toggle={() => setTocOpen(!tocOpen)}
        items={tocItems}
        activeId={activeId}
        onItemClick={handleTocClick}
      />

      {/* Mobile TOC Toggle */}
      <button
        className="toc-mobile-toggle"
        onClick={() => setTocOpen(!tocOpen)}
        title="Table of Contents"
      >
        <List size={20} />
      </button>
    </div>
  )
}
