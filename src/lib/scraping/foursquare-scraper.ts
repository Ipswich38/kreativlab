import axios from 'axios'
import { DentalClinicLead, ScrapingLocation } from './dental-clinic-scraper'

export class FoursquareScraper {
  private readonly apiKey: string
  private readonly baseUrl = 'https://api.foursquare.com/v3/places'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async scrapeByLocation(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    console.log('🏢 Starting Foursquare Places API search for dental clinics...')

    if (!this.apiKey || this.apiKey === 'your_foursquare_api_key') {
      console.log('⚠️ Foursquare API key not configured, skipping...')
      return []
    }

    try {
      // Build search parameters
      const searchParams = this.buildSearchParams(location)

      // Search for dental clinics
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: searchParams,
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      })

      if (response.data && response.data.results) {
        const leads = await this.processResults(response.data.results)
        console.log(`✅ Found ${leads.length} dental clinics via Foursquare Places API`)
        return leads
      }

      return []

    } catch (error) {
      console.error('❌ Foursquare API error:', error)
      throw error
    }
  }

  private buildSearchParams(location: ScrapingLocation): any {
    const params: any = {
      query: 'dentist dental clinic orthodontist oral surgeon',
      categories: '17000,17001', // Health & Medicine categories
      limit: 50
    }

    // Location parameters
    if (location.zipCode) {
      params.near = location.zipCode
    } else if (location.city && location.state) {
      params.near = `${location.city}, ${location.state}`
    } else if (location.city) {
      params.near = location.city
    }

    // Add radius if specified
    if (location.radius) {
      params.radius = Math.min(location.radius * 1000, 100000) // Convert to meters, max 100km
    } else {
      params.radius = 25000 // Default 25km radius
    }

    return params
  }

  private async processResults(results: any[]): Promise<DentalClinicLead[]> {
    const leads: DentalClinicLead[] = []

    for (const place of results) {
      try {
        // Filter for dental-related businesses
        if (!this.isDentalBusiness(place)) {
          continue
        }

        // Get detailed information
        const detailedPlace = await this.getPlaceDetails(place.fsq_id)
        const lead = this.convertToLead(detailedPlace || place)

        if (lead) {
          leads.push(lead)
        }

        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error processing Foursquare place ${place.name}:`, error)
        // Continue with other places
      }
    }

    return leads
  }

  private async getPlaceDetails(fsqId: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/${fsqId}`, {
        params: {
          fields: 'name,location,contact,website,hours,rating,stats,description,categories'
        },
        headers: {
          'Authorization': this.apiKey,
          'Accept': 'application/json'
        }
      })

      return response.data

    } catch (error) {
      console.error('Error getting Foursquare place details:', error)
      return null
    }
  }

  private isDentalBusiness(place: any): boolean {
    const dentalKeywords = [
      'dental', 'dentist', 'orthodont', 'oral surgery', 'oral surgeon',
      'periodontal', 'endodont', 'prosthodont', 'oral health',
      'teeth', 'smile', 'dds', 'dmd', 'tooth', 'cavity'
    ]

    // Check name
    const name = (place.name || '').toLowerCase()
    const nameMatch = dentalKeywords.some(keyword => name.includes(keyword))

    // Check categories
    let categoryMatch = false
    if (place.categories) {
      const categoryNames = place.categories.map((cat: any) => (cat.name || '').toLowerCase()).join(' ')
      categoryMatch = dentalKeywords.some(keyword => categoryNames.includes(keyword))
    }

    return nameMatch || categoryMatch
  }

  private convertToLead(place: any): DentalClinicLead | null {
    if (!place.name) {
      return null
    }

    // Extract location information
    const location = this.extractLocation(place.location)
    const address = this.buildAddress(place.location)

    // Extract contact information
    const phone = this.extractPhone(place.contact)
    const email = this.extractEmail(place.contact)
    const website = place.website

    // Extract specialties
    const specialties = this.extractSpecialties(place)

    // Detect needs indicators
    const needsIndicators = this.detectNeedsIndicators(place)

    return {
      id: this.generateId(place.name, address),
      name: place.name,
      address,
      phone,
      email,
      website,
      specialties,
      needsIndicators,
      sourceUrl: `https://foursquare.com/v/${place.fsq_id}`,
      location,
      businessSize: this.estimateBusinessSize(place),
      lastUpdated: new Date().toISOString()
    }
  }

  private extractLocation(locationData: any): { zipCode: string; city: string; state: string } {
    if (!locationData) {
      return { zipCode: '', city: '', state: '' }
    }

    return {
      zipCode: locationData.postcode || '',
      city: locationData.locality || '',
      state: locationData.region || ''
    }
  }

  private buildAddress(locationData: any): string {
    if (!locationData) {
      return ''
    }

    const parts = []

    if (locationData.address) {
      parts.push(locationData.address)
    }

    if (locationData.locality) {
      parts.push(locationData.locality)
    }

    if (locationData.region) {
      parts.push(locationData.region)
    }

    if (locationData.postcode) {
      parts.push(locationData.postcode)
    }

    return parts.join(', ')
  }

  private extractPhone(contactData: any): string | undefined {
    if (!contactData) return undefined

    const phone = contactData.phone
    if (!phone) return undefined

    return this.cleanPhone(phone)
  }

  private extractEmail(contactData: any): string | undefined {
    return contactData?.email
  }

  private extractSpecialties(place: any): string[] {
    const specialties: string[] = []

    // Check categories
    if (place.categories) {
      for (const category of place.categories) {
        const categoryName = (category.name || '').toLowerCase()

        if (categoryName.includes('orthodont')) specialties.push('Orthodontics')
        if (categoryName.includes('oral surgery') || categoryName.includes('oral surgeon')) specialties.push('Oral Surgery')
        if (categoryName.includes('endodont')) specialties.push('Endodontics')
        if (categoryName.includes('periodont')) specialties.push('Periodontics')
        if (categoryName.includes('prosthodont')) specialties.push('Prosthodontics')
        if (categoryName.includes('pediatric') || categoryName.includes('children')) specialties.push('Pediatric Dentistry')
        if (categoryName.includes('cosmetic')) specialties.push('Cosmetic Dentistry')
      }
    }

    // Check name for specialties
    const name = (place.name || '').toLowerCase()
    if (name.includes('orthodont')) specialties.push('Orthodontics')
    if (name.includes('oral surgery')) specialties.push('Oral Surgery')
    if (name.includes('endodont')) specialties.push('Endodontics')
    if (name.includes('periodont')) specialties.push('Periodontics')
    if (name.includes('pediatric') || name.includes('kids')) specialties.push('Pediatric Dentistry')
    if (name.includes('cosmetic') || name.includes('smile')) specialties.push('Cosmetic Dentistry')

    // Default to general dentistry if no specialties found
    if (specialties.length === 0) {
      specialties.push('General Dentistry')
    }

    return [...new Set(specialties)] // Remove duplicates
  }

  private detectNeedsIndicators(place: any): string[] {
    const indicators: string[] = []

    // Check stats for business activity
    if (place.stats) {
      if (place.stats.total_photos > 10) {
        indicators.push('Active Social Media Presence')
      }

      if (place.stats.total_tips > 5) {
        indicators.push('Customer Engagement')
      }
    }

    // Check rating for success indicators
    if (place.rating >= 4.0) {
      indicators.push('Highly Rated Practice')
    }

    // Check for hours to determine activity level
    if (place.hours) {
      indicators.push('Structured Schedule')

      if (place.hours.popular && place.hours.popular.length > 0) {
        indicators.push('Busy Practice')
      }
    }

    // Practices without websites might need digital admin support
    if (!place.website) {
      indicators.push('Limited Online Presence')
    }

    // Practices without detailed contact info might need communication setup
    if (!place.contact?.email) {
      indicators.push('Email Setup Opportunity')
    }

    if (!place.contact?.phone) {
      indicators.push('Phone System Setup Opportunity')
    }

    return indicators
  }

  private estimateBusinessSize(place: any): 'small' | 'medium' | 'large' {
    let score = 0

    // Indicators of larger practices
    if (place.website) score += 1
    if (place.contact?.email) score += 1
    if (place.contact?.phone) score += 1
    if (place.stats?.total_photos > 10) score += 1
    if (place.stats?.total_tips > 5) score += 1
    if (place.rating >= 4.0) score += 1
    if (place.hours && place.hours.display) score += 1

    if (score >= 5) return 'large'
    if (score >= 3) return 'medium'
    return 'small'
  }

  private cleanPhone(phone: string): string {
    if (!phone) return ''

    // Remove all non-digit characters
    const cleaned = phone.replace(/[^\d]/g, '')

    // Format as (XXX) XXX-XXXX if we have 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    // Format 11-digit numbers (with country code)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const tenDigits = cleaned.slice(1)
      return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`
    }

    return phone // Return original if can't format
  }

  private generateId(name: string, address: string): string {
    return Buffer.from(name + address).toString('base64').slice(0, 16)
  }
}