import axios from 'axios'
import * as cheerio from 'cheerio'

export interface DentalClinicLead {
  id: string
  name: string
  address: string
  phone?: string
  email?: string
  website?: string
  contactPerson?: string
  specialties: string[]
  needsIndicators: string[]
  sourceUrl: string
  location: {
    zipCode: string
    city: string
    state: string
  }
  businessSize?: 'small' | 'medium' | 'large'
  lastUpdated: string
}

export interface ScrapingLocation {
  zipCode?: string
  city?: string
  state?: string
  radius?: number
}

export class DentalClinicScraper {
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  private readonly delay = 1000 // 1 second delay between requests

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async scrapeByLocation(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    console.log('🔍 Starting dental clinic scraping for location:', location)

    const results: DentalClinicLead[] = []

    try {
      // Scrape multiple data sources
      const googleResults = await this.scrapeGoogleBusinesses(location)
      const yelpResults = await this.scrapeYelpListings(location)
      const healthgradesResults = await this.scrapeHealthgrades(location)

      results.push(...googleResults, ...yelpResults, ...healthgradesResults)

      // Remove duplicates and enhance data
      const uniqueResults = this.deduplicateResults(results)
      const enhancedResults = await this.enhanceWithContactInfo(uniqueResults)

      console.log(`✅ Found ${enhancedResults.length} dental clinic leads`)
      return enhancedResults

    } catch (error) {
      console.error('❌ Scraping error:', error)
      throw new Error(`Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async scrapeGoogleBusinesses(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    const results: DentalClinicLead[] = []

    try {
      console.log('🔍 Scraping Google Business listings...')

      // Use Google Places-style search
      const searchQuery = this.buildSearchQuery(location, 'dental clinic dentist')
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`

      const response = await axios.get(searchUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)

      // Extract business listings from Google search results
      $('.g').each((_, element) => {
        const $el = $(element)
        const title = $el.find('h3').text().trim()
        const link = $el.find('a').attr('href')
        const snippet = $el.find('.VwiC3b').text().trim()

        if (this.isDentalBusiness(title, snippet)) {
          const lead = this.extractBusinessInfo($el, location, link || '')
          if (lead) results.push(lead)
        }
      })

      await this.sleep(this.delay)

    } catch (error) {
      console.error('Google scraping error:', error)
    }

    return results
  }

  private async scrapeYelpListings(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    const results: DentalClinicLead[] = []

    try {
      console.log('🔍 Scraping Yelp listings...')

      const locationStr = this.buildLocationString(location)
      const yelpUrl = `https://www.yelp.com/search?find_desc=dentist&find_loc=${encodeURIComponent(locationStr)}`

      const response = await axios.get(yelpUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)

      // Extract Yelp business listings
      $('[data-testid="serp-ia-card"]').each((_, element) => {
        const $el = $(element)
        const name = $el.find('h3 a').text().trim()
        const address = $el.find('[data-testid="address"]').text().trim()
        const phone = $el.find('[data-testid="phone"]').text().trim()
        const link = $el.find('h3 a').attr('href')

        if (name && this.isDentalBusiness(name, address)) {
          const lead: DentalClinicLead = {
            id: this.generateId(name, address),
            name,
            address,
            phone: this.cleanPhone(phone),
            website: link ? `https://yelp.com${link}` : undefined,
            specialties: this.extractSpecialties(name + ' ' + address),
            needsIndicators: this.detectNeedsIndicators(''),
            sourceUrl: yelpUrl,
            location: {
              zipCode: location.zipCode || '',
              city: location.city || '',
              state: location.state || ''
            },
            lastUpdated: new Date().toISOString()
          }
          results.push(lead)
        }
      })

      await this.sleep(this.delay)

    } catch (error) {
      console.error('Yelp scraping error:', error)
    }

    return results
  }

  private async scrapeHealthgrades(location: ScrapingLocation): Promise<DentalClinicLead[]> {
    const results: DentalClinicLead[] = []

    try {
      console.log('🔍 Scraping Healthgrades listings...')

      const locationStr = this.buildLocationString(location)
      const healthgradesUrl = `https://www.healthgrades.com/dentist-directory/${encodeURIComponent(locationStr)}`

      const response = await axios.get(healthgradesUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)

      // Extract doctor/clinic listings
      $('.provider-listing').each((_, element) => {
        const $el = $(element)
        const name = $el.find('.provider-name').text().trim()
        const address = $el.find('.address').text().trim()
        const phone = $el.find('.phone').text().trim()
        const specialties = $el.find('.specialties').text().trim()

        if (name && this.isDentalBusiness(name, specialties)) {
          const lead: DentalClinicLead = {
            id: this.generateId(name, address),
            name,
            address,
            phone: this.cleanPhone(phone),
            specialties: this.extractSpecialties(specialties),
            needsIndicators: this.detectNeedsIndicators(''),
            sourceUrl: healthgradesUrl,
            location: {
              zipCode: location.zipCode || '',
              city: location.city || '',
              state: location.state || ''
            },
            lastUpdated: new Date().toISOString()
          }
          results.push(lead)
        }
      })

      await this.sleep(this.delay)

    } catch (error) {
      console.error('Healthgrades scraping error:', error)
    }

    return results
  }

  private async enhanceWithContactInfo(leads: DentalClinicLead[]): Promise<DentalClinicLead[]> {
    const enhanced: DentalClinicLead[] = []

    for (const lead of leads) {
      try {
        // Try to find more contact info from their website
        if (lead.website && !lead.website.includes('yelp.com')) {
          const contactInfo = await this.scrapeContactPage(lead.website)

          enhanced.push({
            ...lead,
            email: contactInfo.email || lead.email,
            phone: contactInfo.phone || lead.phone,
            contactPerson: contactInfo.contactPerson || lead.contactPerson,
            needsIndicators: [...lead.needsIndicators, ...contactInfo.needsIndicators]
          })
        } else {
          enhanced.push(lead)
        }

        await this.sleep(500) // Shorter delay for contact scraping

      } catch (error) {
        console.error(`Error enhancing lead ${lead.name}:`, error)
        enhanced.push(lead)
      }
    }

    return enhanced
  }

  private async scrapeContactPage(websiteUrl: string): Promise<{
    email?: string
    phone?: string
    contactPerson?: string
    needsIndicators: string[]
  }> {
    try {
      const response = await axios.get(websiteUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 8000
      })

      const $ = cheerio.load(response.data)
      const text = $.text().toLowerCase()

      // Extract email addresses
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const emails = text.match(emailRegex) || []
      const businessEmail = emails.find(email =>
        !email.includes('example.com') &&
        !email.includes('placeholder') &&
        !email.includes('noreply')
      )

      // Extract phone numbers
      const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g
      const phones = text.match(phoneRegex) || []
      const businessPhone = phones[0]

      // Look for contact person names
      const contactPerson = this.extractContactPerson($)

      // Detect needs indicators
      const needsIndicators = this.detectNeedsIndicators(text)

      return {
        email: businessEmail,
        phone: businessPhone ? this.cleanPhone(businessPhone) : undefined,
        contactPerson,
        needsIndicators
      }

    } catch (error) {
      return { needsIndicators: [] }
    }
  }

  private extractContactPerson($: cheerio.CheerioAPI): string | undefined {
    // Look for common patterns for contact persons
    const patterns = [
      'office manager',
      'practice manager',
      'administrator',
      'director',
      'dr. ',
      'doctor '
    ]

    const text = $.text().toLowerCase()

    for (const pattern of patterns) {
      const regex = new RegExp(`(${pattern})\\s+([a-zA-Z]+\\s+[a-zA-Z]+)`, 'i')
      const match = text.match(regex)
      if (match) {
        return match[0].trim()
      }
    }

    return undefined
  }

  private detectNeedsIndicators(text: string): string[] {
    const indicators: string[] = []
    const needsKeywords = [
      'hiring',
      'administrative support',
      'office help',
      'scheduling',
      'appointment',
      'billing',
      'insurance',
      'front desk',
      'reception',
      'administrative assistant',
      'busy practice',
      'growing practice',
      'expanding',
      'overwhelmed',
      'need help'
    ]

    for (const keyword of needsKeywords) {
      if (text.includes(keyword)) {
        indicators.push(keyword)
      }
    }

    return indicators
  }

  private isDentalBusiness(name: string, description: string): boolean {
    const dentalKeywords = [
      'dental', 'dentist', 'orthodont', 'oral surgery',
      'periodontal', 'endodont', 'prosthodont', 'oral health',
      'teeth', 'smile', 'dds', 'dmd'
    ]

    const text = (name + ' ' + description).toLowerCase()
    return dentalKeywords.some(keyword => text.includes(keyword))
  }

  private extractSpecialties(text: string): string[] {
    const specialties: string[] = []
    const specialtyKeywords = [
      'general dentistry',
      'orthodontics',
      'oral surgery',
      'periodontics',
      'endodontics',
      'prosthodontics',
      'cosmetic dentistry',
      'pediatric dentistry',
      'implants',
      'whitening'
    ]

    const lowerText = text.toLowerCase()
    for (const specialty of specialtyKeywords) {
      if (lowerText.includes(specialty)) {
        specialties.push(specialty)
      }
    }

    return specialties
  }

  private buildSearchQuery(location: ScrapingLocation, service: string): string {
    const parts = [service]

    if (location.city) parts.push(location.city)
    if (location.state) parts.push(location.state)
    if (location.zipCode) parts.push(location.zipCode)

    return parts.join(' ')
  }

  private buildLocationString(location: ScrapingLocation): string {
    if (location.zipCode) return location.zipCode
    if (location.city && location.state) return `${location.city}, ${location.state}`
    if (location.city) return location.city
    if (location.state) return location.state
    return ''
  }

  private extractBusinessInfo($el: cheerio.Cheerio<any>, location: ScrapingLocation, link: string): DentalClinicLead | null {
    const name = $el.find('h3').text().trim()
    const snippet = $el.find('.VwiC3b').text().trim()

    if (!name) return null

    return {
      id: this.generateId(name, snippet),
      name,
      address: this.extractAddress(snippet),
      specialties: this.extractSpecialties(name + ' ' + snippet),
      needsIndicators: this.detectNeedsIndicators(snippet),
      sourceUrl: link,
      location: {
        zipCode: location.zipCode || '',
        city: location.city || '',
        state: location.state || ''
      },
      lastUpdated: new Date().toISOString()
    }
  }

  private extractAddress(text: string): string {
    // Simple address extraction - look for patterns with numbers and street names
    const addressRegex = /\d+\s+[A-Za-z\s]+(?:St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Lane|Ln)/i
    const match = text.match(addressRegex)
    return match ? match[0] : ''
  }

  private cleanPhone(phone: string): string {
    if (!phone) return ''
    return phone.replace(/[^\d]/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
  }

  private generateId(name: string, address: string): string {
    return Buffer.from(name + address).toString('base64').slice(0, 16)
  }

  private deduplicateResults(results: DentalClinicLead[]): DentalClinicLead[] {
    const seen = new Set<string>()
    return results.filter(lead => {
      const key = lead.name.toLowerCase() + lead.address.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
}