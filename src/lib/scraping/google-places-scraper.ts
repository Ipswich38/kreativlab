import axios from 'axios'
import { DentalClinicLead, ScrapingLocation } from './dental-clinic-scraper'

export class GooglePlacesScraper {
  private readonly apiKey: string
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/place'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async scrapeByLocation(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    console.log('🔍 Starting Google Places API search for dental clinics...')

    if (!this.apiKey || this.apiKey === 'your_google_places_api_key') {
      console.log('⚠️ Google Places API key not configured, using mock data...')
      return []
    }

    try {
      // Search for dental clinics in the specified location
      const searchResults = await this.searchPlaces(location)

      // Get detailed information for each place
      const detailedResults = await this.getPlaceDetails(searchResults)

      console.log(`✅ Found ${detailedResults.length} dental clinics via Google Places API`)
      return detailedResults

    } catch (error) {
      console.error('❌ Google Places API error:', error)
      throw error
    }
  }

  private async searchPlaces(location: ScrapingLocation): Promise<any[]> {
    const locationStr = this.buildLocationString(location)

    // Use Google Places Text Search API
    const searchUrl = `${this.baseUrl}/textsearch/json`

    const params = {
      query: `dental clinic dentist ${locationStr}`,
      key: this.apiKey,
      type: 'dentist',
      radius: location.radius || 25000, // 25km radius
    }

    try {
      const response = await axios.get(searchUrl, { params })

      if (response.data.status !== 'OK') {
        throw new Error(`Google Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`)
      }

      return response.data.results || []
    } catch (error) {
      console.error('Places search error:', error)
      throw error
    }
  }

  private async getPlaceDetails(places: any[]): Promise<DentalClinicLead[]> {
    const leads: DentalClinicLead[] = []

    for (const place of places.slice(0, 20)) { // Limit to 20 results to avoid API quota issues
      try {
        const detailsUrl = `${this.baseUrl}/details/json`
        const params = {
          place_id: place.place_id,
          fields: 'name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,business_status,types',
          key: this.apiKey
        }

        const response = await axios.get(detailsUrl, { params })

        if (response.data.status === 'OK' && response.data.result) {
          const placeDetails = response.data.result
          const lead = this.convertToLead(placeDetails, place)
          if (lead) {
            leads.push(lead)
          }
        }

        // Add small delay to respect API rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Error getting details for place ${place.name}:`, error)
        // Continue with other places even if one fails
      }
    }

    return leads
  }

  private convertToLead(placeDetails: any, originalPlace: any): DentalClinicLead | null {
    if (!placeDetails.name || !this.isDentalBusiness(placeDetails.name, placeDetails.types)) {
      return null
    }

    // Extract location components
    const location = this.extractLocationFromAddress(placeDetails.formatted_address)

    return {
      id: this.generateId(placeDetails.name, placeDetails.formatted_address),
      name: placeDetails.name,
      address: placeDetails.formatted_address || '',
      phone: this.cleanPhone(placeDetails.formatted_phone_number),
      website: placeDetails.website,
      specialties: this.extractSpecialtiesFromTypes(placeDetails.types),
      needsIndicators: this.detectNeedsIndicators(placeDetails),
      sourceUrl: `https://maps.google.com/place/${placeDetails.place_id}`,
      location,
      businessSize: this.estimateBusinessSize(placeDetails),
      lastUpdated: new Date().toISOString()
    }
  }

  private isDentalBusiness(name: string, types: string[]): boolean {
    const dentalKeywords = [
      'dental', 'dentist', 'orthodont', 'oral surgery',
      'periodontal', 'endodont', 'prosthodont', 'oral health',
      'teeth', 'smile', 'dds', 'dmd'
    ]

    const dentalTypes = [
      'dentist', 'doctor', 'health', 'establishment'
    ]

    const nameMatch = dentalKeywords.some(keyword =>
      name.toLowerCase().includes(keyword)
    )

    const typeMatch = types && types.some(type =>
      dentalTypes.includes(type) || type.includes('dental')
    )

    return nameMatch || typeMatch
  }

  private extractSpecialtiesFromTypes(types: string[]): string[] {
    const specialtyMap: { [key: string]: string } = {
      'dentist': 'General Dentistry',
      'orthodontist': 'Orthodontics',
      'oral_surgeon': 'Oral Surgery',
      'periodontist': 'Periodontics',
      'endodontist': 'Endodontics',
      'prosthodontist': 'Prosthodontics',
      'pediatric_dentist': 'Pediatric Dentistry'
    }

    const specialties: string[] = []

    if (types) {
      for (const type of types) {
        if (specialtyMap[type]) {
          specialties.push(specialtyMap[type])
        }
      }
    }

    // Default to general dentistry if no specific specialties found
    if (specialties.length === 0) {
      specialties.push('General Dentistry')
    }

    return specialties
  }

  private detectNeedsIndicators(placeDetails: any): string[] {
    const indicators: string[] = []

    // Check business status
    if (placeDetails.business_status === 'OPERATIONAL') {
      // Active business might need admin support
    }

    // Check rating and review count to gauge business size/activity
    if (placeDetails.user_ratings_total > 50) {
      indicators.push('Busy Practice')
    }

    if (placeDetails.user_ratings_total > 100) {
      indicators.push('High Volume Practice')
    }

    if (placeDetails.rating && placeDetails.rating >= 4.5) {
      indicators.push('Successful Practice')
    }

    // Assume practices without websites might need digital admin support
    if (!placeDetails.website) {
      indicators.push('Limited Online Presence')
    }

    // Large practices likely need admin support
    if (placeDetails.user_ratings_total > 200) {
      indicators.push('Administrative Support Opportunity')
    }

    return indicators
  }

  private estimateBusinessSize(placeDetails: any): 'small' | 'medium' | 'large' {
    const reviewCount = placeDetails.user_ratings_total || 0

    if (reviewCount > 150) return 'large'
    if (reviewCount > 50) return 'medium'
    return 'small'
  }

  private extractLocationFromAddress(address: string): { zipCode: string; city: string; state: string } {
    const location = { zipCode: '', city: '', state: '' }

    if (!address) return location

    // Extract ZIP code (5 digits)
    const zipMatch = address.match(/\b\d{5}\b/)
    if (zipMatch) {
      location.zipCode = zipMatch[0]
    }

    // Extract state (2 letter abbreviation before ZIP)
    const stateMatch = address.match(/,\s*([A-Z]{2})\s+\d{5}/)
    if (stateMatch) {
      location.state = stateMatch[1]
    }

    // Extract city (word(s) before state)
    const cityMatch = address.match(/,\s*([^,]+),\s*[A-Z]{2}\s+\d{5}/)
    if (cityMatch) {
      location.city = cityMatch[1].trim()
    }

    return location
  }

  private buildLocationString(location: ScrapingLocation): string {
    const parts: string[] = []

    if (location.city) parts.push(location.city)
    if (location.state) parts.push(location.state)
    if (location.zipCode) parts.push(location.zipCode)

    return parts.join(', ')
  }

  private cleanPhone(phone: string): string {
    if (!phone) return ''

    // Remove all non-digit characters
    const cleaned = phone.replace(/[^\d]/g, '')

    // Format as (XXX) XXX-XXXX if we have 10 digits
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }

    return phone // Return original if can't format
  }

  private generateId(name: string, address: string): string {
    return Buffer.from(name + address).toString('base64').slice(0, 16)
  }
}