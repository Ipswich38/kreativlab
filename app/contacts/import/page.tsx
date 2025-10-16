"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Upload } from "lucide-react"
import Link from "next/link"

interface CSVContact {
  email: string
  name?: string
  clinic_name?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip_code?: string
  country?: string
  notes?: string
}

export default function ImportContactsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [preview, setPreview] = useState<CSVContact[]>([])
  const router = useRouter()
  const supabase = createClient()

  const parseCSV = (text: string): CSVContact[] => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) throw new Error("CSV file must have at least a header row and one data row")

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
    const emailIndex = headers.indexOf("email")

    if (emailIndex === -1) throw new Error("CSV must have an 'email' column")

    const contacts: CSVContact[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim())
      if (values[emailIndex]) {
        const contact: CSVContact = {
          email: values[emailIndex],
          name: values[headers.indexOf("name")] || undefined,
          clinic_name: values[headers.indexOf("clinic_name")] || undefined,
          phone: values[headers.indexOf("phone")] || undefined,
          address: values[headers.indexOf("address")] || undefined,
          city: values[headers.indexOf("city")] || undefined,
          state: values[headers.indexOf("state")] || undefined,
          zip_code: values[headers.indexOf("zip_code")] || undefined,
          country: values[headers.indexOf("country")] || undefined,
          notes: values[headers.indexOf("notes")] || undefined,
        }
        contacts.push(contact)
      }
    }

    return contacts
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setError(null)
    setSuccess(null)
    setPreview([])

    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file")
      return
    }

    try {
      const text = await selectedFile.text()
      const contacts = parseCSV(text)

      if (contacts.length === 0) {
        setError("No valid contacts found in CSV")
        return
      }

      setFile(selectedFile)
      setPreview(contacts.slice(0, 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error parsing CSV file")
    }
  }

  const handleImport = async () => {
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const text = await file.text()
      const contacts = parseCSV(text)

      const { error: insertError } = await supabase.from("contacts").insert(contacts)

      if (insertError) throw insertError

      setSuccess(`Successfully imported ${contacts.length} contact(s)`)
      setTimeout(() => router.push("/contacts"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error importing contacts")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-2xl">
        <Link href="/contacts" className="flex items-center gap-2 text-primary hover:underline w-fit">
          <ArrowLeft size={18} />
          Back to Contacts
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Import Contacts</h1>
          <p className="text-muted-foreground mt-1">Upload a CSV file with your prospect data</p>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/50 transition-colors">
              <Upload className="mx-auto mb-4 text-muted-foreground" size={32} />
              <label className="cursor-pointer">
                <p className="font-semibold text-foreground mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-muted-foreground">CSV files only</p>
                <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {/* Error */}
            {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

            {/* Success */}
            {success && <div className="p-4 bg-green-500/10 text-green-700 rounded-lg text-sm">{success}</div>}

            {/* CSV Format Help */}
            <div className="bg-secondary p-4 rounded-lg">
              <p className="font-semibold text-sm mb-2">CSV Format:</p>
              <p className="text-xs text-muted-foreground font-mono">
                email,name,clinic_name,phone,address,city,state,zip_code,country,notes
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                The <strong>email</strong> column is required. Other columns are optional.
              </p>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-3">
                  Preview ({preview.length} of {preview.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Clinic</th>
                        <th className="px-3 py-2 text-left">City</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((contact, idx) => (
                        <tr key={idx} className="border-b border-border">
                          <td className="px-3 py-2">{contact.email}</td>
                          <td className="px-3 py-2">{contact.name || "-"}</td>
                          <td className="px-3 py-2">{contact.clinic_name || "-"}</td>
                          <td className="px-3 py-2">{contact.city || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            {file && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading ? "Importing..." : "Import Contacts"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null)
                    setPreview([])
                  }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
