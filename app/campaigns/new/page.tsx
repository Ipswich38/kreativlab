"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

type Step = "details" | "recipients" | "template" | "review"

interface Contact {
  id: string
  email: string
  name: string
  clinic_name: string
}

export default function NewCampaignPage() {
  const [step, setStep] = useState<Step>("details")
  const [campaignName, setCampaignName] = useState("")
  const [subject, setSubject] = useState("")
  const [templateType, setTemplateType] = useState<"email" | "newsletter">("email")
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    fetchContacts()
    // Check if contacts were pre-selected from contacts page
    const contactsParam = searchParams.get("contacts")
    if (contactsParam) {
      setSelectedContacts(new Set(contactsParam.split(",")))
    }
  }, [])

  const fetchContacts = async () => {
    try {
      const { data, error: fetchError } = await supabase.from("contacts").select("id, email, name, clinic_name")

      if (fetchError) throw fetchError
      setAllContacts(data || [])
    } catch (err) {
      console.error("Error fetching contacts:", err)
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

  const handleSelectAll = () => {
    if (selectedContacts.size === allContacts.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(allContacts.map((c) => c.id)))
    }
  }

  const handleNext = () => {
    if (step === "details") {
      if (!campaignName || !subject) {
        setError("Campaign name and subject are required")
        return
      }
      setError(null)
      setStep("recipients")
    } else if (step === "recipients") {
      if (selectedContacts.size === 0) {
        setError("Please select at least one recipient")
        return
      }
      setError(null)
      setStep("template")
    } else if (step === "template") {
      setError(null)
      setStep("review")
    }
  }

  const handleCreate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .insert([
          {
            name: campaignName,
            subject: subject,
            template_type: templateType,
            status: "draft",
            recipient_count: selectedContacts.size,
          },
        ])
        .select()

      if (campaignError) throw campaignError

      const campaignId = campaignData[0].id

      // Add recipients
      const recipients = Array.from(selectedContacts).map((contactId) => ({
        campaign_id: campaignId,
        contact_id: contactId,
        status: "pending",
      }))

      const { error: recipientError } = await supabase.from("campaign_recipients").insert(recipients)

      if (recipientError) throw recipientError

      router.push(`/campaigns/${campaignId}/edit`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating campaign")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        <Link href="/campaigns" className="flex items-center gap-2 text-primary hover:underline w-fit">
          <ArrowLeft size={18} />
          Back to Campaigns
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Step {["details", "recipients", "template", "review"].indexOf(step) + 1} of 4
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2">
          {(["details", "recipients", "template", "review"] as const).map((s, idx) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                ["details", "recipients", "template", "review"].indexOf(step) >= idx ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

        {/* Step: Details */}
        {step === "details" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Campaign Details</h2>
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Campaign Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Spring Dental Services Promotion"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="subject">Email Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Improve Your Dental Practice with Our VA Services"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Template Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  {(["email", "newsletter"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setTemplateType(type)}
                      className={`p-4 border-2 rounded-lg transition-colors text-left ${
                        templateType === type ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-semibold capitalize">{type}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {type === "email" ? "Single focused message" : "Multi-section newsletter"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step: Recipients */}
        {step === "recipients" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Select Recipients</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-semibold">{selectedContacts.size} selected</p>
                  <p className="text-sm text-muted-foreground">of {allContacts.length} total contacts</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="bg-transparent">
                  {selectedContacts.size === allContacts.length ? "Deselect All" : "Select All"}
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  {allContacts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <p>No contacts available</p>
                      <Link href="/contacts/import" className="text-primary hover:underline mt-2 inline-block">
                        Import contacts
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {allContacts.map((contact) => (
                        <label
                          key={contact.id}
                          className="flex items-center gap-3 p-4 hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedContacts.has(contact.id)}
                            onChange={() => handleSelectContact(contact.id)}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{contact.email}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {contact.name || contact.clinic_name || "No name"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step: Template */}
        {step === "template" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Email Template</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                You'll be able to design your email content in the next step. For now, let's proceed to the review.
              </p>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="font-semibold text-sm mb-2">Preview:</p>
                <div className="bg-background p-4 rounded border border-border">
                  <p className="text-xs text-muted-foreground">Subject: {subject}</p>
                  <p className="text-sm mt-2 text-foreground">Your email content will appear here</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Review Campaign</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Campaign Name</p>
                  <p className="font-semibold mt-1">{campaignName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Template Type</p>
                  <p className="font-semibold mt-1 capitalize">{templateType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subject Line</p>
                  <p className="font-semibold mt-1">{subject}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p className="font-semibold mt-1">{selectedContacts.size} contacts</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-4">
          {step !== "details" && (
            <Button
              variant="outline"
              onClick={() => {
                const steps: Step[] = ["details", "recipients", "template", "review"]
                const currentIdx = steps.indexOf(step)
                setStep(steps[currentIdx - 1])
              }}
              className="bg-transparent"
            >
              Back
            </Button>
          )}
          {step !== "review" ? (
            <Button onClick={handleNext} className="flex items-center gap-2">
              Next
              <ChevronRight size={18} />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
