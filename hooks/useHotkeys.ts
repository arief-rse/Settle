import { RefObject, useCallback, useEffect, useState } from 'react'
import { GDFile } from '../declarations/types.ts'

export type GlobalHotkeyAction =
  | 'toggleSidebar'
  | 'focusSearch'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'delete'
  | 'navigateUp'
  | 'navigateDown'
  | 'expand'
  | 'collapse'
  | 'select'
  | 'switchAccount'

export type Hotkey = {
  key: string
  modifiers: {
    ctrl?: boolean
    alt?: boolean
    shift?: boolean
    meta?: boolean
  }
}

export type HotkeyMap = {
  [K in GlobalHotkeyAction]: Hotkey
}

// Default shortcuts configuration
const DEFAULT_HOTKEYS: HotkeyMap = {
  toggleSidebar: { key: 'b', modifiers: { meta: true, shift: true } },
  focusSearch: { key: '/', modifiers: { meta: true, shift: true } },
  copy: { key: 'c', modifiers: { ctrl: true } },
  cut: { key: 'x', modifiers: { ctrl: true } },
  paste: { key: 'v', modifiers: { ctrl: true } },
  delete: { key: 'Delete', modifiers: {} },
  navigateUp: { key: 'ArrowUp', modifiers: {} },
  navigateDown: { key: 'ArrowDown', modifiers: {} },
  expand: { key: 'ArrowRight', modifiers: {} },
  collapse: { key: 'ArrowLeft', modifiers: {} },
  select: { key: 'Enter', modifiers: {} },
  switchAccount: { key: 'u', modifiers: { meta: true, shift: true } },
}

type UseHotkeysProps = {
  containerRef?: RefObject<HTMLElement>
  selectedFile?: GDFile | null
  clipboardFile?: { file: GDFile; operation: 'copy' | 'move' } | null
  currentFolderId?: string | null
  onToggleSidebar?: () => void
  onFocusSearch?: () => void
  onCopy?: (file: GDFile) => void
  onCut?: (file: GDFile) => void
  onPaste?: (destinationFolderId: string) => void
  onDelete?: (file: GDFile) => void
  onNavigate?: (direction: 'up' | 'down') => void
  onExpand?: () => void
  onCollapse?: () => void
  onSelect?: () => void
  onSwitchAccount?: () => void
  initialHotkeys?: HotkeyMap
  isPremium?: boolean
}

export function useHotkeys(props: UseHotkeysProps) {
  // Initialize shortcuts from localStorage or defaults
  const [hotkeys, setHotkeys] = useState<HotkeyMap>(() => {
    try {
      const saved = localStorage.getItem('gdnav-hotkeys')
      return saved ? JSON.parse(saved) : props.initialHotkeys || DEFAULT_HOTKEYS
    } catch (error) {
      console.error('Error loading shortcuts:', error)
      return DEFAULT_HOTKEYS
    }
  })

  const matchesShortcut = useCallback(
    (e: KeyboardEvent, shortcut: Hotkey): boolean => {
      return (
        e.key.toLowerCase() === shortcut.key.toLowerCase() &&
        !!shortcut.modifiers.ctrl === e.ctrlKey &&
        !!shortcut.modifiers.alt === e.altKey &&
        !!shortcut.modifiers.shift === e.shiftKey &&
        !!shortcut.modifiers.meta === e.metaKey
      )
    },
    [],
  )

  // Handle keyboard events
  useEffect(() => {
    if (!props.isPremium) return // Don't register shortcuts for non-premium users

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if we're in an input field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'Tab') return

      const shortcutHandlers = {
        toggleSidebar: props.onToggleSidebar,
        focusSearch: props.onFocusSearch,
        copy: () => props.selectedFile && props.onCopy?.(props.selectedFile),
        cut: () => props.selectedFile && props.onCut?.(props.selectedFile),
        paste: () => props.clipboardFile && props.currentFolderId && props.onPaste?.(props.currentFolderId),
        delete: () => props.selectedFile && props.onDelete?.(props.selectedFile),
        navigateUp: () => props.onNavigate?.('up'),
        navigateDown: () => props.onNavigate?.('down'),
        expand: props.onExpand,
        collapse: props.onCollapse,
        select: props.onSelect,
        switchAccount: props.onSwitchAccount,
      }

      // Find and execute matching shortcut
      Object.entries(hotkeys).forEach(([action, shortcut]) => {
        if (matchesShortcut(e, shortcut)) {
          e.preventDefault()
          shortcutHandlers[action as GlobalHotkeyAction]?.()
          return
        }
      })
    }

    const element = props.containerRef?.current || window
    element.addEventListener('keydown', handleKeyDown as EventListener)
    return () => element.removeEventListener('keydown', handleKeyDown as EventListener)
  }, [
    hotkeys,
    props.containerRef,
    props.selectedFile,
    props.clipboardFile,
    props.currentFolderId,
    matchesShortcut,
    props.onToggleSidebar,
    props.onFocusSearch,
    props.onCopy,
    props.onCut,
    props.onPaste,
    props.onDelete,
    props.onNavigate,
    props.onExpand,
    props.onCollapse,
    props.onSelect,
    props.onSwitchAccount,
    props.isPremium,
  ])

  // Save shortcuts to localStorage
  const saveHotkeys = useCallback((newShortcuts: HotkeyMap) => {
    setHotkeys(newShortcuts)
    localStorage.setItem('shortcuts', JSON.stringify(newShortcuts))
  }, [])

  return {
    hotkeys,
    saveHotkeys: props.isPremium ? saveHotkeys : undefined,
  }
}
