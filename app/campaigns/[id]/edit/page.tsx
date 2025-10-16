"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Trash2, Eye } from "lucide-react"
import Link from "next/link"

interface Campaign {
  id: string
  name: string
  subject: string
  content: string
  template_type: string
  status: string
}

interface EmailSection {
  id: string
  type: "text" | "heading" | "button" | "image"
  content: string
  alignment?: "left" | "center" | "right"
}

export default function EditCampaignPage() {
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [sections, setSections] = useState<EmailSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    fetchCampaign()
  }, [])

  const fetchCampaign = async () => {
    try {
      const { data, error: fetchError } = await supabase.from("campaigns").select("*").eq("id", params.id).single()

      if (fetchError) throw fetchError
      setCampaign(data)

      // Initialize with default sections if new
      if (!data.content) {
        setSections([
          {
            id: "1",
            type: "heading",
            content: "Welcome to Our Service",
            alignment: "center",
          },
          {
            id: "2",
            type: "text",
            content: "Add your message here...",
            alignment: "left",
          },
        ])
      } else {
        try {
          setSections(JSON.parse(data.content))
        } catch {
          setSections([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading campaign")
    } finally {
      setIsLoading(false)
    }
  }

  const addSection = (type: EmailSection["type"]) => {
    const newSection: EmailSection = {
      id: Date.now().toString(),
      type,
      content: type === "heading" ? "New Section" : "Add content here...",
      alignment: "left",
    }
    setSections([...sections, newSection])
  }

  const updateSection = (id: string, updates: Partial<EmailSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from("campaigns")
        .update({
          content: JSON.stringify(sections),
        })
        .eq("id", params.id)

      if (updateError) throw updateError
      alert("Campaign saved successfully!")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving campaign")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Loading campaign...</div>
      </DashboardLayout>
    )
  }

  if (!campaign) {
    return (
      <DashboardLayout>
        <div className="text-center text-muted-foreground">Campaign not found</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <Link href="/campaigns" className="flex items-center gap-2 text-primary hover:underline w-fit">
          <ArrowLeft size={18} />
          Back to Campaigns
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{campaign.name}</h1>
            <p className="text-muted-foreground mt-1">Subject: {campaign.subject}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 bg-transparent"
            >
              <Eye size={18} />
              {showPreview ? "Edit" : "Preview"}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {error && <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>}

        {showPreview ? (
          // Preview Mode
          <Card className="p-8 bg-white">
            <div className="max-w-2xl mx-auto space-y-4">
              {sections.map((section) => (
                <div key={section.id} className={`text-${section.alignment || "left"}`}>
                  {section.type === "heading" && <h2 className="text-2xl font-bold">{section.content}</h2>}
                  {section.type === "text" && <p className="text-base leading-relaxed">{section.content}</p>}
                  {section.type === "button" && (
                    <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium">
                      {section.content}
                    </button>
                  )}
                  {section.type === "image" && (
                    <div className="bg-secondary h-48 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">[Image: {section.content}]</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          // Edit Mode
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Toolbar */}
            <Card className="p-4 h-fit">
              <h3 className="font-semibold mb-4">Add Sections</h3>
              <div className="space-y-2">
                {(["heading", "text", "button", "image"] as const).map((type) => (
                  <Button
                    key={type}
                    onClick={() => addSection(type)}
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Plus size={16} className="mr-2" />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </Card>

            {/* Editor */}
            <div className="lg:col-span-3 space-y-4">
              {sections.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">
                  <p>No sections yet. Add one from the toolbar.</p>
                </Card>
              ) : (
                sections.map((section) => (
                  <Card key={section.id} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <p className="font-semibold text-sm capitalize">{section.type}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSection(section.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {section.type === "heading" && (
                        <div className="grid gap-2">
                          <Label htmlFor={`content-${section.id}`}>Heading Text</Label>
                          <Input
                            id={`content-${section.id}`}
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Enter heading..."
                          />
                        </div>
                      )}

                      {section.type === "text" && (
                        <div className="grid gap-2">
                          <Label htmlFor={`content-${section.id}`}>Text Content</Label>
                          <textarea
                            id={`content-${section.id}`}
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Enter text..."
                            className="min-h-24 px-3 py-2 border border-input rounded-md bg-background text-foreground"
                          />
                        </div>
                      )}

                      {section.type === "button" && (
                        <div className="grid gap-2">
                          <Label htmlFor={`content-${section.id}`}>Button Text</Label>
                          <Input
                            id={`content-${section.id}`}
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Enter button text..."
                          />
                        </div>
                      )}

                      {section.type === "image" && (
                        <div className="grid gap-2">
                          <Label htmlFor={`content-${section.id}`}>Image URL</Label>
                          <Input
                            id={`content-${section.id}`}
                            value={section.content}
                            onChange={(e) => updateSection(section.id, { content: e.target.value })}
                            placeholder="Enter image URL..."
                          />
                        </div>
                      )}

                      {section.type !== "image" && (
                        <div className="grid gap-2">
                          <Label htmlFor={`align-${section.id}`}>Alignment</Label>
                          <select
                            id={`align-${section.id}`}
                            value={section.alignment || "left"}
                            onChange={(e) =>
                              updateSection(section.id, {
                                alignment: e.target.value as "left" | "center" | "right",
                              })
                            }
                            className="px-3 py-2 border border-input rounded-md bg-background text-foreground"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
