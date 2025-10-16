"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Trash2, Download, FileText } from "lucide-react"

interface Document {
  id: string
  file_name: string
  file_type: string
  file_size: number
  created_at: string
  file_url: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setIsLoading(true)
      const { data, error: fetchError } = await supabase
        .from("attachments")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError
      setDocuments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading documents")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)

    try {
      // In production, upload to Vercel Blob or similar service
      // For now, store file metadata in database
      const { error: insertError } = await supabase.from("attachments").insert([
        {
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: URL.createObjectURL(file), // In production, use actual storage URL
        },
      ])

      if (insertError) throw insertError
      fetchDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error uploading file")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return

    try {
      const { error: deleteError } = await supabase.from("attachments").delete().eq("id", id)

      if (deleteError) throw deleteError
      setDocuments(documents.filter((d) => d.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting document")
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄"
    if (fileType.includes("word") || fileType.includes("document")) return "📝"
    if (fileType.includes("sheet") || fileType.includes("excel")) return "📊"
    if (fileType.includes("image")) return "🖼️"
    return "📎"
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-1">Manage whitepapers, case studies, and attachments</p>
          </div>
          <label>
            <Button className="flex items-center gap-2 cursor-pointer">
              <Upload size={18} />
              Upload Document
            </Button>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
          </label>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

        {/* Documents Grid */}
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading documents...</div>
        ) : documents.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto text-muted-foreground/50 mb-4" size={48} />
            <p className="text-muted-foreground mb-4">No documents uploaded yet</p>
            <label>
              <Button className="flex items-center gap-2 mx-auto cursor-pointer">
                <Upload size={18} />
                Upload Your First Document
              </Button>
              <input
                type="file"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </label>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(doc.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="flex gap-2 pt-3 border-t border-border">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent flex items-center gap-2">
                      <Download size={14} />
                      Download
                    </Button>
                  </a>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Copy Link
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Uploaded {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Usage Tips */}
        <Card className="p-6 bg-secondary/50">
          <h3 className="font-semibold mb-3">Document Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Upload whitepapers, case studies, and business documents</li>
            <li>• Attach documents to email campaigns for easy sharing</li>
            <li>• Supported formats: PDF, Word, Excel, PowerPoint, and text files</li>
            <li>• Maximum file size: 25 MB per document</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}
