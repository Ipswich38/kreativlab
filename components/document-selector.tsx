"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, X } from "lucide-react"

interface Document {
  id: string
  file_name: string
  file_size: number
}

interface DocumentSelectorProps {
  selectedDocuments: string[]
  onSelectionChange: (ids: string[]) => void
}

export function DocumentSelector({ selectedDocuments, onSelectionChange }: DocumentSelectorProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const { data } = await supabase.from("attachments").select("id, file_name, file_size")

      setDocuments(data || [])
    } catch (error) {
      console.error("Error fetching documents:", error)
    }
  }

  const toggleDocument = (id: string) => {
    const newSelected = selectedDocuments.includes(id)
      ? selectedDocuments.filter((d) => d !== id)
      : [...selectedDocuments, id]
    onSelectionChange(newSelected)
  }

  const getSelectedDocs = () => documents.filter((d) => selectedDocuments.includes(d.id))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Attachments</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-transparent"
        >
          <Plus size={16} />
          Add
        </Button>
      </div>

      {/* Selected Documents */}
      {getSelectedDocs().length > 0 && (
        <div className="space-y-2">
          {getSelectedDocs().map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-2 bg-secondary rounded-lg">
              <p className="text-sm truncate">{doc.file_name}</p>
              <button onClick={() => toggleDocument(doc.id)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Document Selector */}
      {isOpen && (
        <Card className="p-4 space-y-2 max-h-48 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents available</p>
          ) : (
            documents.map((doc) => (
              <label key={doc.id} className="flex items-center gap-2 p-2 hover:bg-secondary rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDocuments.includes(doc.id)}
                  onChange={() => toggleDocument(doc.id)}
                  className="rounded"
                />
                <span className="text-sm truncate">{doc.file_name}</span>
              </label>
            ))
          )}
        </Card>
      )}
    </div>
  )
}
