"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail } from "lucide-react"
import Link from "next/link"

interface Contact {
  id: string
  email: string
  name: string
  clinic_name: string
  phone: string
  address: string
  city: string
  state: string
  zip_code: string
  country: string
  notes: string
  created_at: string
}

export default function ContactDetailPage() {
  const [contact, setContact] = useState<Contact | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Contact>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    fetchContact()
  }, [])

  const fetchContact = async () => {
    try {
      const { data, error: fetchError } = await supabase.from("contacts").select("*").eq("id", params.id).single()

      if (fetchError) throw fetchError
      setContact(data)
      setFormData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading contact")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase.from("contacts").update(formData).eq("id", params.id)

      if (updateError) throw updateError
      setContact(formData as Contact)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving contact")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Loading contact...</div>
      </DashboardLayout>
    )
  }

  if (!contact) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Contact not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-2xl">
        <Link href="/contacts" className="flex items-center gap-2 text-primary hover:underline w-fit">
          <ArrowLeft size={18} />
          Back to Contacts
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{contact.name || contact.email}</h1>
            <p className="text-muted-foreground mt-1">{contact.clinic_name}</p>
          </div>
          <Button className="flex items-center gap-2">
            <Mail size={18} />
            Send Email
          </Button>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

        <Card className="p-6">
          {isEditing ? (
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email || ""} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" value={formData.name || ""} onChange={handleChange} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="clinic_name">Clinic Name</Label>
                <Input id="clinic_name" name="clinic_name" value={formData.clinic_name || ""} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={formData.phone || ""} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" name="address" value={formData.address || ""} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={formData.city || ""} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" value={formData.state || ""} onChange={handleChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input id="zip_code" name="zip_code" value={formData.zip_code || ""} onChange={handleChange} />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" value={formData.country || ""} onChange={handleChange} />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  className="min-h-24 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium mt-1">{contact.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium mt-1">{contact.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Clinic Name</p>
                  <p className="font-medium mt-1">{contact.clinic_name || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium mt-1">{contact.address || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">City</p>
                  <p className="font-medium mt-1">{contact.city || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">State</p>
                  <p className="font-medium mt-1">{contact.state || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ZIP Code</p>
                  <p className="font-medium mt-1">{contact.zip_code || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="font-medium mt-1">{contact.country || "-"}</p>
                </div>
              </div>

              {contact.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium mt-1">{contact.notes}</p>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={() => setIsEditing(true)}>Edit Contact</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
