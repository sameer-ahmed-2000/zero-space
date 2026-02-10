'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import { List } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import EditorMenus from '../components/EditorMenus'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import TopBar from '../components/TopBar'
import { editorExtensions } from '../extensions/editor-config'
import { useDriveSync } from '../hooks/useDriveSync'
import { usePasteHandler } from '../hooks/usePasteHandler'
import { useTableOfContents } from '../hooks/useTableOfContents'
import { Page } from '../types'
import { debounce } from '../utils/debounce'
import { runWhenIdle } from '../utils/idle'
import { workerManager } from '../utils/workerManager'

export default function NotionEditor() {
  // UI State
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tocOpen, setTocOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  // Pages State
  const [pages, setPages] = useState<Page[]>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')

  // Refs
  const editorRef = useRef<any>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const pendingUpdateRef = useRef<boolean>(false)

  // Generate unique ID
  const generateId = () => {
    return `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  }

  // Create initial page if none exist (internal utility)
  const createInitialPage = useCallback(() => {
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
  }, [])

  // Custom Hooks
  const {
    tocItems,
    activeId,
    setActiveId,
    extractHeadings,
    debouncedExtractHeadings
  } = useTableOfContents(editorRef)

  const {
    isProcessing,
    processingStatus,
    processingProgress,
    handlePaste
  } = usePasteHandler(editorRef)

  const {
    isSignedIn,
    syncStatus,
    userEmail,
    gapiInitialized,
    handleConnectDrive,
    syncPages
  } = useDriveSync({
    pages,
    setPages,
    setCurrentPageId,
    createInitialPage,
    editor: editorRef.current
  })

  // Debounced function to save pages to localStorage
  const saveToLocalStorage = useCallback(
    debounce((pagesToSave: Page[]) => {
      workerManager.stringifyContent(pagesToSave)
        .then(str => {
          try {
            localStorage.setItem('zero-space-pages', str)
          } catch (e) {
            console.error('Storage quota exceeded', e)
          }
        })
        .catch(err => {
          console.error('Failed to serialize pages for storage', err)
          try {
            localStorage.setItem('zero-space-pages', JSON.stringify(pagesToSave))
          } catch (e) {
            console.error('Storage quota exceeded fallback', e)
          }
        })
    }, 2000),
    []
  )

  // Debounced function to update page content (Main logic)
  const debouncedUpdateContent = useCallback(
    debounce((pageId: string, editor: any) => {
      runWhenIdle(async () => {
        const json = editor.getJSON()

        try {
          const contentString = await workerManager.stringifyContent(json)

          setPages(prevPages => {
            const updatedPages = prevPages.map(page =>
              page.id === pageId
                ? { ...page, content: contentString, updatedAt: Date.now() }
                : page
            )

            // Save & Sync
            saveToLocalStorage(updatedPages)
            if (isSignedIn) {
              syncPages(updatedPages)
            }

            return updatedPages
          })
        } catch (error) {
          console.error('Failed to stringify content:', error)
          const contentString = JSON.stringify(json)

          setPages(prevPages => {
            const updatedPages = prevPages.map(page =>
              page.id === pageId
                ? { ...page, content: contentString, updatedAt: Date.now() }
                : page
            )
            saveToLocalStorage(updatedPages)
            if (isSignedIn) {
              syncPages(updatedPages)
            }
            return updatedPages
          })
        }
        pendingUpdateRef.current = false
      })
    }, 1000),
    [isSignedIn, saveToLocalStorage, syncPages]
  )


  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions, // Use extracted extensions
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleDOMEvents: {
        paste: (view, event) => {
          // @ts-ignore - event type mismatch often happens with ClipboardEvent
          return handlePaste(view, event as any)
        }
      }
    },
    onUpdate: ({ editor }) => {
      if (!currentPageId) return
      editorRef.current = editor
      pendingUpdateRef.current = true

      debouncedUpdateContent(currentPageId, editor)
      debouncedExtractHeadings()

      // Clear loader if stuck
      if (isProcessing) {
        // setProcessing logic is inside hook, we can't control it easily here unless we expose setProcessing
        // But hook handles auto-clearing.
      }
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor
    },
  })

  // Initialize from LocalStorage
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

    const savedDarkMode = localStorage.getItem('zero-space-dark-mode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [createInitialPage])

  // Save current page ID
  useEffect(() => {
    if (currentPageId) {
      localStorage.setItem('zero-space-current-page', currentPageId)
    }
  }, [currentPageId])

  // Update document title
  useEffect(() => {
    const currentPage = pages.find(p => p.id === currentPageId)
    document.title = currentPage?.title || 'Untitled'
  }, [currentPageId, pages])

  // Load content when page changes
  useEffect(() => {
    if (!editor || !currentPageId || !mounted) return

    const page = pages.find(p => p.id === currentPageId)
    if (!page) return

    // Use setTimeout to avoid flushSync issues
    setTimeout(() => {
      if (!editor || editor.isDestroyed) return

      try {
        // If content is empty/different, set it.
        // We rely on editor.getJSON() usually but here we are loading a NEW page.
        // We need to differentiate between "I just typed this" vs "Use switched page".
        // The dependency [currentPageId] handles the switch.

        if (page.content) {
          const json = JSON.parse(page.content)
          editor.commands.setContent(json)
        } else {
          editor.commands.setContent('')
        }

        editor.commands.focus('start')

        // Extract headings after load
        setTimeout(extractHeadings, 100)

      } catch (e) {
        console.error('Failed to load page content:', e)
        editor.commands.setContent('')
      }
    }, 0)
  }, [currentPageId, editor, mounted]) // Removed 'pages' dep to avoid loops, relying on find() result which is stable for this render

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
      return () => wrapper.removeEventListener('scroll', handleScroll)
    }
  }, [tocItems, setActiveId])


  // Handlers
  const handleNewPage = () => {
    const newPage: Page = {
      id: generateId(),
      title: 'Untitled',
      icon: '',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setPages(prevPages => {
      const updatedPages = [...prevPages, newPage]
      saveToLocalStorage(updatedPages)
      syncPages(updatedPages)
      return updatedPages
    })
    setCurrentPageId(newPage.id)
  }

  const handlePageSelect = (pageId: string) => {
    setCurrentPageId(pageId)
  }

  const handleDeletePage = (pageId: string) => {
    setPages(prevPages => {
      const newPages = prevPages.filter(p => p.id !== pageId)
      if (pageId === currentPageId && newPages.length > 0) {
        setCurrentPageId(newPages[0].id)
      }
      saveToLocalStorage(newPages)
      syncPages(newPages)
      return newPages
    })
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setPages(prevPages => {
      const updatedPages = prevPages.map(page =>
        page.id === currentPageId
          ? { ...page, title: newTitle, updatedAt: Date.now() }
          : page
      )
      saveToLocalStorage(updatedPages)
      syncPages(updatedPages)
      return updatedPages
    })
  }

  const handleTocClick = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

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

  const handleExport = () => {
    window.print()
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all content? This cannot be undone.')) {
      editor?.commands.clearContent()
      setPages(prevPages => {
        const updatedPages = prevPages.map(page =>
          page.id === currentPageId
            ? { ...page, content: '', updatedAt: Date.now() }
            : page
        )
        saveToLocalStorage(updatedPages)
        syncPages(updatedPages)
        return updatedPages
      })
    }
  }

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('zero-space-dark-mode', String(newDarkMode))
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

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
            <div className="loading-spinner" />
            <p>{processingStatus}</p>

            <div className="progress-bar">
              <div
                className="progress-bar-fill"
                style={{ width: `${processingProgress}%` }}
              />
            </div>

            <span>{processingProgress}%</span>
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
          isSignedIn={isSignedIn}
          syncStatus={syncStatus}
          userEmail={userEmail}
          onConnectDrive={handleConnectDrive}
          gapiInitialized={gapiInitialized}
        />

        {/* Editor Container */}
        <div className="editor-wrapper" ref={editorWrapperRef}>
          <div className="editor-container">
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
