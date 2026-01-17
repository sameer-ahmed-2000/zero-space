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
import { TocItem } from '../types'

// Initialize lowlight for syntax highlighting
const lowlight = createLowlight(common)

export default function NotionEditor() {
  const [mounted, setMounted] = useState(false)
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [pageTitle, setPageTitle] = useState('Untitled')
  const editorRef = useRef<any>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)

  // Function to extract headings from editor
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

          // We need to set the selection to update the specific node
          // This might cause cursor jumps if typing, but essential for first ID generation
          if (editor.isEditable) {
            // Use a transaction to avoid multiple history steps or jumps if possible
            // But setNodeSelection is standard for commands
            // We wrap in a check to avoid unnecessary updates if possible, 
            // but here we know !id.

            // Note: queuing this might be better but let's stick to synchronous for stability
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
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      localStorage.setItem('notion-editor-content', JSON.stringify(json))

      // Store editor in ref and extract headings
      editorRef.current = editor
      extractHeadings()
    },
    onCreate: ({ editor }) => {
      // Store editor in ref when created
      editorRef.current = editor
    },
  })

  // Load content from localStorage
  useEffect(() => {
    setMounted(true)

    if (editor) {
      const savedContent = localStorage.getItem('notion-editor-content')
      if (savedContent) {
        try {
          const json = JSON.parse(savedContent)
          editor.commands.setContent(json)

          // Extract headings after content loads
          setTimeout(() => {
            extractHeadings()
          }, 100)
        } catch (e) {
          console.error('Failed to load saved content:', e)
        }
      }
    }

    // Load saved title
    const savedTitle = localStorage.getItem('notion-page-title')
    if (savedTitle) {
      setPageTitle(savedTitle)
    }

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem('notion-dark-mode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [editor])

  // Track active heading on scroll
  useEffect(() => {
    const handleScroll = () => {
      const wrapper = editorWrapperRef.current
      if (!wrapper) return

      const headingElements = document.querySelectorAll('.tiptap-editor h1, .tiptap-editor h2, .tiptap-editor h3')
      // Adjusted calculation for container scroll
      const scrollPosition = wrapper.scrollTop + 100

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i] as HTMLElement
        // If wrapper is offsetParent, heading.offsetTop works.
        // If not, we might need adjustments, but let's assume default works for now.
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
      localStorage.removeItem('notion-editor-content')
    }
  }

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('notion-dark-mode', String(newDarkMode))

    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Save page title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setPageTitle(newTitle)
    localStorage.setItem('notion-page-title', newTitle)
  }

  // Update document title
  useEffect(() => {
    document.title = pageTitle || 'Untitled'
  }, [pageTitle])

  if (!mounted || !editor) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    )
  }

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

      <Sidebar
        isOpen={sidebarOpen}
        toggle={() => setSidebarOpen(!sidebarOpen)}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
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
              <div className="page-icon">📄</div>
              <input
                type="text"
                className="page-title"
                placeholder="Untitled"
                value={pageTitle}
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
