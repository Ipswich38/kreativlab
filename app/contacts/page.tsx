"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Upload, Search, Trash2, Mail } from "lucide-react"
import Link from "next/link"

interface Contact {
  id: string
  email: string
  name: string
  clinic_name: string
  phone: string
  city: string
  created_at: string
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
  }, [])

  useEffect(() => {
    const filtered = contacts.filter(
      (contact) =>
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredContacts(filtered)
  }, [searchTerm, contacts])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase.from("contacts").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setContacts(data || [])
    } catch (error) {
      console.error("Error fetching contacts:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contact?")) return

    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id)
      if (error) throw error
      setContacts(contacts.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Error deleting contact:", error)
    }
  }

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(filteredContacts.map((c) => c.id)))
    }
  }

  const handleSelectContact = (id: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedContacts(newSelected)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
            <p className="text-muted-foreground mt-1">Manage your prospect database</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/contacts/import">
              <Button className="flex items-center gap-2">
                <Upload size={18} />
                <span className="hidden sm:inline">Import CSV</span>
              </Button>
            </Link>
            <Link href="/contacts/new">
              <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                <Plus size={18} />
                <span className="hidden sm:inline">Add Contact</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
          <Input
            placeholder="Search by email, name, or clinic..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Bulk actions */}
        {selectedContacts.size > 0 && (
          <Card className="p-4 bg-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm font-medium">{selectedContacts.size} contact(s) selected</p>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 bg-transparent w-full sm:w-auto"
              onClick={() => router.push(`/campaigns/new?contacts=${Array.from(selectedContacts).join(",")}`)}
            >
              <Mail size={16} />
              Send Campaign
            </Button>
          </Card>
        )}

        {/* Contacts Table - Mobile optimized */}
        <Card className="overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading contacts...</div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No contacts found</p>
              <Link href="/contacts/import">
                <Button className="flex items-center gap-2 mx-auto">
                  <Upload size={18} />
                  Import Contacts
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                        onChange={handleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Name</th>
                    <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Clinic</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedContacts.has(contact.id)}
                          onChange={() => handleSelectContact(contact.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-4 font-medium truncate">{contact.email}</td>
                      <td className="px-4 py-4 hidden md:table-cell">{contact.name || "-"}</td>
                      <td className="px-4 py-4 hidden lg:table-cell">{contact.clinic_name || "-"}</td>
                      <td className="px-4 py-4 flex gap-2">
                        <Link href={`/contacts/${contact.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
