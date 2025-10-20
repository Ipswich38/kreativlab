import axios from 'axios'
import { DentalClinicLead, ScrapingLocation } from './dental-clinic-scraper'

export class OpenStreetMapScraper {
  private readonly overpassUrl = 'https://overpass-api.de/api/interpreter'
  private readonly nominatimUrl = 'https://nominatim.openstreetmap.org'

  async scrapeByLocation(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    console.log('🗺️ Starting OpenStreetMap/Overpass API search for dental clinics...')

    try {
      // First, get the bounding box for the location
      const bbox = await this.getLocationBoundingBox(location)
      if (!bbox) {
        console.log('⚠️ Could not determine location boundaries')
        return []
      }

      // Search for dental clinics using Overpass API
      const results = await this.searchDentalClinics(bbox)

      console.log(`✅ Found ${results.length} dental clinics via OpenStreetMap`)
      return results

    } catch (error) {
      console.error('❌ OpenStreetMap API error:', error)
      throw error
    }
  }

  private async getLocationBoundingBox(location: ScrapingLocation): Promise<{
    south: number;
    west: number;
    north: number;
    east: number;
  } | null> {
    try {
      let searchQuery = ''

      if (location.zipCode) {
        searchQuery = location.zipCode
      } else if (location.city && location.state) {
        searchQuery = `${location.city}, ${location.state}`
      } else if (location.city) {
        searchQuery = location.city
      } else {
        return null
      }

      const response = await axios.get(`${this.nominatimUrl}/search`, {
        params: {
          q: searchQuery,
          format: 'json',
          limit: 1,
          countrycodes: 'us', // Focus on US for now
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'DentalCRM/1.0 (dental-lead-generation)'
        }
      })

      if (response.data && response.data.length > 0) {
        const result = response.data[0]
        const bbox = result.boundingbox

        if (bbox && bbox.length === 4) {
          // Expand the bounding box slightly for better coverage
          const latDiff = parseFloat(bbox[1]) - parseFloat(bbox[0])
          const lonDiff = parseFloat(bbox[3]) - parseFloat(bbox[2])
          const expansion = 0.1 // 10% expansion

          return {
            south: parseFloat(bbox[0]) - (latDiff * expansion),
            north: parseFloat(bbox[1]) + (latDiff * expansion),
            west: parseFloat(bbox[2]) - (lonDiff * expansion),
            east: parseFloat(bbox[3]) + (lonDiff * expansion)
          }
        }
      }

      return null
    } catch (error) {
      console.error('Nominatim geocoding error:', error)
      return null
    }
  }

  private async searchDentalClinics(bbox: {
    south: number;
    west: number;
    north: number;
    east: number;
  }): Promise<DentalClinicLead[]> {
    // Overpass QL query to find dental-related amenities
    const overpassQuery = `
      [out:json][timeout:25];
      (
        // Dental clinics, dentist offices
        node["amenity"="dentist"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        way["amenity"="dentist"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        relation["amenity"="dentist"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

        // Healthcare facilities that might be dental
        node["healthcare"="dentist"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        way["healthcare"="dentist"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        relation["healthcare"="dentist"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});

        // Search by name containing dental/orthodontic keywords
        node["name"~"[Dd]ental|[Dd]entist|[Oo]rthodont|[Ee]ndodont|[Pp]eriodont|[Oo]ral [Ss]urgery"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
        way["name"~"[Dd]ental|[Dd]entist|[Oo]rthodont|[Ee]ndodont|[Pp]eriodont|[Oo]ral [Ss]urgery"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
      );
      out center meta;
    `

    try {
      const response = await axios.post(this.overpassUrl, overpassQuery, {
        headers: {
          'Content-Type': 'text/plain',
          'User-Agent': 'DentalCRM/1.0 (dental-lead-generation)'
        },
        timeout: 30000 // 30 second timeout
      })

      if (response.data && response.data.elements) {
        return this.processOverpassResults(response.data.elements)
      }

      return []
    } catch (error) {
      console.error('Overpass API error:', error)
      throw error
    }
  }

  private processOverpassResults(elements: any[]): DentalClinicLead[] {
    const leads: DentalClinicLead[] = []

    for (const element of elements) {
      try {
        const lead = this.elementToLead(element)
        if (lead) {
          leads.push(lead)
        }
      } catch (error) {
        console.error('Error processing OSM element:', error)
        // Continue with other elements
      }
    }

    // Remove duplicates based on name and location
    return this.deduplicateLeads(leads)
  }

  private elementToLead(element: any): DentalClinicLead | null {
    const tags = element.tags || {}

    // Must have a name
    if (!tags.name) {
      return null
    }

    // Get coordinates
    let lat: number, lon: number

    if (element.type === 'node') {
      lat = element.lat
      lon = element.lon
    } else if (element.center) {
      lat = element.center.lat
      lon = element.center.lon
    } else {
      return null
    }

    // Extract location information
    const location = this.extractLocationFromTags(tags)

    // Build address
    const addressParts = []
    if (tags['addr:housenumber'] && tags['addr:street']) {
      addressParts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`)
    } else if (tags['addr:street']) {
      addressParts.push(tags['addr:street'])
    }

    if (tags['addr:city']) {
      addressParts.push(tags['addr:city'])
    }

    if (tags['addr:state']) {
      addressParts.push(tags['addr:state'])
    }

    if (tags['addr:postcode']) {
      addressParts.push(tags['addr:postcode'])
    }

    const address = addressParts.length > 0 ? addressParts.join(', ') : `${lat.toFixed(4)}, ${lon.toFixed(4)}`

    // Extract specialties
    const specialties = this.extractSpecialties(tags)

    // Detect needs indicators
    const needsIndicators = this.detectNeedsIndicators(tags)

    return {
      id: this.generateId(tags.name, address),
      name: tags.name,
      address,
      phone: this.cleanPhone(tags.phone || tags['contact:phone']),
      email: tags.email || tags['contact:email'],
      website: tags.website || tags['contact:website'],
      contactPerson: this.extractContactPerson(tags),
      specialties,
      needsIndicators,
      sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
      location,
      businessSize: this.estimateBusinessSize(tags),
      lastUpdated: new Date().toISOString()
    }
  }

  private extractLocationFromTags(tags: any): { zipCode: string; city: string; state: string } {
    return {
      zipCode: tags['addr:postcode'] || '',
      city: tags['addr:city'] || '',
      state: tags['addr:state'] || ''
    }
  }

  private extractSpecialties(tags: any): string[] {
    const specialties: string[] = []

    // Check healthcare specialties
    if (tags['healthcare:speciality']) {
      const speciality = tags['healthcare:speciality'].toLowerCase()
      if (speciality.includes('orthodont')) specialties.push('Orthodontics')
      if (speciality.includes('oral_surgery') || speciality.includes('oral surgery')) specialties.push('Oral Surgery')
      if (speciality.includes('endodont')) specialties.push('Endodontics')
      if (speciality.includes('periodont')) specialties.push('Periodontics')
      if (speciality.includes('prosthodont')) specialties.push('Prosthodontics')
      if (speciality.includes('pediatric')) specialties.push('Pediatric Dentistry')
      if (speciality.includes('cosmetic')) specialties.push('Cosmetic Dentistry')
    }

    // Check name for specialties
    const name = tags.name.toLowerCase()
    if (name.includes('orthodont')) specialties.push('Orthodontics')
    if (name.includes('oral surgery')) specialties.push('Oral Surgery')
    if (name.includes('endodont')) specialties.push('Endodontics')
    if (name.includes('periodont')) specialties.push('Periodontics')
    if (name.includes('prosthodont')) specialties.push('Prosthodontics')
    if (name.includes('pediatric') || name.includes('kids') || name.includes('children')) specialties.push('Pediatric Dentistry')
    if (name.includes('cosmetic') || name.includes('smile')) specialties.push('Cosmetic Dentistry')

    // Default to general dentistry if no specialties found
    if (specialties.length === 0) {
      specialties.push('General Dentistry')
    }

    return [...new Set(specialties)] // Remove duplicates
  }

  private detectNeedsIndicators(tags: any): string[] {
    const indicators: string[] = []

    // Check opening hours for business activity level
    if (tags.opening_hours) {
      indicators.push('Active Practice')

      // Complex opening hours might indicate busy practice
      if (tags.opening_hours.length > 20) {
        indicators.push('Detailed Scheduling')
      }
    }

    // Check for services that might indicate admin needs
    if (tags.description && tags.description.toLowerCase().includes('appointment')) {
      indicators.push('Appointment-Based Practice')
    }

    // Practices without websites might need digital admin support
    if (!tags.website && !tags['contact:website']) {
      indicators.push('Limited Online Presence')
    }

    // Practices without email might need communication setup
    if (!tags.email && !tags['contact:email']) {
      indicators.push('Communication Setup Opportunity')
    }

    // Multiple phone numbers might indicate larger practice
    if (tags.phone && tags['contact:phone'] && tags.phone !== tags['contact:phone']) {
      indicators.push('Multi-Line Practice')
    }

    return indicators
  }

  private extractContactPerson(tags: any): string | undefined {
    // OSM typically doesn't have contact person info, but check operator/brand
    if (tags.operator && !tags.operator.toLowerCase().includes('chain')) {
      return tags.operator
    }

    if (tags.brand && !tags.brand.toLowerCase().includes('dental') && !tags.brand.toLowerCase().includes('group')) {
      return tags.brand
    }

    return undefined
  }

  private estimateBusinessSize(tags: any): 'small' | 'medium' | 'large' {
    let score = 0

    // Indicators of larger practices
    if (tags.opening_hours && tags.opening_hours.includes('Mo-Sa')) score += 1
    if (tags.website || tags['contact:website']) score += 1
    if (tags.email || tags['contact:email']) score += 1
    if (tags.phone && tags['contact:phone']) score += 1
    if (tags.description && tags.description.length > 50) score += 1
    if (tags.operator) score += 1

    if (score >= 4) return 'large'
    if (score >= 2) return 'medium'
    return 'small'
  }

  private cleanPhone(phone: string | undefined): string | undefined {
    if (!phone) return undefined

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

  private deduplicateLeads(leads: DentalClinicLead[]): DentalClinicLead[] {
    const seen = new Set<string>()
    return leads.filter(lead => {
      const key = lead.name.toLowerCase().trim() + lead.address.toLowerCase().trim()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}