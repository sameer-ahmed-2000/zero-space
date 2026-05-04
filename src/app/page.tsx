'use client'

import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Heading from '@tiptap/extension-heading'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import { EditorContent, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { common, createLowlight } from 'lowlight'
import { List } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Markdown } from 'tiptap-markdown'

import { googleLogout, useGoogleLogin } from '@react-oauth/google'
import CodeBlockComponent from '../components/CodeBlockComponent'
import EditorMenus from '../components/EditorMenus'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import TopBar from '../components/TopBar'
import { SlashCommand, suggestion } from '../extensions/slash-command'
import { Page, TocItem } from '../types'
import * as GoogleDrive from '../utils/googleDrive'
import { runWhenIdle } from '../utils/idle'
import { workerManager } from '../utils/workerManager'

// Google Drive API types
declare global {
  interface Window {
    gapi: any
  }
}

type SyncStatus = 'idle' | 'saving' | 'synced' | 'error'

interface DriveFile {
  id: string
  name: string
}

// Initialize lowlight for syntax highlighting
const lowlight = createLowlight(common)

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

// ============================================
// Component Start
// ============================================



const DRIVE_API_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const DRIVE_FILE_NAME = 'zero_space_db.json'
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'

// Load the Google API script dynamically (SSR-safe)
const loadGapiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window is undefined'))
      return
    }

    if (window.gapi) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://apis.google.com/js/api.js'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google API script'))
    document.body.appendChild(script)
  })
}


// Initialize the Google API client
const initializeGapi = async (clientId: string): Promise<void> => {
  console.log('🔍 Step 1: Loading gapi script...')
  await loadGapiScript()
  console.log('✅ Step 1 complete: gapi script loaded')

  return new Promise((resolve, reject) => {
    console.log('🔍 Step 2: Loading client:auth2 modules...')
    window.gapi.load('client:auth2', async () => {
      console.log('✅ Step 2 complete: client:auth2 loaded')
      try {
        console.log('🔍 Step 3: Initializing gapi client with:', {
          clientId: clientId.substring(0, 20) + '...',
          scope: DRIVE_API_SCOPE,
          discoveryDoc: DISCOVERY_DOC
        })

        await window.gapi.client.init({
          apiKey: '', // Not needed for client-side OAuth with drive.file scope
          clientId,
          discoveryDocs: [DISCOVERY_DOC],
          scope: DRIVE_API_SCOPE,
        })

        console.log('✅ Step 3 complete: gapi client initialized')
        resolve()
      } catch (error) {
        console.error('❌ Step 3 failed during gapi.client.init:', error)

        // Extract detailed error info from gapi error object
        const errorObj = error as any
        const errorDetails = {
          message: errorObj?.message || errorObj?.error?.message || 'Unknown error',
          code: errorObj?.code || errorObj?.error?.code,
          status: errorObj?.status || errorObj?.error?.status,
          details: errorObj?.details || errorObj?.error?.details,
          result: errorObj?.result?.error,
        }

        console.error('Error details:', errorDetails)

        // Provide specific troubleshooting based on error
        if (errorDetails.code === 400 || errorDetails.message?.includes('origin')) {
          console.error('🔍 LIKELY CAUSE: Unauthorized JavaScript origin')
          console.error('📋 TO FIX:')
          console.error('   1. Go to: https://console.cloud.google.com/apis/credentials')
          console.error('   2. Click on your OAuth 2.0 Client ID')
          console.error('   3. Under "Authorized JavaScript origins", add:')
          console.error('      • http://localhost:3000')
          console.error('      • http://localhost:3001 (if using different port)')
          console.error('   4. Click "Save"')
          console.error('   5. Wait 1-2 minutes, then reload this page')
        } else if (errorDetails.message?.includes('not found') || errorDetails.message?.includes('invalid')) {
          console.error('🔍 LIKELY CAUSE: Invalid Client ID')
          console.error('📋 TO FIX: Double-check your Client ID in Google Cloud Console')
        }

        reject(error)
      }
    })
  })
}

// Sign in to Google
const signInToGoogle = async (): Promise<void> => {
  const authInstance = window.gapi.auth2.getAuthInstance()
  await authInstance.signIn()
}

// Sign out from Google
const signOutFromGoogle = async (): Promise<void> => {
  const authInstance = window.gapi.auth2.getAuthInstance()
  await authInstance.signOut()
}

// Get current user email
const getCurrentUserEmail = (): string => {
  const authInstance = window.gapi.auth2.getAuthInstance()
  const user = authInstance.currentUser.get()
  const profile = user.getBasicProfile()
  return profile ? profile.getEmail() : ''
}

// Search for the zero_space_db.json file
const searchDriveFile = async (): Promise<DriveFile | null> => {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: `name='${DRIVE_FILE_NAME}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    })

    const files = response.result.files
    if (files && files.length > 0) {
      return files[0]
    }
    return null
  } catch (error) {
    console.error('Error searching for Drive file:', error)
    throw error
  }
}

// Create a new zero_space_db.json file
const createDriveFile = async (initialContent: string): Promise<string> => {
  try {
    const fileMetadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }))
    form.append('file', new Blob([initialContent], { type: 'application/json' }))

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: new Headers({
        Authorization: 'Bearer ' + window.gapi.auth.getToken().access_token,
      }),
      body: form,
    })

    const result = await response.json()
    return result.id
  } catch (error) {
    console.error('Error creating Drive file:', error)
    throw error
  }
}

// Download file content from Drive
const downloadDriveFileContent = async (fileId: string): Promise<string> => {
  try {
    const response = await window.gapi.client.drive.files.get({
      fileId,
      alt: 'media',
    })

    return JSON.stringify(response.result)
  } catch (error) {
    console.error('Error downloading Drive file content:', error)
    throw error
  }
}

// Update file content in Drive
const updateDriveFileContent = async (fileId: string, content: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: new Headers({
          Authorization: 'Bearer ' + window.gapi.auth.getToken().access_token,
          'Content-Type': 'application/json',
        }),
        body: content,
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update Drive file: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Error updating Drive file content:', error)
    throw error
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
  const [processingStatus, setProcessingStatus] = useState('')

  // Google Drive state
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [driveFileId, setDriveFileId] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [userEmail, setUserEmail] = useState<string>('')
  const [gapiInitialized, setGapiInitialized] = useState(false)

  const editorRef = useRef<any>(null)
  const editorWrapperRef = useRef<HTMLDivElement>(null)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const pendingUpdateRef = useRef<boolean>(false)
  const driveSyncRef = useRef<((pages: Page[]) => void) | null>(null)
  const [processingProgress, setProcessingProgress] = useState(0)

  // Google Login Hook (Modern GIS)
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('✅ Google login successful')

      try {
        // Set the access token for Drive API
        GoogleDrive.setGapiAccessToken(tokenResponse.access_token)

        // Get user email
        const email = await GoogleDrive.getCurrentUserEmail(tokenResponse.access_token)
        setUserEmail(email)
        setIsSignedIn(true)

        // Initialize Drive file
        await initializeDriveFile()
      } catch (error) {
        console.error('Error after Google login:', error)
        setSyncStatus('error')
        alert('Signed in successfully, but failed to initialize Drive. Please try again.')
      }
    },
    onError: (error) => {
      console.error('❌ Google login failed:', error)
      setSyncStatus('error')
      alert('Failed to sign in to Google Drive. Please try again.')
    },
    scope: GoogleDrive.DRIVE_API_SCOPE,
  })

  const yieldToMainThread = () =>
    new Promise<void>(resolve => {
      requestAnimationFrame(() => resolve())
    })
  // Debounced function to update page content (includes expensive JSON operations)
  const debouncedUpdateContent = useCallback(
    debounce((pageId: string, editor: any) => {
      // Perform expensive operations asynchronously
      runWhenIdle(async () => {
        const json = editor.getJSON()

        try {
          // Offload stringify to worker for performance
          const contentString = await workerManager.stringifyContent(json)

          setPages(prevPages => {
            const updatedPages = prevPages.map(page =>
              page.id === pageId
                ? { ...page, content: contentString, updatedAt: Date.now() }
                : page
            )

            // Save to localStorage
            saveToLocalStorage(updatedPages)

            // Sync to Google Drive (if signed in)
            if (driveSyncRef.current) {
              driveSyncRef.current(updatedPages)
            }

            return updatedPages
          })
        } catch (error) {
          console.error('Failed to stringify content:', error)
          // Fallback to main thread
          const contentString = JSON.stringify(json)

          setPages(prevPages => {
            const updatedPages = prevPages.map(page =>
              page.id === pageId
                ? { ...page, content: contentString, updatedAt: Date.now() }
                : page
            )
            saveToLocalStorage(updatedPages)
            if (driveSyncRef.current) {
              driveSyncRef.current(updatedPages)
            }
            return updatedPages
          })
        }

        pendingUpdateRef.current = false
      })
    }, 1000),
    []
  )

  // Debounced function to save pages to localStorage
  const saveToLocalStorage = useCallback(
    debounce((pagesToSave: Page[]) => {
      workerManager.stringifyContent(pagesToSave)
        .then(str => {
          // Check if within quota (basic check) typically 5MB
          try {
            localStorage.setItem('zero-space-pages', str)
          } catch (e) {
            console.error('Storage quota exceeded', e)
            // Maybe notify user? For now just log.
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

  // Debounced function to sync to Google Drive (2-second delay)
  const debouncedDriveSync = useCallback(
    debounce(async (pagesToSync: Page[]) => {
      // Only sync if signed in and have a file ID
      if (!isSignedIn || !driveFileId) {
        console.log('Skipping sync: Not signed in or no file ID', { isSignedIn, driveFileId })
        return
      }

      console.log('Triggering Drive Sync...')
      setSyncStatus('saving')

      try {
        const contentString = await workerManager.stringifyContent(pagesToSync)

        // Retry logic (up to 3 attempts)
        let attempts = 0
        const maxAttempts = 3
        let lastError: Error | null = null

        while (attempts < maxAttempts) {
          try {
            await GoogleDrive.updateDriveFileContent(driveFileId, contentString)
            setSyncStatus('synced')

            // Reset sync status to idle after 2 seconds
            setTimeout(() => {
              setSyncStatus('idle')
            }, 2000)

            return
          } catch (error) {
            lastError = error as Error
            attempts++

            if (attempts < maxAttempts) {
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts)))
            }
          }
        }

        // All attempts failed
        throw lastError
      } catch (error) {
        console.error('Failed to sync to Drive:', error)
        setSyncStatus('error')

        // Reset sync status after 5 seconds
        setTimeout(() => {
          setSyncStatus('idle')
        }, 5000)
      }
    }, 2000),
    [isSignedIn, driveFileId]
  )

  // Debounced function to extract headings
  const debouncedExtractHeadings = useCallback(
    debounce(() => {
      runWhenIdle(() => {
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
      })
    }, 1000),
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
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      SlashCommand.configure({
        suggestion,
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
      },
      handleDOMEvents: {
        paste: (view, event) => {
          const text = event.clipboardData?.getData('text/plain')
          if (!text) return false

          // Small paste → let TipTap handle it normally
          if (text.length < 50000) {
            return false
          }

          event.preventDefault()

          setIsProcessing(true)
          setProcessingProgress(0)
          setProcessingStatus('Parsing markdown…')

            ; (async () => {
              try {
                // 1️⃣ Parse markdown in worker
                const json = await workerManager.parseMarkdownToJson(text)

                if (!editorRef.current) return

                const editor = editorRef.current
                const nodes = json.content || []
                const total = nodes.length

                if (total === 0) {
                  setIsProcessing(false)
                  return
                }

                setProcessingStatus('Inserting content…')

                // 2️⃣ Disable history (huge perf win)
                editor.commands.setMeta('addToHistory', false)

                // 3️⃣ This avoids ProseMirror nesting issues entirely
                editor.commands.setContent(json, false, {
                  preserveWhitespace: 'full'
                })
                // 5️⃣ Re-enable history
                editor.commands.setMeta('addToHistory', true)

                setProcessingStatus('Finalizing…')

                // 6️⃣ Let layout + NodeViews settle
                await yieldToMainThread()

              } catch (err) {
                console.error('Large paste failed:', err)
              } finally {
                setProcessingProgress(100)
                setTimeout(() => {
                  setIsProcessing(false)
                  setProcessingStatus('')
                  setProcessingProgress(0)
                }, 300)
              }
            })()

          return true
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

  // ============================================
  // GOOGLE DRIVE HANDLERS
  // ============================================

  // Handle Google Drive sign-in
  const handleConnectDrive = async () => {
    try {
      if (!isSignedIn) {
        // Check if gapi is initialized
        if (!gapiInitialized) {
          alert('Google Drive is still loading. Please wait a moment and try again.')
          return
        }

        // Trigger Google login using modern GIS
        googleLogin()
      } else {
        // Sign out
        googleLogout()
        GoogleDrive.clearAccessToken()

        setIsSignedIn(false)
        setUserEmail('')
        setDriveFileId(null)
        setSyncStatus('idle')

        // Safety: Clear editor content when user signs out
        if (editor) {
          editor.commands.clearContent()
        }

        // Reset pages to initial state
        createInitialPage()
      }
    } catch (error) {
      console.error('Google Drive connection error:', error)
      setSyncStatus('error')

      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to connect to Google Drive: ${errorMessage}\n\nPlease check your internet connection and try again.`)
    }
  }

  // Initialize Drive file (check if exists, or create new)
  const initializeDriveFile = async () => {
    try {
      // Search for existing file
      const existingFile = await GoogleDrive.searchDriveFile()

      if (existingFile) {
        // File found - download and load content
        setDriveFileId(existingFile.id)

        const content = await GoogleDrive.downloadDriveFileContent(existingFile.id)
        const loadedPages: Page[] = JSON.parse(content)

        // Safety: Clear editor before loading new user's data
        if (editor) {
          editor.commands.clearContent()
        }

        setPages(loadedPages)

        if (loadedPages.length > 0) {
          setCurrentPageId(loadedPages[0].id)
        }

        setSyncStatus('synced')
        setTimeout(() => setSyncStatus('idle'), 2000)
      } else {
        // No file found - create new one with current pages
        const initialContent = JSON.stringify(pages)
        const newFileId = await GoogleDrive.createDriveFile(initialContent)
        setDriveFileId(newFileId)

        setSyncStatus('synced')
        setTimeout(() => setSyncStatus('idle'), 2000)
      }
    } catch (error) {
      console.error('Failed to initialize Drive file:', error)
      setSyncStatus('error')
    }
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

  // Update driveSyncRef whenever debouncedDriveSync changes
  useEffect(() => {
    driveSyncRef.current = debouncedDriveSync as any
  }, [debouncedDriveSync])

  // Initialize Google Drive API
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

    if (!clientId) {
      console.warn('⚠️ Google Client ID not configured. Drive sync will not be available.')
      console.info('💡 To enable Drive sync, add NEXT_PUBLIC_GOOGLE_CLIENT_ID to your .env.local file')
      return
    }

    // Validate Client ID format
    if (clientId.startsWith('GOCSPX-')) {
      console.error('❌ INVALID CREDENTIAL DETECTED!')
      console.error('You provided a Client Secret (GOCSPX-...) instead of a Client ID')
      console.error('Client ID should look like: 123456789-abc.apps.googleusercontent.com')
      console.error('See URGENT_FIX_REQUIRED.md for instructions')

      // Set gapiInitialized to true so button stops loading
      setGapiInitialized(true)
      setSyncStatus('error')

      alert(
        '⚠️ GOOGLE DRIVE CONFIGURATION ERROR\n\n' +
        'You entered a Client Secret instead of a Client ID!\n\n' +
        'Client ID should look like:\n123456789-abc.apps.googleusercontent.com\n\n' +
        'NOT:\nGOCSPX-...\n\n' +
        'Please check the console and URGENT_FIX_REQUIRED.md for instructions.'
      )
      return
    }

    if (!clientId.includes('.apps.googleusercontent.com')) {
      console.warn('⚠️ Client ID format looks incorrect')
      console.warn('Expected format: xxxxx.apps.googleusercontent.com')
      console.warn('Your value:', clientId)
    }

    const initGapi = async () => {
      try {
        console.log('🔄 Initializing Google Drive API...')
        await GoogleDrive.initializeGapiClient()
        setGapiInitialized(true)
        console.log('✅ Google Drive API ready')
      } catch (error) {
        console.error('❌ Failed to initialize Google Drive API:', error)
        setGapiInitialized(true) // Set to true anyway to stop loading state
        setSyncStatus('error')
      }
    }

    initGapi()
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

    // Find the page in the current "pages" state without making it a dependency that triggers this effect
    // We can do this by using a ref or just trusting the currentPageId change
    // But since "pages" might not be loaded yet when currentPageId is set initially, we need to be careful.

    // Better approach: Only update if the PAGE ID changes.
    // We need 'pages' to find the content, but we don't want to re-run when 'pages' updates.
    // We can use a ref to store the previous pageId to differentiate.

    const currentPage = pages.find(p => p.id === currentPageId)
    if (!currentPage) return

    // Check if we are already editing this page to avoid re-setting content
    // The editor content is the source of truth while editing.
    // We only want to load from 'pages' when we SWITCH pages.

    // However, since 'pages' is in the dependency array, this runs on every save.
    // The fix is to REMOVE 'pages' from dependency array, but we still need access to it.
    // But React hooks rules say we must include it.

    // Solution: Split the logic.
  }, [currentPageId]) // Only re-run when ID changes

  // Actual content loading mechanism
  useEffect(() => {
    if (!editor || !currentPageId) return

    // We need to fetch the content from the pages array.
    // Since we removed 'pages' from the dependency above to avoid loops, 
    // we need a way to get the *correct* page content when currentPageId changes.

    const page = pages.find(p => p.id === currentPageId)
    if (!page) return

    // Only set content if it's different or we're switching pages
    // To cleanly solve this without suppressing lint rules or complex refs:
    // We can accept that this effect runs on page switch, and we access 'pages' via a ref or similar if we want to be 100% clean,
    // OR just disable the lint rule for this specific line if we are sure 'pages' is stable enough or handled via other means.

    // Actually, the cleanest way in this specific codebase context:
    // We trust that when `currentPageId` changes, `pages` is already populated.

    // Wrap content update in setTimeout to avoid flushSync error with React NodeViews
    // effectively moving this to a micro-task/next tick
    setTimeout(() => {
      if (!editor || editor.isDestroyed) return

      try {
        if (page.content) {
          const json = JSON.parse(page.content)
          // Only set if editor is empty or completely different ID (already handled by dependency change)
          editor.commands.setContent(json)
        } else {
          editor.commands.setContent('')
        }

        // Clear history so undo doesn't go back to empty
        editor.commands.focus('start')

        // Allow some time for the DOM to update before extracting headings
        setTimeout(() => {
          extractHeadings()
        }, 100)
      } catch (e) {
        console.error('Failed to load page content:', e)
        // Fallback to empty content on error
        editor.commands.setContent('')
      }
    }, 0)
  }, [currentPageId, editor]) // REMOVED 'pages' dependency to prevent feedback loop


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

    setPages(prevPages => {
      const updatedPages = [...prevPages, newPage]
      saveToLocalStorage(updatedPages)
      debouncedDriveSync(updatedPages)
      return updatedPages
    })
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

      saveToLocalStorage(newPages)
      debouncedDriveSync(newPages)

      return newPages
    })
  }

  // Handle page title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value

    setPages(prevPages => {
      const updatedPages = prevPages.map(page =>
        page.id === currentPageId
          ? { ...page, title: newTitle, updatedAt: Date.now() }
          : page
      )

      // Trigger side effects
      saveToLocalStorage(updatedPages)
      debouncedDriveSync(updatedPages)

      return updatedPages
    })
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
      setPages(prevPages => {
        const updatedPages = prevPages.map(page =>
          page.id === currentPageId
            ? { ...page, content: '', updatedAt: Date.now() }
            : page
        )
        saveToLocalStorage(updatedPages)
        debouncedDriveSync(updatedPages)
        return updatedPages
      })
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
