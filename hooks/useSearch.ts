import { useEffect, useRef, useState } from 'react'
import { GDFile } from '../declarations/types.ts'
import { FileSection } from './useFileExplorer.ts'

interface SearchProps {
  sections: Record<string, FileSection>
  loading: boolean
  error: string | null
}

export function useSearch({ sections }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const getSearchResults = () => {
    if (!debouncedQuery) return []

    const allFiles = Object.entries(sections).flatMap(([sectionId, section]) =>
      section.files.map((file: GDFile) => ({ ...file, section: sectionId }))
    )

    return allFiles.filter((file) => file.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
  }

  const getFilteredFiles = (section: string): GDFile[] => {
    if (searchQuery) {
      const sectionFiles = getSectionFiles(section)
      return sectionFiles.filter((file) => file.name.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return getSectionFiles(section)
  }

  const getSectionFiles = (section: string): GDFile[] => {
    switch (section) {
      case 'mydrive':
        return sections['mydrive'].files
      case 'shared':
        return sections['shared'].files
      case 'recent':
        return sections['recent'].files
      case 'starred':
        return sections['starred'].files
      case 'trash':
        return sections['trash'].files
      default:
        return []
    }
  }

  return {
    searchQuery,
    setSearchQuery,
    searchTimeoutRef,
    getSearchResults,
    getFilteredFiles,
    getSectionFiles,
  }
}
