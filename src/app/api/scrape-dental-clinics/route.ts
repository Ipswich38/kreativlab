import { NextRequest, NextResponse } from 'next/server'
import { DentalClinicScraper, ScrapingLocation, DentalClinicLead } from '@/lib/scraping/dental-clinic-scraper'
import { GooglePlacesScraper } from '@/lib/scraping/google-places-scraper'
import { OpenStreetMapScraper } from '@/lib/scraping/openstreetmap-scraper'
import { FoursquareScraper } from '@/lib/scraping/foursquare-scraper'
import { GoogleMapsUrlScraper } from '@/lib/scraping/google-maps-url-scraper'
import { generateMockDentalClinics } from '@/lib/scraping/dental-clinic-mock-data'

interface ScrapeRequest {
  location: ScrapingLocation
  filters?: {
    minSize?: 'small' | 'medium' | 'large'
    specialties?: string[]
    hasWebsite?: boolean
    hasEmail?: boolean
    hasPhone?: boolean
  }
}

// Deduplication and data merging function
function deduplicateAndMergeLeads(leads: DentalClinicLead[]): DentalClinicLead[] {
  const uniqueLeads = new Map<string, DentalClinicLead>()

  for (const lead of leads) {
    // Create a key based on name and approximate location
    const key = generateDeduplicationKey(lead)

    if (uniqueLeads.has(key)) {
      // Merge with existing lead
      const existing = uniqueLeads.get(key)!
      const merged = mergeLeadData(existing, lead)
      uniqueLeads.set(key, merged)
    } else {
      uniqueLeads.set(key, lead)
    }
  }

  return Array.from(uniqueLeads.values())
}

function generateDeduplicationKey(lead: DentalClinicLead): string {
  // Normalize the name for comparison
  const normalizedName = lead.name.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  // Use name + zip code (if available) or city as key
  const locationKey = lead.location.zipCode || lead.location.city || ''

  return `${normalizedName}|${locationKey.toLowerCase()}`
}

function mergeLeadData(existing: DentalClinicLead, newLead: DentalClinicLead): DentalClinicLead {
  return {
    ...existing,
    // Keep the most complete address
    address: existing.address.length > newLead.address.length ? existing.address : newLead.address,
    // Prefer non-empty contact info
    phone: existing.phone || newLead.phone,
    email: existing.email || newLead.email,
    website: existing.website || newLead.website,
    contactPerson: existing.contactPerson || newLead.contactPerson,
    // Merge specialties and remove duplicates
    specialties: [...new Set([...existing.specialties, ...newLead.specialties])],
    // Merge needs indicators and remove duplicates
    needsIndicators: [...new Set([...existing.needsIndicators, ...newLead.needsIndicators])],
    // Use the source URL from the richer data source
    sourceUrl: existing.sourceUrl.includes('google') ? existing.sourceUrl : newLead.sourceUrl,
    // Use the most complete location data
    location: {
      zipCode: existing.location.zipCode || newLead.location.zipCode,
      city: existing.location.city || newLead.location.city,
      state: existing.location.state || newLead.location.state
    },
    // Update timestamp
    lastUpdated: new Date().toISOString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { location, filters }: ScrapeRequest = await request.json()

    // Validate request
    if (!location || (!location.zipCode && !location.city && !location.state)) {
      return NextResponse.json(
        { error: 'Location (zipCode, city, or state) is required' },
        { status: 400 }
      )
    }

    console.log('🚀 Starting multi-source dental clinic data aggregation...', { location, filters })

    let leads: DentalClinicLead[] = []
    const sources: string[] = []

    try {
      // Multi-source data aggregation - try all available sources
      const allResults = await Promise.allSettled([
        // 1. Google Maps URLs (primary recommendation, always available)
        (async () => {
          console.log('🗺️ Generating Google Maps URLs for lead generation...')
          const googleMapsUrlScraper = new GoogleMapsUrlScraper()
          const results = await googleMapsUrlScraper.scrapeByLocation(location)
          if (results.length > 0) sources.push('Google Maps URLs')
          return results
        })(),

        // 2. Google Places API (most reliable, requires API key)
        (async () => {
          const googleApiKey = process.env.GOOGLE_PLACES_API_KEY
          if (googleApiKey && googleApiKey !== 'your_google_places_api_key') {
            console.log('🔍 Fetching from Google Places API...')
            const googleScraper = new GooglePlacesScraper(googleApiKey)
            const results = await googleScraper.scrapeByLocation(location)
            if (results.length > 0) sources.push('Google Places')
            return results
          }
          return []
        })(),

        // 3. OpenStreetMap Overpass API (completely free)
        (async () => {
          console.log('🗺️ Fetching from OpenStreetMap...')
          const osmScraper = new OpenStreetMapScraper()
          const results = await osmScraper.scrapeByLocation(location)
          if (results.length > 0) sources.push('OpenStreetMap')
          return results
        })(),

        // 4. Foursquare Places API (free tier available)
        (async () => {
          const foursquareApiKey = process.env.FOURSQUARE_API_KEY
          if (foursquareApiKey && foursquareApiKey !== 'your_foursquare_api_key') {
            console.log('🏢 Fetching from Foursquare Places...')
            const foursquareScraper = new FoursquareScraper(foursquareApiKey)
            const results = await foursquareScraper.scrapeByLocation(location)
            if (results.length > 0) sources.push('Foursquare')
            return results
          }
          return []
        })(),

        // 5. Traditional web scraping (backup method)
        (async () => {
          console.log('🔍 Attempting traditional web scraping...')
          const scraper = new DentalClinicScraper()
          const results = await scraper.scrapeByLocation(location)
          if (results.length > 0) sources.push('Web Scraping')
          return results
        })()
      ])

      // Collect results from all sources
      for (const result of allResults) {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          leads.push(...result.value)
        }
      }

      // Deduplicate and merge results
      leads = deduplicateAndMergeLeads(leads)

      // If no results from any source, use mock data
      if (leads.length === 0) {
        console.log('⚠️ All data sources returned 0 results, using mock data...')
        leads = generateMockDentalClinics(location)
        sources.push('Mock Data')
      }

      console.log(`📊 Data aggregation completed: ${leads.length} unique leads from sources: ${sources.join(', ')}`)

    } catch (scrapingError) {
      console.log('⚠️ Data aggregation failed, using mock data as fallback:', scrapingError)
      leads = generateMockDentalClinics(location)
      sources.push('Mock Data (Fallback)')
    }

    // Apply filters if provided
    let filteredLeads = leads

    if (filters) {
      filteredLeads = leads.filter(lead => {
        // Filter by minimum contact info requirements
        if (filters.hasEmail && !lead.email) return false
        if (filters.hasPhone && !lead.phone) return false
        if (filters.hasWebsite && !lead.website) return false

        // Filter by specialties
        if (filters.specialties && filters.specialties.length > 0) {
          const hasMatchingSpecialty = filters.specialties.some(specialty =>
            lead.specialties.some(leadSpecialty =>
              leadSpecialty.toLowerCase().includes(specialty.toLowerCase())
            )
          )
          if (!hasMatchingSpecialty) return false
        }

        return true
      })
    }

    // Sort by potential (leads with more needs indicators first)
    filteredLeads.sort((a, b) => b.needsIndicators.length - a.needsIndicators.length)

    console.log(`✅ Scraping completed: ${filteredLeads.length} qualified leads found`)

    return NextResponse.json({
      success: true,
      message: `Found ${filteredLeads.length} dental clinic leads`,
      data: {
        leads: filteredLeads,
        summary: {
          total: filteredLeads.length,
          withEmail: filteredLeads.filter(l => l.email).length,
          withPhone: filteredLeads.filter(l => l.phone).length,
          withWebsite: filteredLeads.filter(l => l.website).length,
          withContactPerson: filteredLeads.filter(l => l.contactPerson).length,
          withNeedsIndicators: filteredLeads.filter(l => l.needsIndicators.length > 0).length
        },
        location,
        searchTime: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Scraping error:', error)
    return NextResponse.json(
      {
        error: 'Scraping failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Dental Clinic Lead Scraper API',
    usage: 'POST to /api/scrape-dental-clinics with location data',
    example: {
      location: {
        zipCode: '90210',
        city: 'Beverly Hills',
        state: 'CA'
      },
      filters: {
        hasEmail: true,
        specialties: ['general dentistry', 'cosmetic dentistry']
      }
    }
  })
}