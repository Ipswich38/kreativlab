'use client'

import React, { useState } from 'react'
import {
  Phone,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Menu,
  X,
  LogOut,
  Mail,
  Upload,
  Plus,
  Edit,
  Trash2,
  Send,
  CheckSquare,
  Square,
  Search,
  MapPin,
  Globe,
  Target,
  Paperclip,
  FileText,
  Image,
  FileSpreadsheet,
  Trash,
  Settings,
  Check,
  AlertTriangle
} from 'lucide-react'

interface DashboardStats {
  totalCalls: number
  totalTickets: number
  activePractices: number
  monthlyRevenue: number
  openTickets: number
  resolvedTickets: number
  urgentTickets: number
  recentCalls: number
}

interface EmailContact {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  phone?: string
  tags: string[]
  status: 'active' | 'inactive' | 'bounced'
  createdAt: string
}

interface DentalClinicLead {
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

interface EmailConfig {
  provider: 'gmail' | 'outlook' | 'smtp'
  email: string
  senderName: string
  isActive: boolean
}

const recentMarketingActivity = [
  { id: 1, type: 'email', description: 'Email blast sent to 25 dental practices - "Administrative Support Services"', time: '30 mins ago', status: 'completed' },
  { id: 2, type: 'contact', description: 'New prospect added: Norton Family Dental', time: '1 hour ago', status: 'completed' },
  { id: 3, type: 'email', description: 'Follow-up email campaign to hot leads', time: '2 hours ago', status: 'completed' },
  { id: 4, type: 'contact', description: 'Contact updated: Smile On Nashville - marked as hot lead', time: '3 hours ago', status: 'completed' },
  { id: 5, type: 'email', description: 'Email blast scheduled for dental expansion prospects', time: '4 hours ago', status: 'in_progress' },
]

const emailCampaignStats = [
  { campaign: 'Administrative Support Outreach', sent: 45, opened: 18, responded: 3, status: 'active' },
  { campaign: 'Front Desk Coordinator Services', sent: 32, opened: 12, responded: 2, status: 'active' },
  { campaign: 'Virtual Assistant Follow-up', sent: 28, opened: 15, responded: 5, status: 'completed' },
  { campaign: 'Practice Expansion Support', sent: 38, opened: 22, responded: 4, status: 'active' },
]

// Helper function to parse name into first and last name
function parseName(fullName: string): { firstName: string; lastName: string } {
  if (!fullName) return { firstName: '', lastName: '' }

  const trimmed = fullName.trim()
  const parts = trimmed.split(' ')

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  } else if (parts.length === 2) {
    return { firstName: parts[0], lastName: parts[1] }
  } else {
    // For names with more parts, take first as firstName and rest as lastName
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    }
  }
}

// Helper function to format phone number
function formatPhone(phone: string): string {
  if (!phone) return ''

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Format as (XXX) XXX-XXXX if 10 digits
  if (digits.length === 10) {
    return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // Handle 11-digit numbers starting with 1
    const tenDigits = digits.slice(1)
    return `(${tenDigits.slice(0,3)}) ${tenDigits.slice(3,6)}-${tenDigits.slice(6)}`
  }

  return phone // Return original if can't format
}

// Helper function to determine tags based on company name and needs
function generateTags(company: string, needs: string): string[] {
  const tags: string[] = []

  // Add tags based on company type
  if (company) {
    if (company.toLowerCase().includes('dental')) tags.push('dental')
    if (company.toLowerCase().includes('orthodont')) tags.push('orthodontist')
    if (company.toLowerCase().includes('family')) tags.push('family-practice')
    if (company.toLowerCase().includes('cosmetic')) tags.push('cosmetic')
    if (company.toLowerCase().includes('pediatric')) tags.push('pediatric')
    if (company.toLowerCase().includes('oral surgery')) tags.push('oral-surgery')
    if (company.toLowerCase().includes('perio')) tags.push('periodontics')
  }

  // Add tags based on needs
  if (needs) {
    if (needs.toLowerCase().includes('admin')) tags.push('needs-admin')
    if (needs.toLowerCase().includes('manager')) tags.push('needs-manager')
    if (needs.toLowerCase().includes('front desk')) tags.push('needs-front-desk')
    if (needs.toLowerCase().includes('va') || needs.toLowerCase().includes('virtual')) tags.push('interested-in-va')
    if (needs.toLowerCase().includes('expand')) tags.push('expanding')
    if (needs.toLowerCase().includes('outsource')) tags.push('wants-outsourcing')
  }

  // Default tags
  if (tags.length === 0) tags.push('prospect')

  return tags
}

// Complete CSV data processing
const csvData = [
  { no: 1, name: 'Amber Reavis Bates', contact: '615-891-3192', email: 'info@smileonnashville.com', clinic: 'Smile On Nashville', needs: 'Needs Administrative Manager at a cosmetic practice in Nashville' },
  { no: 2, name: 'Jennifer VanNess', contact: '845-209-2500', email: 'info@afdclean.com', clinic: 'Aesthetic Family Dentistry', needs: 'Inquiry about best tasks to outsource' },
  { no: 3, name: 'Rita Masouh', contact: '508-226-1686', email: 'nortonfamilydental@gmail.com', clinic: 'Norton Family Dental', needs: 'Interested in using A1—might consider our VAs instead' },
  { no: 4, name: 'Mary Elizabeth Bush Joyce', contact: '850-476-8418', email: '', clinic: 'West Florida Periodontal Associates', needs: 'Looking to expand the admin team' },
  { no: 5, name: 'Andrea Rathjens', contact: '631-265-6655', email: '', clinic: 'Dental 365 (New York)', needs: 'Looking for Front Desk Coordinator' },
  { no: 6, name: 'Reem Dughly', contact: '4438488037', email: 'reem.dughly@gmail.com', clinic: '', needs: '' },
  { no: 7, name: 'Michelle Samuel', contact: '3013851572', email: 'michelle.koilpillai@gmail.com', clinic: 'Montpelier Family Dentistry', needs: '' },
  { no: 8, name: 'Iris Lewis-Moody', contact: '2156855738', email: 'iris.lewis-moody@phila.gov', clinic: '', needs: '' },
  { no: 9, name: 'Scott Fisher', contact: '3017258311', email: 'fishfam2000@yahoo.com', clinic: '', needs: '' },
  { no: 10, name: 'Shelia Thomas-Gillespie', contact: '2403606842', email: 'sheliagillesp@aol.com', clinic: '', needs: '' },
  { no: 11, name: 'Justina Urena-Paulino', contact: '12027255345', email: 'justinaup@me.com', clinic: '', needs: '' },
  { no: 12, name: 'Soraya Jafari', contact: '3015938910', email: 'drsorayaj@gmail.com', clinic: 'Four Corners Family Dentistry', needs: '' },
  { no: 13, name: 'Lydia Primich', contact: '5707662339', email: 'lprimichrdh@gmail.com', clinic: '', needs: '' },
  { no: 14, name: 'George P. Harding', contact: '3015590404', email: 'gphardds1105@gmail.com', clinic: 'George P Harding DDS, PC', needs: '' },
  { no: 15, name: 'Bridget McGuire', contact: '3019802657', email: 'jcbsladr@hotmail.com', clinic: '', needs: '' },
  { no: 16, name: 'Alexandra Scott', contact: '4048088512', email: 'alexandrascott99@yahoo.com', clinic: '', needs: '' },
  { no: 17, name: 'Kenneth Woo', contact: '3015264294', email: 'kenwoo@verizon.net', clinic: '', needs: '' },
  { no: 18, name: 'Bruce Yuille', contact: '4105661550', email: 'docyule@aol.com', clinic: 'Dr Bruce E. Yuille MAGD', needs: '' },
  { no: 19, name: 'Ashley Francis', contact: '4105338812', email: 'ashleynfran@gmail.com', clinic: '', needs: '' },
  { no: 20, name: 'Florence Lin', contact: '3012191853', email: 'flolin23@hotmail.com', clinic: '', needs: '' },
  { no: 21, name: 'Anh Huynh', contact: '7033430249', email: 'anh.huynh.d@gmail.com', clinic: '', needs: '' },
  { no: 22, name: 'Kristine Kim', contact: '4106275627', email: 'kristinekim10@yahoo.com', clinic: 'Augustine Paik DDS', needs: '' },
  { no: 23, name: 'Delia Chitimus', contact: '4436314765', email: 'delia.chitimus@gmail.com', clinic: 'Carroll County Dental Associates', needs: '' },
  { no: 24, name: 'Andrea Flamer', contact: '2022717815', email: 'healthysmile344@hotmail.com', clinic: 'Andrea S Flamer DDS', needs: '' },
  { no: 25, name: 'Nike Ogunbekun', contact: '5855307402', email: 'dr_o@novalinedental.com', clinic: 'Novaline Dental', needs: '' },
  { no: 26, name: 'Kimberly Morris', contact: '2024250622', email: 'kimberly.morris@cc-dc.org', clinic: '', needs: '' },
  { no: 27, name: 'David Lee', contact: '3016495001', email: 'ruths.leedentistry@gmail.com', clinic: 'Lee Dentistry', needs: '' },
  { no: 28, name: 'Aala Salimian', contact: '4105550456', email: 'aalasalimian@gmail.com', clinic: '', needs: '' },
  { no: 29, name: 'Michael Saffold', contact: '14109616839', email: 'safdent@verizon.net', clinic: 'Quest Dental', needs: '' },
  { no: 30, name: 'Cynthia Alimario', contact: '3047230791', email: 'actalim@gmail.com', clinic: '', needs: '' },
  { no: 31, name: 'Michael White', contact: '4104864353', email: 'cgrandprix@yahoo.com', clinic: 'Total Health Care', needs: '' },
  { no: 32, name: 'Cynthia Simon', contact: '4108285699', email: 'casimonrdh@gmail.com', clinic: 'Kids First Pediatric Dentistry', needs: '' },
  { no: 33, name: 'Basil Saiedy', contact: '4103379505', email: 'bsaiedy@aol.com', clinic: 'Green Spring Dental Care', needs: '' },
  { no: 34, name: 'Habib Ghahreman', contact: '3019630665', email: 'email4habib@gmail.com', clinic: 'Dental Suite', needs: '' },
  { no: 35, name: 'Kinneth Chong', contact: '4108848484', email: '', clinic: 'Kenneth Chong', needs: '' },
  { no: 36, name: 'Monica Chang-Watanabe', contact: '7037214261', email: 'mganbatte@yahoo.com', clinic: 'Smile Concept', needs: '' },
  { no: 37, name: 'J. Terrell Hoffeld', contact: '3017704489', email: 'jterrellhoffeld@gmail.com', clinic: 'U.S. Public Health Service (Retired)', needs: '' },
  { no: 38, name: 'Martha Bustillo', contact: '3013452222', email: 'mbustillo25@yahoo.com', clinic: 'Greenbelt Smiles', needs: '' },
  { no: 39, name: 'Toan Nguyen', contact: '3015286633', email: 'tdnguyen27@yahoo.com', clinic: 'Smile Design Dental', needs: '' },
  { no: 40, name: 'Elaine Miginsky', contact: '4102523136', email: 'parroteeth@verizon.net', clinic: '', needs: '' },
  { no: 41, name: 'Eric Levine', contact: '2024221006', email: 'elevine@olneydentalcenter.com', clinic: '', needs: '' },
  { no: 42, name: 'David Hazlet', contact: '7248161749', email: 'drdah@consolidated.net', clinic: '', needs: '' },
  { no: 43, name: 'Heather Nguyen', contact: '3019635555', email: 'heathernguyendds@gmail.com', clinic: 'Great Smiles Dental Care', needs: '' },
  { no: 44, name: 'Robert Miller', contact: '4106105283', email: 'rgmillerhjf@hotmail.com', clinic: '', needs: '' },
  { no: 45, name: 'David Scott', contact: '3014393331', email: 'dscottjr@erols.com', clinic: 'David L. Scott Jr., DDS', needs: '' },
  { no: 46, name: 'Richard Diaz', contact: '3017889036', email: 'ctdentist@gmail.com', clinic: '', needs: '' },
  { no: 47, name: 'Wendall Poulsen', contact: '3014219001', email: '', clinic: 'Wendall Poulsen, DDS', needs: '' },
  { no: 48, name: 'Eunice Wu', contact: '2159223700', email: 'ewudmd@gmail.com', clinic: '', needs: '' },
  { no: 49, name: 'John Balas', contact: '7193382770', email: 'jbalasdds@hotmail.com', clinic: '', needs: '' },
  { no: 50, name: 'Mabel Stanley', contact: '2402743008', email: 'ssdmd1@aol.com', clinic: '', needs: '' },
  { no: 51, name: 'Ryan Guard', contact: '4106726908', email: 'ryanandtiffany@gmail.com', clinic: '', needs: '' },
  { no: 52, name: 'Xuewei Li', contact: '6466621417', email: 'frontoffice@serenityfamilydental.us', clinic: '', needs: '' },
  { no: 53, name: 'Josephine Amigo', contact: '3017175267', email: 'jabamigo574@yahoo.com', clinic: '', needs: '' },
  { no: 54, name: 'Lan Duckett', contact: '5712151975', email: 'duckettddspc@hotmail.com', clinic: '', needs: '' },
  { no: 55, name: 'Leslie Davis-Groom', contact: '3013773998', email: 'ljgroom13@verizon.net', clinic: '', needs: '' },
  { no: 56, name: 'Bo Kim', contact: '2406435602', email: 'boramkim38@gmail.com', clinic: '', needs: '' },
  { no: 57, name: 'Fardous Medani', contact: '5035159482', email: 'fardousmekki@gmail.com', clinic: '', needs: '' },
  { no: 58, name: 'Anna Wu', contact: '4434655046', email: 'anna.wu.c@gmail.com', clinic: '', needs: '' },
  { no: 59, name: 'Laura Muhammad', contact: '2029054430', email: 'amnimar_dds1@yahoo.com', clinic: '', needs: '' },
  { no: 60, name: 'Ivan Sumitra', contact: '2026070326', email: 'drivan@verizon.net', clinic: '', needs: '' },
  { no: 61, name: 'Renie Gross', contact: '2404987578', email: 'reniemg@gmail.com', clinic: '', needs: '' },
  { no: 62, name: 'Elba Ventura', contact: '2013062545', email: 'elbaventura107@gmail.com', clinic: '', needs: '' },
  { no: 63, name: 'Dwight Garcia', contact: '2013201256', email: 'dgarciastarman14@gmail.com', clinic: 'All City Dental', needs: '' },
  { no: 64, name: 'Rajashree Karandikar', contact: '9089035549', email: 'rajikarandikar@yahoo.com', clinic: '', needs: '' },
  { no: 65, name: 'Inna Budiyanskaya', contact: '6462627984', email: 'ibudiyanskaya@hotmail.com', clinic: '', needs: '' },
  { no: 66, name: 'Anne Zenerovitz', contact: '9087358110', email: 'azenerovitz@comcast.net', clinic: '', needs: '' },
  { no: 67, name: 'Andrew Zenerovitz', contact: '9087358110', email: 'andrewzenerovitzdmd@gmail.com', clinic: '', needs: '' },
  { no: 68, name: 'Ogonna Orjiekwe', contact: '7185645517', email: 'ogonnao@yahoo.com', clinic: 'Diamond Dental Group', needs: '' },
  { no: 69, name: 'Nelly Vasquez', contact: '6463585646', email: 'nvasquezdds@msn.com', clinic: 'Urban Health Plan', needs: '' },
  { no: 70, name: 'Evan Spivack', contact: '9739727040', email: 'spivacev@sdm.rutgers.edu', clinic: '', needs: '' },
  { no: 71, name: 'Robert Praisner', contact: '9088795912', email: 'bobpraisner@yahoo.com', clinic: '', needs: '' },
  { no: 72, name: 'Enrique Salinas', contact: '9733448800', email: 'newarkfamilydentist@gmail.com', clinic: '', needs: '' },
  { no: 73, name: 'Jeffrey Wechsler', contact: '2015295999', email: 'drjzw@aol.com', clinic: '', needs: '' },
  { no: 74, name: 'Adam Wechsler', contact: '2013177188', email: 'adamwec@gmail.com', clinic: 'Family Dental Care of Mahwah', needs: '' },
  { no: 75, name: 'Julia Goldberg', contact: '9176746644', email: 'drjuliagold@aol.com', clinic: 'Be Well Dental', needs: '' },
  { no: 76, name: 'Yekaterina Levin', contact: '7188371797', email: 'levidental@verizon.net', clinic: '', needs: '' },
  { no: 77, name: 'Anneli Boller', contact: '7247491517', email: 'anneliboller@oakvalleymedical.com', clinic: 'Oak Valley Medical and Dental', needs: '' },
  { no: 78, name: 'Harmon Kaplan', contact: '2018668421', email: 'harmonkaplan@yahoo.com', clinic: 'Harmon B. Kaplan, D.M.D.', needs: '' },
  { no: 79, name: 'Julia Smirnova', contact: '2019415522', email: 'aplusdental@hotmail.com', clinic: 'A Plus Dental', needs: '' },
  { no: 80, name: 'Suzanne Campbell', contact: '7245508301', email: 'suzannecampbell@oakvalleymedical.com', clinic: 'Esopus Dental', needs: '' },
  { no: 81, name: 'Karen Quigley', contact: '6179685659', email: 'quigleyk@bu.edu', clinic: '', needs: '' },
  { no: 82, name: 'Francis Mante', contact: '16102039429', email: 'mantefk@upenn.edu', clinic: '', needs: '' },
  { no: 83, name: 'Steven Roberts', contact: '7742758799', email: 'srobert@bu.edu', clinic: 'Boston University', needs: '' },
  { no: 84, name: 'Howard Deutsch', contact: '9735630659', email: 'drhdeutsch172@gmail.com', clinic: 'Howard I. Deutsch, D.D.S.', needs: '' },
  { no: 85, name: 'Mark Robinson', contact: '9737141650', email: 'mdrdmd@aol.com', clinic: '', needs: '' },
  { no: 86, name: 'Amy Rojas', contact: '2013578700', email: 'amydmd07@yahoo.com', clinic: 'Allure Dental', needs: '' },
  { no: 87, name: 'Steven Canger', contact: '2017963675', email: 'sfcangerdds@optonline.net', clinic: '', needs: '' },
  { no: 88, name: 'Paul Hanna', contact: '8604423323', email: 'drpaulhanna@yahoo.com', clinic: '', needs: '' },
  { no: 89, name: 'Michael Colarusso', contact: '2014409190', email: 'michaelcolarussodds@gmail.com', clinic: '', needs: '' },
  { no: 90, name: 'Waguih Sidhom', contact: '7189846181', email: 'wsidhomdds@hotmail.com', clinic: '', needs: '' },
  { no: 91, name: 'Bob Montgomery', contact: '7329152740', email: 'drbobdds@optonline.net', clinic: 'The Relaxing Smile', needs: '' },
  { no: 92, name: 'Jay Jeong', contact: '2013216858', email: 'happydol82@gmail.com', clinic: '', needs: '' },
  { no: 93, name: 'Zoey DiMarco', contact: '9738862730', email: 'psdtundr@optonline.net', clinic: '', needs: '' },
  { no: 94, name: 'Douglas Doran', contact: '8603389178', email: 'drdoran@rivereastdentalgroup.com', clinic: '', needs: '' },
  { no: 95, name: 'Henry Karlin', contact: '3477032210', email: 'hekarlindds@gmail.com', clinic: '', needs: '' },
  { no: 96, name: 'Scott Peters', contact: '2015299000', email: 'drscottp@yahoo.com', clinic: '', needs: '' },
  { no: 97, name: 'Yoon Lyou', contact: '2153224888', email: 'joy-for-dentistry@comcast.net', clinic: 'Joy For Dentistry, LLC', needs: '' },
  { no: 98, name: 'David Stevens', contact: '9733660694', email: 'design_a_smile@yahoo.com', clinic: '', needs: '' },
  { no: 99, name: 'Gordon Dufour', contact: '9739517321', email: 'dufour7@optonline.net', clinic: '', needs: '' },
  { no: 100, name: 'Ilhyun Jung', contact: '7184264343', email: 'drdentist9@gmail.com', clinic: 'Ilhyun Jung DDS', needs: '' },
  // Test accounts for email blast testing
  { no: 101, name: 'Kreativ Loops', contact: '555-0001', email: 'kreativloops@gmail.com', clinic: 'KreativLoops Digital', needs: 'Test account for email blast functionality' },
  { no: 102, name: 'Cherwin Fernandez', contact: '555-0002', email: 'fernandez.cherwin@gmail.com', clinic: 'Fernandez Consulting', needs: 'Test account for email blast functionality' },
  { no: 103, name: 'IO KreativLoops', contact: '555-0003', email: 'io.kreativloops@gmail.com', clinic: 'IO KreativLoops Tech', needs: 'Test account for email blast functionality' }
]

// Process all CSV data into contact records
const realContacts: EmailContact[] = csvData.map((row, index) => {
  const { firstName, lastName } = parseName(row.name)
  const hasEmail = row.email && row.email.length > 0
  const status: 'active' | 'inactive' | 'bounced' = hasEmail ? 'active' : 'inactive'

  return {
    id: (index + 1).toString(),
    firstName,
    lastName,
    email: row.email || '',
    company: row.clinic || '',
    phone: formatPhone(row.contact),
    tags: generateTags(row.clinic, row.needs),
    status,
    createdAt: '2024-09-06'
  }
})

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('email-contacts') // Default to email contacts
  const [contacts, setContacts] = useState<EmailContact[]>(realContacts)
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContact, setEditingContact] = useState<EmailContact | null>(null)
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set())
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [emailContent, setEmailContent] = useState({
    subject: '',
    message: '',
    senderName: 'Happy Teeth Support Services'
  })
  const [emailAttachments, setEmailAttachments] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  // Email Configuration State
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null)
  const [testingEmail, setTestingEmail] = useState(false)
  const [testEmail, setTestEmail] = useState('')

  // Lead Generation State
  const [scrapedLeads, setScrapedLeads] = useState<DentalClinicLead[]>([])
  const [isScrapingLoading, setIsScrapingLoading] = useState(false)
  const [scrapingLocation, setScrapingLocation] = useState({
    zipCode: '',
    city: '',
    state: ''
  })
  const [scrapingFilters, setScrapingFilters] = useState({
    hasEmail: false,
    hasPhone: false,
    hasWebsite: false,
    specialties: [] as string[]
  })
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [sendingEmail, setSendingEmail] = useState(false)
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    tags: [] as string[],
    status: 'active' as 'active' | 'inactive' | 'bounced'
  })

  // CRUD Operations
  const handleAddContact = () => {
    if (!newContact.firstName || !newContact.email) return

    const contact: EmailContact = {
      id: (contacts.length + 1).toString(),
      firstName: newContact.firstName,
      lastName: newContact.lastName,
      email: newContact.email,
      company: newContact.company,
      phone: newContact.phone,
      tags: newContact.tags.length > 0 ? newContact.tags : ['prospect'],
      status: newContact.status,
      createdAt: new Date().toISOString().split('T')[0]
    }

    setContacts([...contacts, contact])
    setNewContact({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      tags: [],
      status: 'active'
    })
    setShowAddContact(false)
  }

  const handleEditContact = (contact: EmailContact) => {
    setEditingContact(contact)
    setNewContact({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      company: contact.company,
      phone: contact.phone || '',
      tags: contact.tags,
      status: contact.status
    })
    setShowAddContact(true)
  }

  const handleUpdateContact = () => {
    if (!editingContact || !newContact.firstName || !newContact.email) return

    const updatedContact: EmailContact = {
      ...editingContact,
      firstName: newContact.firstName,
      lastName: newContact.lastName,
      email: newContact.email,
      company: newContact.company,
      phone: newContact.phone,
      tags: newContact.tags.length > 0 ? newContact.tags : ['prospect'],
      status: newContact.status
    }

    setContacts(contacts.map(c => c.id === editingContact.id ? updatedContact : c))
    setNewContact({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      tags: [],
      status: 'active'
    })
    setEditingContact(null)
    setShowAddContact(false)
  }

  const handleDeleteContact = (contactId: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      setContacts(contacts.filter(c => c.id !== contactId))
    }
  }

  const handleCancelEdit = () => {
    setEditingContact(null)
    setNewContact({
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      tags: [],
      status: 'active'
    })
    setShowAddContact(false)
  }

  // Email Selection Functions
  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedContacts(newSelected)
  }

  const handleSelectAll = () => {
    const activeContactsWithEmail = contacts.filter(c => c.status === 'active' && c.email)
    if (selectedContacts.size === activeContactsWithEmail.length) {
      setSelectedContacts(new Set())
    } else {
      setSelectedContacts(new Set(activeContactsWithEmail.map(c => c.id)))
    }
  }

  const getSelectedContactsData = () => {
    return contacts.filter(c => selectedContacts.has(c.id))
  }

  // File Attachment Functions
  const handleFileUpload = (files: FileList | null) => {
    if (!files) return

    const validFiles: File[] = []
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain'
    ]

    Array.from(files).forEach(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        return
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} is not supported. Please use PDF, Word, Excel, images, or text files.`)
        return
      }

      validFiles.push(file)
    })

    setEmailAttachments(prev => [...prev, ...validFiles])
  }

  const handleRemoveAttachment = (index: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />
    if (fileType.includes('image')) return <Image className="w-4 h-4 text-blue-500" />
    if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-500" />
    return <FileText className="w-4 h-4 text-gray-500" />
  }

  // Call Functions
  const handleCallContact = (phone: string, contactName: string) => {
    if (!phone) {
      alert('No phone number available for this contact.')
      return
    }

    // Clean phone number (remove formatting)
    const cleanPhone = phone.replace(/\D/g, '')

    // Try multiple calling methods
    const confirmCall = confirm(
      `Call ${contactName} at ${phone}?\n\nThis will:\n• Try to open your default calling app\n• Work with Line2 if installed\n• Work with any VoIP software on your device`
    )

    if (confirmCall) {
      // Primary method: Use tel: protocol (works with mobile, desktop calling apps, and Line2)
      window.location.href = `tel:${cleanPhone}`

      // Log the call attempt for potential future integration
      console.log(`Call initiated to ${contactName} (${phone}) at ${new Date().toISOString()}`)
    }
  }

  // Email Configuration Functions
  const fetchEmailConfig = async () => {
    try {
      const response = await fetch('/api/email-config')
      const data = await response.json()
      if (data.success) {
        setEmailConfig(data.config)
      }
    } catch (error) {
      console.error('Failed to fetch email config:', error)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      alert('Please enter an email address to test')
      return
    }

    setTestingEmail(true)
    try {
      const response = await fetch('/api/email-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail })
      })

      const data = await response.json()
      if (data.success) {
        alert(`✅ Test email sent successfully via ${data.provider.toUpperCase()}!`)
      } else {
        alert(`❌ Test failed: ${data.error}`)
      }
    } catch (error) {
      alert(`❌ Test failed: ${error}`)
    }
    setTestingEmail(false)
  }

  // Load email config on component mount
  React.useEffect(() => {
    fetchEmailConfig()
  }, [])

  // Email Blast Functions
  const handleOpenEmailComposer = () => {
    if (selectedContacts.size === 0) {
      alert('Please select at least one contact to send emails.')
      return
    }
    setShowEmailComposer(true)
  }

  const handleSendEmailBlast = async () => {
    if (!emailContent.subject || !emailContent.message) {
      alert('Please fill in both subject and message.')
      return
    }

    setSendingEmail(true)
    try {
      const selectedContactsData = getSelectedContactsData()

      const response = await fetch('/api/send-email-blast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contacts: selectedContactsData,
          subject: emailContent.subject,
          message: emailContent.message,
          senderName: emailContent.senderName
        }),
      })

      if (response.ok) {
        alert(`Email sent successfully to ${selectedContactsData.length} contacts!`)
        setShowEmailComposer(false)
        setEmailContent({
          subject: '',
          message: '',
          senderName: 'Happy Teeth Support Services'
        })
        setEmailAttachments([])
        setSelectedContacts(new Set())
      } else {
        const error = await response.text()
        alert(`Failed to send emails: ${error}`)
      }
    } catch (error) {
      alert(`Error sending emails: ${error}`)
    }
    setSendingEmail(false)
  }

  // Lead Generation Functions
  const handleScrapeDentalClinics = async () => {
    if (!scrapingLocation.zipCode && !scrapingLocation.city) {
      alert('Please enter a ZIP code or city to search')
      return
    }

    setIsScrapingLoading(true)
    try {
      const response = await fetch('/api/scrape-dental-clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: scrapingLocation,
          filters: scrapingFilters
        })
      })

      const data = await response.json()

      if (data.success) {
        setScrapedLeads(data.data.leads)
        alert(`✅ Found ${data.data.leads.length} dental clinic leads!`)
      } else {
        throw new Error(data.error || 'Scraping failed')
      }
    } catch (error) {
      console.error('Scraping error:', error)
      alert(`❌ Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setIsScrapingLoading(false)
  }

  const handleConvertLeadsToContacts = () => {
    if (selectedLeads.size === 0) {
      alert('Please select leads to convert to contacts')
      return
    }

    const leadsToConvert = scrapedLeads.filter(lead => selectedLeads.has(lead.id))
    const newContacts: EmailContact[] = leadsToConvert.map(lead => ({
      id: `lead-${lead.id}`,
      firstName: lead.contactPerson ? lead.contactPerson.split(' ')[0] : lead.name.split(' ')[0],
      lastName: lead.contactPerson ? lead.contactPerson.split(' ').slice(1).join(' ') : lead.name.split(' ').slice(1).join(' ') || 'Practice',
      email: lead.email || '',
      company: lead.name,
      phone: lead.phone,
      tags: ['scraped-lead', ...lead.specialties, ...lead.needsIndicators],
      status: (lead.email ? 'active' : 'inactive') as 'active' | 'inactive' | 'bounced',
      createdAt: new Date().toISOString().split('T')[0]
    }))

    setContacts(prev => [...prev, ...newContacts])
    setSelectedLeads(new Set())
    alert(`✅ Converted ${newContacts.length} leads to contacts`)
  }

  const toggleLeadSelection = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const toggleAllLeads = () => {
    if (selectedLeads.size === scrapedLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(scrapedLeads.map(lead => lead.id)))
    }
  }

  // Calculate email marketing statistics based on current contacts
  const emailStats: DashboardStats = {
    totalCalls: contacts.length, // Total contacts
    totalTickets: contacts.filter(c => c.status === 'active').length, // Active contacts
    activePractices: contacts.filter(c => c.email && c.email.length > 0).length, // Valid emails
    monthlyRevenue: 8500,
    openTickets: contacts.filter(c => c.tags.includes('needs-admin') || c.tags.includes('needs-manager')).length, // Hot leads
    resolvedTickets: contacts.filter(c => c.tags.includes('wants-outsourcing') || c.tags.includes('interested-in-va')).length, // Qualified leads
    urgentTickets: contacts.filter(c => c.tags.includes('expanding')).length, // Urgent prospects
    recentCalls: contacts.filter(c => c.status === 'inactive').length // Need follow-up
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">HT</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Happy Teeth CRM</h1>
              <p className="text-blue-100 text-xs">Administrative Support Services</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-6 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full px-6 py-3 text-left ${activeTab === 'dashboard' ? 'text-gray-700 bg-blue-50 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <TrendingUp size={20} className="mr-3" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('email-contacts')}
            className={`flex items-center w-full px-6 py-3 text-left ${activeTab === 'email-contacts' ? 'text-gray-700 bg-blue-50 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Mail size={20} className="mr-3" />
            Email Contacts
          </button>
          <button
            onClick={() => setActiveTab('lead-generation')}
            className={`flex items-center w-full px-6 py-3 text-left ${activeTab === 'lead-generation' ? 'text-gray-700 bg-blue-50 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Search size={20} className="mr-3" />
            Lead Generation
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full px-6 py-3 text-left ${activeTab === 'settings' ? 'text-gray-700 bg-blue-50 border-r-4 border-blue-500' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Settings size={20} className="mr-3" />
            Settings
          </button>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              HT
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Happy Teeth Support</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth')
              window.location.href = '/login'
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm border-b border-blue-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4 text-blue-600 hover:text-blue-800"
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="text-white font-bold text-sm">HT</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {activeTab === 'dashboard' && 'Dashboard Overview'}
                    {activeTab === 'email-contacts' && 'Email Marketing Hub'}
                    {activeTab === 'lead-generation' && 'Lead Generation Portal'}
                    {activeTab === 'settings' && 'Email Configuration'}
                  </h2>
                  <p className="text-xs text-blue-600 font-medium">
                    {activeTab === 'dashboard' && 'Monitor your administrative support metrics'}
                    {activeTab === 'email-contacts' && 'Manage dental practice contacts & campaigns'}
                    {activeTab === 'lead-generation' && 'Find dental clinics needing admin support'}
                    {activeTab === 'settings' && 'Configure email providers and test settings'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border border-blue-200">
                <div className="text-sm font-medium text-gray-700">
                  Happy Teeth Support Services
                </div>
                <div className="text-xs text-blue-600">
                  Administrative Excellence Team
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-blue-200">
                HT
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-gray-50 to-blue-50">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Contacts</p>
                  <p className="text-3xl font-bold text-gray-900">{emailStats.totalCalls}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1 font-medium">Ready for campaigns</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Contacts</p>
                  <p className="text-3xl font-bold text-gray-900">{emailStats.totalTickets}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600 font-medium">With valid email addresses</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Hot Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{emailStats.openTickets}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Target className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-orange-600 font-medium">Need admin support</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-lg border border-yellow-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Need Follow-up</p>
                  <p className="text-3xl font-bold text-gray-900">{emailStats.recentCalls}</p>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 ml-1 font-medium">Missing email addresses</span>
              </div>
            </div>
          </div>

          {/* Recent Marketing Activity & Email Campaign Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Marketing Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Marketing Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentMarketingActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'email' ? (
                          <Mail className={`w-4 h-4 ${
                            activity.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <Users className={`w-4 h-4 ${
                            activity.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {activity.status === 'in_progress' && <Clock className="w-5 h-5 text-yellow-500" />}
                        {activity.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Email Campaign Performance */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Email Campaign Performance</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {emailCampaignStats.map((campaign, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-900">{campaign.campaign}</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{campaign.sent}</p>
                          <p className="text-xs text-gray-500">Sent</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-blue-600">{campaign.opened}</p>
                          <p className="text-xs text-gray-500">Opened</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-green-600">{campaign.responded}</p>
                          <p className="text-xs text-gray-500">Responded</p>
                        </div>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(campaign.opened / campaign.sent) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {Math.round((campaign.opened / campaign.sent) * 100)}% open rate
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
              </div>
            </>
          )}

          {activeTab === 'email-contacts' && (
            <div className="space-y-6">
              {/* Header with Actions */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Email Contacts</h3>
                  <p className="text-sm text-gray-600">
                    Manage your email marketing contacts and lists
                    {selectedContacts.size > 0 && (
                      <span className="ml-2 text-blue-600 font-medium">
                        ({selectedContacts.size} selected)
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <label className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer">
                    <Upload size={20} className="mr-2" />
                    Upload CSV
                    <input type="file" accept=".csv" className="hidden" />
                  </label>
                  <button
                    onClick={() => setShowAddContact(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus size={20} className="mr-2" />
                    Add Contact
                  </button>
                </div>
              </div>

              {/* Contacts Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <button
                            onClick={handleSelectAll}
                            className="flex items-center space-x-2 hover:text-gray-700"
                          >
                            {selectedContacts.size === contacts.filter(c => c.status === 'active' && c.email).length && contacts.filter(c => c.status === 'active' && c.email).length > 0 ? (
                              <CheckSquare size={16} />
                            ) : (
                              <Square size={16} />
                            )}
                            <span>Select</span>
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tags
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Added
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map((contact) => (
                        <tr key={contact.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            {contact.status === 'active' && contact.email ? (
                              <button
                                onClick={() => handleSelectContact(contact.id)}
                                className="text-gray-500 hover:text-blue-600"
                              >
                                {selectedContacts.has(contact.id) ? (
                                  <CheckSquare size={16} className="text-blue-600" />
                                ) : (
                                  <Square size={16} />
                                )}
                              </button>
                            ) : (
                              <div className="w-4 h-4"></div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{contact.email}</div>
                              {contact.phone && (
                                <div className="text-sm text-gray-500">{contact.phone}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {contact.company}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {contact.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                contact.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : contact.status === 'inactive'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {contact.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {contact.createdAt}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              {contact.phone && (
                                <button
                                  onClick={() => handleCallContact(contact.phone!, `${contact.firstName} ${contact.lastName}`)}
                                  className="text-green-600 hover:text-green-900"
                                  title={`Call ${contact.firstName} ${contact.lastName}`}
                                >
                                  <Phone size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="text-blue-600 hover:text-blue-900"
                                title="Edit contact"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete contact"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {contacts.length === 0 && (
                <div className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by uploading a CSV file or adding your first contact.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'lead-generation' && (
            <div className="p-6">
              {/* Search Form */}
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Find Dental Clinics</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin size={16} className="inline mr-1" />
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={scrapingLocation.zipCode}
                      onChange={(e) => setScrapingLocation(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="e.g., 90210"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={scrapingLocation.city}
                      onChange={(e) => setScrapingLocation(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g., Beverly Hills"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={scrapingLocation.state}
                      onChange={(e) => setScrapingLocation(prev => ({ ...prev, state: e.target.value }))}
                      placeholder="e.g., CA"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filters</label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scrapingFilters.hasEmail}
                        onChange={(e) => setScrapingFilters(prev => ({ ...prev, hasEmail: e.target.checked }))}
                        className="mr-2"
                      />
                      Must have email
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scrapingFilters.hasPhone}
                        onChange={(e) => setScrapingFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                        className="mr-2"
                      />
                      Must have phone
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={scrapingFilters.hasWebsite}
                        onChange={(e) => setScrapingFilters(prev => ({ ...prev, hasWebsite: e.target.checked }))}
                        className="mr-2"
                      />
                      Must have website
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleScrapeDentalClinics}
                  disabled={isScrapingLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isScrapingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search size={16} className="mr-2" />
                      Find Dental Clinics
                    </>
                  )}
                </button>
              </div>

              {/* Results */}
              {scrapedLeads.length > 0 && (
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Found {scrapedLeads.length} Dental Clinic Leads
                    </h3>
                    <div className="flex space-x-3">
                      <button
                        onClick={toggleAllLeads}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {selectedLeads.size === scrapedLeads.length ? 'Unselect All' : 'Select All'}
                      </button>
                      {selectedLeads.size > 0 && (
                        <button
                          onClick={handleConvertLeadsToContacts}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                        >
                          Convert {selectedLeads.size} to Contacts
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Select
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Clinic Information
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact Details
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Specialties
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Needs Indicators
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {scrapedLeads.map((lead) => (
                          <tr key={lead.id} className={selectedLeads.has(lead.id) ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => toggleLeadSelection(lead.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                {selectedLeads.has(lead.id) ? (
                                  <CheckSquare size={20} />
                                ) : (
                                  <Square size={20} />
                                )}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                                <div className="text-sm text-gray-500">{lead.address}</div>
                                {lead.contactPerson && (
                                  <div className="text-sm text-blue-600">Contact: {lead.contactPerson}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                {lead.phone && (
                                  <div className="text-sm text-gray-900 flex items-center">
                                    <Phone size={14} className="mr-1" />
                                    {lead.phone}
                                  </div>
                                )}
                                {lead.email && (
                                  <div className="text-sm text-gray-900 flex items-center">
                                    <Mail size={14} className="mr-1" />
                                    {lead.email}
                                  </div>
                                )}
                                {lead.website && (
                                  <div className="text-sm text-gray-900 flex items-center">
                                    <Globe size={14} className="mr-1" />
                                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      Website
                                    </a>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {lead.specialties.map((specialty, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                  >
                                    {specialty}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {lead.needsIndicators.map((indicator, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                  >
                                    <Target size={12} className="mr-1" />
                                    {indicator}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                {lead.website && (
                                  <a
                                    href={lead.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Globe size={16} />
                                  </a>
                                )}
                                {lead.phone && (
                                  <button
                                    onClick={() => handleCallContact(lead.phone!, lead.name)}
                                    className="text-green-600 hover:text-green-900"
                                    title={`Call ${lead.name}`}
                                  >
                                    <Phone size={16} />
                                  </button>
                                )}
                                {lead.email && (
                                  <a
                                    href={`mailto:${lead.email}`}
                                    className="text-purple-600 hover:text-purple-900"
                                  >
                                    <Mail size={16} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {scrapedLeads.length === 0 && !isScrapingLoading && (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No leads found yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a location above to start finding dental clinics that need administrative support.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Email Configuration Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Email Provider Configuration</h3>
                    <p className="text-sm text-gray-600">
                      Configure your email provider for sending campaigns
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {emailConfig?.isActive ? (
                      <div className="flex items-center text-green-600">
                        <Check size={16} className="mr-1" />
                        <span className="text-sm font-medium">
                          {emailConfig.provider.toUpperCase()} Connected
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-600">
                        <AlertTriangle size={16} className="mr-1" />
                        <span className="text-sm font-medium">Not Configured</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Configuration Display */}
                {emailConfig && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Current Provider</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Provider:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {emailConfig.provider.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {emailConfig.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Sender Name:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {emailConfig.senderName}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            emailConfig.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {emailConfig.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">Test Email Configuration</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Email Address
                          </label>
                          <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            placeholder="test@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleTestEmail}
                          disabled={testingEmail || !testEmail}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {testingEmail ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <Send size={16} className="mr-2" />
                              Send Test Email
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Configuration Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Configuration Instructions</h4>
                  <div className="text-sm text-blue-800 space-y-2">
                    <p>
                      Email providers are configured via environment variables in your .env file:
                    </p>
                    <div className="bg-white rounded border p-3 font-mono text-xs space-y-1">
                      <div><strong>EMAIL_PROVIDER=</strong> gmail | outlook | smtp</div>
                      <div><strong>For Gmail:</strong></div>
                      <div className="ml-4">GMAIL_EMAIL=your-email@gmail.com</div>
                      <div className="ml-4">GMAIL_APP_PASSWORD=your-app-password</div>
                      <div className="ml-4">GMAIL_SENDER_NAME=&quot;Your Name&quot;</div>
                      <div><strong>For Outlook:</strong></div>
                      <div className="ml-4">OUTLOOK_EMAIL=your-email@outlook.com</div>
                      <div className="ml-4">OUTLOOK_PASSWORD=your-password</div>
                      <div className="ml-4">OUTLOOK_SENDER_NAME=&quot;Your Name&quot;</div>
                      <div><strong>For SMTP:</strong></div>
                      <div className="ml-4">SMTP_EMAIL=your-email@domain.com</div>
                      <div className="ml-4">SMTP_PASSWORD=your-password</div>
                      <div className="ml-4">SMTP_HOST=smtp.domain.com</div>
                      <div className="ml-4">SMTP_PORT=587</div>
                      <div className="ml-4">SMTP_SECURE=false</div>
                      <div className="ml-4">SMTP_SENDER_NAME=&quot;Your Name&quot;</div>
                    </div>
                    <p className="mt-2">
                      <strong>Note:</strong> For Gmail, you&apos;ll need to generate an App Password in your
                      Google Account settings under Security → 2-Step Verification → App passwords.
                    </p>
                    <p>
                      Restart your application after making changes to environment variables.
                    </p>
                  </div>
                </div>
              </div>

              {/* Calling Configuration */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Calling Configuration</h3>
                    <p className="text-sm text-gray-600">
                      Configure calling functionality with Line2 and other VoIP services
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-green-600">
                      <Check size={16} className="mr-1" />
                      <span className="text-sm font-medium">Universal Calling Enabled</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-green-800 mb-2">
                        ✅ Calling Feature Active
                      </h4>
                      <p className="text-sm text-green-700 mb-3">
                        Click any phone number to initiate calls through your preferred calling application.
                      </p>

                      <div className="space-y-2 text-sm text-green-700">
                        <div className="flex items-center">
                          <Phone size={14} className="mr-2" />
                          <span><strong>Line2 Integration:</strong> Works automatically when Line2 is installed</span>
                        </div>
                        <div className="flex items-center">
                          <Phone size={14} className="mr-2" />
                          <span><strong>Mobile Devices:</strong> Uses native phone app</span>
                        </div>
                        <div className="flex items-center">
                          <Phone size={14} className="mr-2" />
                          <span><strong>Desktop VoIP:</strong> Compatible with Skype, Teams, and other calling apps</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">
                    📞 How to Use Calling Features
                  </h4>
                  <div className="text-sm text-blue-700 space-y-2">
                    <div>1. <strong>Contact Table:</strong> Click the green phone icon next to any contact&apos;s phone number</div>
                    <div>2. <strong>Lead Generation:</strong> Click the phone icon in the Actions column for scraped leads</div>
                    <div>3. <strong>Confirmation Dialog:</strong> Confirm the call and your system will open the appropriate calling app</div>
                  </div>
                </div>

                <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-2">
                    🔧 Line2 Setup Instructions
                  </h4>
                  <div className="text-sm text-yellow-700 space-y-2">
                    <div>1. Download and install Line2 from <a href="https://www.line2.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">line2.com</a></div>
                    <div>2. Configure your Line2 account and phone number</div>
                    <div>3. Set Line2 as your default calling application (optional)</div>
                    <div>4. Call buttons will automatically work with Line2 when installed</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'dashboard' && activeTab !== 'email-contacts' && activeTab !== 'lead-generation' && activeTab !== 'settings' && (
            <div className="text-center py-12">
              <div className="text-gray-400">
                <div className="text-lg font-medium">Coming Soon</div>
                <p className="mt-2">This section is under development.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Composition Modal */}
      {showEmailComposer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Email Blast to {selectedContacts.size} Contacts
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Recipients: {getSelectedContactsData().map(c => c.email).join(', ')}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sender Name
                </label>
                <input
                  type="text"
                  value={emailContent.senderName}
                  onChange={(e) => setEmailContent({ ...emailContent, senderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your name or company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailContent.subject}
                  onChange={(e) => setEmailContent({ ...emailContent, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email subject line"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  value={emailContent.message}
                  onChange={(e) => setEmailContent({ ...emailContent, message: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your email message..."
                />
              </div>

              {/* File Attachments Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Paperclip size={16} className="inline mr-1" />
                  Attachments
                </label>

                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="space-y-2">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Drop files here</span> or{' '}
                      <label className="text-blue-600 hover:text-blue-700 cursor-pointer">
                        browse to upload
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PDF, Word, Excel, Images, Text files up to 10MB each
                    </p>
                  </div>
                </div>

                {/* Attached Files List */}
                {emailAttachments.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h5 className="text-sm font-medium text-gray-700">Attached Files:</h5>
                    {emailAttachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{file.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAttachment(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove attachment"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Email Template Variables:</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>&#123;&#123;firstName&#125;&#125;</strong> - Contact&apos;s first name</p>
                  <p><strong>&#123;&#123;lastName&#125;&#125;</strong> - Contact&apos;s last name</p>
                  <p><strong>&#123;&#123;company&#125;&#125;</strong> - Contact&apos;s company name</p>
                  <p><strong>&#123;&#123;email&#125;&#125;</strong> - Contact&apos;s email address</p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailComposer(false)
                  setEmailAttachments([])
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={sendingEmail}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmailBlast}
                disabled={sendingEmail || !emailContent.subject || !emailContent.message}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Send Email Blast
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={newContact.tags.join(', ')}
                  onChange={(e) => setNewContact({
                    ...newContact,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="dental, prospect, hot-lead (comma separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newContact.status}
                  onChange={(e) => setNewContact({ ...newContact, status: e.target.value as 'active' | 'inactive' | 'bounced' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="bounced">Bounced</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingContact ? handleUpdateContact : handleAddContact}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {editingContact ? 'Update Contact' : 'Add Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Email Blast Button */}
      {selectedContacts.size > 0 && activeTab === 'email-contacts' && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={handleOpenEmailComposer}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 border border-green-500"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Send size={20} />
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {selectedContacts.size}
                </div>
              </div>
              <span className="font-medium">Email Blast</span>
            </div>
          </button>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}