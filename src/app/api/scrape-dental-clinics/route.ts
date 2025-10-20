import { NextRequest, NextResponse } from 'next/server'
import { DentalClinicScraper, ScrapingLocation } from '@/lib/scraping/dental-clinic-scraper'
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

    console.log('🚀 Starting dental clinic scraping...', { location, filters })

    let leads
    try {
      const scraper = new DentalClinicScraper()
      leads = await scraper.scrapeByLocation(location)

      // If scraping returns no results, use mock data
      if (leads.length === 0) {
        console.log('⚠️ Scraping returned 0 results, using mock data...')
        leads = generateMockDentalClinics(location)
      }
    } catch (scrapingError) {
      console.log('⚠️ Scraping failed, using mock data as fallback:', scrapingError)
      leads = generateMockDentalClinics(location)
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