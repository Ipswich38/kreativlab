import { DentalClinicLead } from './dental-clinic-scraper'

// Mock data generator for testing and fallback when scraping fails
export function generateMockDentalClinics(location: { zipCode?: string; city?: string; state?: string }): DentalClinicLead[] {
  const locationStr = location.zipCode || `${location.city}, ${location.state}` || 'Unknown Location'

  const mockClinics: DentalClinicLead[] = [
    {
      id: 'mock-1',
      name: 'Bright Smile Dental Center',
      address: `123 Main Street, ${locationStr}`,
      phone: '(555) 123-4567',
      email: 'office@brightsmile.com',
      website: 'https://brightsmiledentalcenter.com',
      contactPerson: 'Sarah Johnson, Office Manager',
      specialties: ['general dentistry', 'cosmetic dentistry'],
      needsIndicators: ['hiring', 'administrative support', 'busy practice'],
      sourceUrl: 'https://mock-source.com',
      location: {
        zipCode: location.zipCode || '12345',
        city: location.city || 'Sample City',
        state: location.state || 'CA'
      },
      businessSize: 'medium',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'mock-2',
      name: 'Family Dental Associates',
      address: `456 Oak Avenue, ${locationStr}`,
      phone: '(555) 234-5678',
      email: 'contact@familydentalassoc.com',
      website: 'https://familydentalassociates.com',
      contactPerson: 'Dr. Michael Chen',
      specialties: ['general dentistry', 'pediatric dentistry'],
      needsIndicators: ['expanding', 'office help'],
      sourceUrl: 'https://mock-source.com',
      location: {
        zipCode: location.zipCode || '12345',
        city: location.city || 'Sample City',
        state: location.state || 'CA'
      },
      businessSize: 'large',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'mock-3',
      name: 'Elite Orthodontics',
      address: `789 Pine Street, ${locationStr}`,
      phone: '(555) 345-6789',
      email: 'admin@eliteortho.com',
      contactPerson: 'Lisa Rodriguez, Practice Administrator',
      specialties: ['orthodontics', 'oral surgery'],
      needsIndicators: ['administrative assistant', 'scheduling'],
      sourceUrl: 'https://mock-source.com',
      location: {
        zipCode: location.zipCode || '12345',
        city: location.city || 'Sample City',
        state: location.state || 'CA'
      },
      businessSize: 'medium',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'mock-4',
      name: 'Modern Dental Solutions',
      address: `321 Elm Drive, ${locationStr}`,
      phone: '(555) 456-7890',
      email: 'info@moderndentalsolve.com',
      website: 'https://moderndentalsolve.com',
      contactPerson: 'Jennifer Kim, Operations Manager',
      specialties: ['general dentistry', 'implants', 'cosmetic dentistry'],
      needsIndicators: ['need help', 'overwhelmed', 'front desk'],
      sourceUrl: 'https://mock-source.com',
      location: {
        zipCode: location.zipCode || '12345',
        city: location.city || 'Sample City',
        state: location.state || 'CA'
      },
      businessSize: 'small',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'mock-5',
      name: 'Gentle Care Dentistry',
      address: `654 Maple Lane, ${locationStr}`,
      phone: '(555) 567-8901',
      website: 'https://gentlecaredentistry.com',
      contactPerson: 'Dr. Amanda Foster',
      specialties: ['general dentistry', 'periodontics'],
      needsIndicators: ['reception', 'billing'],
      sourceUrl: 'https://mock-source.com',
      location: {
        zipCode: location.zipCode || '12345',
        city: location.city || 'Sample City',
        state: location.state || 'CA'
      },
      businessSize: 'small',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'mock-6',
      name: 'Advanced Dental Care',
      address: `987 Cedar Boulevard, ${locationStr}`,
      phone: '(555) 678-9012',
      email: 'hello@advanceddentalcare.com',
      website: 'https://advanceddentalcare.com',
      contactPerson: 'Mark Thompson, Office Director',
      specialties: ['general dentistry', 'endodontics', 'oral surgery'],
      needsIndicators: ['growing practice', 'administrative support', 'insurance'],
      sourceUrl: 'https://mock-source.com',
      location: {
        zipCode: location.zipCode || '12345',
        city: location.city || 'Sample City',
        state: location.state || 'CA'
      },
      businessSize: 'large',
      lastUpdated: new Date().toISOString()
    }
  ]

  return mockClinics
}