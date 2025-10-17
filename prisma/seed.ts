import { PrismaClient, Role, ServiceLevel, Priority, TicketStatus, TicketCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kreativlab.com' },
    update: {},
    create: {
      email: 'admin@kreativlab.com',
      name: 'System Administrator',
      role: Role.ADMIN,
    },
  })

  // Create manager user
  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@kreativlab.com' },
    update: {},
    create: {
      email: 'manager@kreativlab.com',
      name: 'Call Center Manager',
      role: Role.MANAGER,
    },
  })

  // Create sample agents
  const agent1 = await prisma.user.upsert({
    where: { email: 'sarah@kreativlab.com' },
    update: {},
    create: {
      email: 'sarah@kreativlab.com',
      name: 'Sarah Johnson',
      role: Role.AGENT,
    },
  })

  const agent2 = await prisma.user.upsert({
    where: { email: 'mike@kreativlab.com' },
    update: {},
    create: {
      email: 'mike@kreativlab.com',
      name: 'Mike Chen',
      role: Role.AGENT,
    },
  })

  // Create sample dental practices
  const practice1 = await prisma.practice.upsert({
    where: { id: 'practice-1' },
    update: {},
    create: {
      id: 'practice-1',
      name: 'Smile Dental Care',
      address: '123 Main Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701',
      phone: '(512) 555-0123',
      email: 'office@smiledentalcare.com',
      website: 'https://smiledentalcare.com',
      practiceType: 'General Dentistry',
      numberOfChairs: 4,
      averagePatients: 150,
      serviceLevel: ServiceLevel.PREMIUM,
      contractStart: new Date('2024-01-01'),
      contractEnd: new Date('2024-12-31'),
      monthlyFee: 2500.00,
      isActive: true,
    },
  })

  const practice2 = await prisma.practice.upsert({
    where: { id: 'practice-2' },
    update: {},
    create: {
      id: 'practice-2',
      name: 'Family Dental Associates',
      address: '456 Oak Avenue',
      city: 'Dallas',
      state: 'TX',
      zipCode: '75201',
      phone: '(214) 555-0456',
      email: 'info@familydentalassoc.com',
      website: 'https://familydentalassoc.com',
      practiceType: 'Family Dentistry',
      numberOfChairs: 6,
      averagePatients: 200,
      serviceLevel: ServiceLevel.ENTERPRISE,
      contractStart: new Date('2024-01-01'),
      contractEnd: new Date('2024-12-31'),
      monthlyFee: 3500.00,
      isActive: true,
    },
  })

  // Create practice contacts
  await prisma.contact.create({
    data: {
      practiceId: practice1.id,
      firstName: 'Dr. Jennifer',
      lastName: 'Smith',
      title: 'DDS',
      email: 'dr.smith@smiledentalcare.com',
      phone: '(512) 555-0123',
      mobile: '(512) 555-7890',
      isPrimary: true,
    },
  })

  await prisma.contact.create({
    data: {
      practiceId: practice1.id,
      firstName: 'Lisa',
      lastName: 'Rodriguez',
      title: 'Office Manager',
      email: 'lisa@smiledentalcare.com',
      phone: '(512) 555-0123',
      isPrimary: false,
    },
  })

  await prisma.contact.create({
    data: {
      practiceId: practice2.id,
      firstName: 'Dr. Michael',
      lastName: 'Johnson',
      title: 'DDS',
      email: 'dr.johnson@familydentalassoc.com',
      phone: '(214) 555-0456',
      mobile: '(214) 555-9876',
      isPrimary: true,
    },
  })

  // Create sample tickets
  await prisma.ticket.create({
    data: {
      practiceId: practice1.id,
      assignedToId: agent1.id,
      subject: 'Patient scheduling conflict',
      description: 'Patient called about appointment scheduling conflict for next week.',
      priority: Priority.MEDIUM,
      status: TicketStatus.OPEN,
      category: TicketCategory.APPOINTMENT_ISSUE,
      patientName: 'John Doe',
      patientPhone: '(512) 555-1234',
    },
  })

  await prisma.ticket.create({
    data: {
      practiceId: practice2.id,
      assignedToId: agent2.id,
      subject: 'Insurance verification needed',
      description: 'Need to verify insurance coverage for upcoming procedure.',
      priority: Priority.HIGH,
      status: TicketStatus.IN_PROGRESS,
      category: TicketCategory.INSURANCE_CLAIM,
      patientName: 'Jane Wilson',
      patientPhone: '(214) 555-5678',
    },
  })

  // Create sample billing records
  await prisma.billing.create({
    data: {
      practiceId: practice1.id,
      billingMonth: 10,
      billingYear: 2024,
      totalCharges: 25000.00,
      totalPayments: 22000.00,
      totalAdjustments: 1000.00,
      netRevenue: 21000.00,
      outstandingBalance: 3000.00,
      collectionRate: 88.0,
      daysInAR: 45,
      agingOver90Days: 500.00,
    },
  })

  await prisma.billing.create({
    data: {
      practiceId: practice2.id,
      billingMonth: 10,
      billingYear: 2024,
      totalCharges: 35000.00,
      totalPayments: 32000.00,
      totalAdjustments: 1500.00,
      netRevenue: 30500.00,
      outstandingBalance: 2000.00,
      collectionRate: 92.0,
      daysInAR: 35,
      agingOver90Days: 300.00,
    },
  })

  // Create sample insurance claims
  await prisma.insuranceClaim.create({
    data: {
      practiceId: practice1.id,
      claimNumber: 'CLM-2024-001',
      patientName: 'John Doe',
      patientId: 'PAT-001',
      insuranceCarrier: 'Delta Dental',
      policyNumber: 'DD123456789',
      serviceDate: new Date('2024-10-15'),
      chargedAmount: 150.00,
      allowedAmount: 135.00,
      paidAmount: 135.00,
      patientPortion: 0.00,
    },
  })

  // Create system settings
  await prisma.settings.upsert({
    where: { key: 'company_name' },
    update: {},
    create: {
      key: 'company_name',
      value: 'Happy Teeth Support Services',
    },
  })

  await prisma.settings.upsert({
    where: { key: 'default_service_hours' },
    update: {},
    create: {
      key: 'default_service_hours',
      value: {
        monday: { start: '08:00', end: '17:00' },
        tuesday: { start: '08:00', end: '17:00' },
        wednesday: { start: '08:00', end: '17:00' },
        thursday: { start: '08:00', end: '17:00' },
        friday: { start: '08:00', end: '17:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: { start: null, end: null }
      },
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log('👤 Admin user:', adminUser.email)
  console.log('👤 Manager user:', managerUser.email)
  console.log('👤 Agent users:', agent1.email, ',', agent2.email)
  console.log('🏥 Sample practices created')
  console.log('🎫 Sample tickets created')
  console.log('💰 Sample billing data created')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })