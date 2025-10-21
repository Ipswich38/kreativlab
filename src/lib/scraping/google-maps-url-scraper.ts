import { DentalClinicLead, ScrapingLocation } from './dental-clinic-scraper'

/**
 * Google Maps URL Generator for Dental Clinic Lead Generation
 * Based on: https://developers.google.com/maps/documentation/urls/get-started
 */
export class GoogleMapsUrlScraper {

  async scrapeByLocation(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    console.log('🗺️ Generating Google Maps URLs for dental clinic lead generation...')

    try {
      // Generate various search URLs for different types of dental practices
      const searchUrls = this.generateSearchUrls(location)

      // Create lead objects with Google Maps URLs for manual prospecting
      const leads = this.createLeadsFromUrls(searchUrls, location)

      console.log(`✅ Generated ${leads.length} Google Maps lead generation URLs`)
      return leads

    } catch (error) {
      console.error('❌ Google Maps URL generation error:', error)
      throw error
    }
  }

  private generateSearchUrls(location: ScrapingLocation): Array<{query: string, url: string, specialty: string}> {
    const locationQuery = this.buildLocationQuery(location)

    // Various dental practice search queries
    const searchQueries = [
      { query: `dental office ${locationQuery}`, specialty: 'General Dentistry' },
      { query: `dentist ${locationQuery}`, specialty: 'General Dentistry' },
      { query: `dental clinic ${locationQuery}`, specialty: 'General Dentistry' },
      { query: `orthodontist ${locationQuery}`, specialty: 'Orthodontics' },
      { query: `oral surgeon ${locationQuery}`, specialty: 'Oral Surgery' },
      { query: `pediatric dentist ${locationQuery}`, specialty: 'Pediatric Dentistry' },
      { query: `cosmetic dentist ${locationQuery}`, specialty: 'Cosmetic Dentistry' },
      { query: `endodontist ${locationQuery}`, specialty: 'Endodontics' },
      { query: `periodontist ${locationQuery}`, specialty: 'Periodontics' },
      { query: `dental practice ${locationQuery}`, specialty: 'General Dentistry' }
    ]

    return searchQueries.map(({ query, specialty }) => ({
      query,
      specialty,
      url: this.createGoogleMapsSearchUrl(query)
    }))
  }

  private buildLocationQuery(location: ScrapingLocation): string {
    if (location.zipCode) {
      return location.zipCode
    } else if (location.city && location.state) {
      return `${location.city}, ${location.state}`
    } else if (location.city) {
      return location.city
    } else if (location.state) {
      return location.state
    }
    return 'United States'
  }

  private createGoogleMapsSearchUrl(query: string): string {
    // Using Google Maps search URL format
    // https://developers.google.com/maps/documentation/urls/get-started#search-action
    const encodedQuery = encodeURIComponent(query)
    return `https://www.google.com/maps/search/${encodedQuery}`
  }

  private createLeadsFromUrls(
    searchUrls: Array<{query: string, url: string, specialty: string}>,
    location: ScrapingLocation
  ): DentalClinicLead[] {
    const leads: DentalClinicLead[] = []

    searchUrls.forEach((search, index) => {
      const lead: DentalClinicLead = {
        id: `gmap_${index}_${Date.now()}`,
        name: `Google Maps Search: ${search.specialty} in ${this.buildLocationQuery(location)}`,
        address: this.buildLocationQuery(location),
        phone: undefined,
        email: undefined,
        website: undefined,
        contactPerson: undefined,
        specialties: [search.specialty],
        needsIndicators: [
          'Google Maps Search Required',
          'Manual Lead Generation Needed',
          'Prospect Research Opportunity'
        ],
        sourceUrl: search.url,
        location: {
          zipCode: location.zipCode || '',
          city: location.city || '',
          state: location.state || ''
        },
        businessSize: 'small',
        lastUpdated: new Date().toISOString(),
        // Add custom fields for Google Maps integration
        leadGenerationMethod: 'google_maps_url',
        searchQuery: search.query,
        mapSearchUrl: search.url,
        instructions: `Click the URL to open Google Maps and search for ${search.specialty.toLowerCase()} practices in ${this.buildLocationQuery(location)}. Look for practices that may need administrative support services.`
      }

      leads.push(lead)
    })

    return leads
  }

  /**
   * Generate a specific Google Maps URL for a particular dental practice search
   */
  static generatePracticeSearchUrl(practiceType: string, location: string): string {
    const query = `${practiceType} ${location}`
    const encodedQuery = encodeURIComponent(query)
    return `https://www.google.com/maps/search/${encodedQuery}`
  }

  /**
   * Generate a Google Maps URL to find businesses around a specific location
   */
  static generateNearbySearchUrl(location: string, radius: string = '5km'): string {
    const query = `dental office near ${location}`
    const encodedQuery = encodeURIComponent(query)
    return `https://www.google.com/maps/search/${encodedQuery}`
  }

  /**
   * Generate a Google Maps URL for route planning to a dental practice
   */
  static generateDirectionsUrl(origin: string, destination: string): string {
    const encodedOrigin = encodeURIComponent(origin)
    const encodedDestination = encodeURIComponent(destination)
    return `https://www.google.com/maps/dir/${encodedOrigin}/${encodedDestination}`
  }
}

// Extend the DentalClinicLead interface to support Google Maps URL generation
declare module './dental-clinic-scraper' {
  interface DentalClinicLead {
    leadGenerationMethod?: string
    searchQuery?: string
    mapSearchUrl?: string
    instructions?: string
  }
}