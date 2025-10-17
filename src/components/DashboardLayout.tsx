'use client'

import { useState } from 'react'
import {
  Phone,
  Ticket,
  Building2,
  DollarSign,
  Users,
  Calendar,
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
  Download,
  Send,
  CheckSquare,
  Square
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


const mockRecentActivity = [
  { id: 1, type: 'call', description: 'Inbound call from Smile Dental Care', time: '2 mins ago', status: 'completed' },
  { id: 2, type: 'ticket', description: 'Insurance claim submission - Delta Dental', time: '15 mins ago', status: 'in_progress' },
  { id: 3, type: 'call', description: 'Emergency appointment scheduling', time: '32 mins ago', status: 'completed' },
  { id: 4, type: 'ticket', description: 'Billing system integration support', time: '1 hour ago', status: 'urgent' },
  { id: 5, type: 'call', description: 'Post-surgery follow-up call', time: '2 hours ago', status: 'completed' },
]

const mockPractices = [
  { name: 'Smile Dental Care', serviceLevel: 'Premium', status: 'active', lastContact: '2 hours ago' },
  { name: 'Family Dentistry Plus', serviceLevel: 'Standard', status: 'active', lastContact: '4 hours ago' },
  { name: 'Advanced Oral Surgery', serviceLevel: 'Enterprise', status: 'active', lastContact: '1 day ago' },
  { name: 'Bright Smiles Orthodontics', serviceLevel: 'Basic', status: 'active', lastContact: '2 days ago' },
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
  { no: 100, name: 'Ilhyun Jung', contact: '7184264343', email: 'drdentist9@gmail.com', clinic: 'Ilhyun Jung DDS', needs: '' }
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
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">KreativLab CRM</h1>
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
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              HT
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Happy Teeth Support</p>
              <p className="text-xs text-gray-500">htsscrm</p>
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
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'email-contacts' && 'Email Contacts'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome back, Happy Teeth Support Services
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                HT
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.totalCalls}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">Ready for campaigns</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Contacts</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.totalTickets}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">With valid email addresses</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hot Leads</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.openTickets}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-red-600">Need admin support</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Need Follow-up</p>
                  <p className="text-2xl font-bold text-gray-900">{emailStats.recentCalls}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 ml-1">Missing email addresses</span>
              </div>
            </div>
          </div>

          {/* Recent Activity & Practice Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockRecentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'urgent' ? 'bg-red-100' :
                        activity.status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'call' ? (
                          <Phone className={`w-4 h-4 ${
                            activity.status === 'urgent' ? 'text-red-600' :
                            activity.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <Ticket className={`w-4 h-4 ${
                            activity.status === 'urgent' ? 'text-red-600' :
                            activity.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {activity.status === 'urgent' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {activity.status === 'in_progress' && <Clock className="w-5 h-5 text-yellow-500" />}
                        {activity.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Practice Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Practice Status</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockPractices.map((practice, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{practice.name}</p>
                          <p className="text-xs text-gray-500">{practice.serviceLevel} Plan</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-500">Active</span>
                        </div>
                        <p className="text-xs text-gray-400">{practice.lastContact}</p>
                      </div>
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
                  {selectedContacts.size > 0 && (
                    <button
                      onClick={handleOpenEmailComposer}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Send size={20} className="mr-2" />
                      Email Blast ({selectedContacts.size})
                    </button>
                  )}
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
                              <button
                                onClick={() => handleEditContact(contact)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className="text-red-600 hover:text-red-900"
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

          {activeTab !== 'dashboard' && activeTab !== 'email-contacts' && (
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
                onClick={() => setShowEmailComposer(false)}
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