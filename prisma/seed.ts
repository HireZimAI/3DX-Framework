import { PrismaClient, Role, ProjectStatus, Priority, PhaseStatus, PhaseType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const podPassword = await bcrypt.hash('pod123', 10)
  const clientPassword = await bcrypt.hash('client123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@horizon3dx.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@horizon3dx.com',
      password: adminPassword,
      role: Role.ADMIN,
    },
  })

  const podLead1 = await prisma.user.upsert({
    where: { email: 'sarah@horizon3dx.com' },
    update: {},
    create: {
      name: 'Sarah Chen',
      email: 'sarah@horizon3dx.com',
      password: podPassword,
      role: Role.POD_LEAD,
    },
  })

  const podLead2 = await prisma.user.upsert({
    where: { email: 'marcus@horizon3dx.com' },
    update: {},
    create: {
      name: 'Marcus Rivera',
      email: 'marcus@horizon3dx.com',
      password: podPassword,
      role: Role.POD_LEAD,
    },
  })

  const clientUser1 = await prisma.user.upsert({
    where: { email: 'james@techvision.com' },
    update: {},
    create: {
      name: 'James Mitchell',
      email: 'james@techvision.com',
      password: clientPassword,
      role: Role.CLIENT,
    },
  })

  const clientUser2 = await prisma.user.upsert({
    where: { email: 'lisa@greenleaf.com' },
    update: {},
    create: {
      name: 'Lisa Park',
      email: 'lisa@greenleaf.com',
      password: clientPassword,
      role: Role.CLIENT,
    },
  })

  const clientUser3 = await prisma.user.upsert({
    where: { email: 'david@nexaretail.com' },
    update: {},
    create: {
      name: 'David Thompson',
      email: 'david@nexaretail.com',
      password: clientPassword,
      role: Role.CLIENT,
    },
  })

  // Clients
  const client1 = await prisma.client.upsert({
    where: { email: 'james@techvision.com' },
    update: {},
    create: {
      name: 'James Mitchell',
      company: 'TechVision Inc.',
      email: 'james@techvision.com',
      phone: '+1 555-0101',
      industry: 'Technology',
      userId: clientUser1.id,
    },
  })

  const client2 = await prisma.client.upsert({
    where: { email: 'lisa@greenleaf.com' },
    update: {},
    create: {
      name: 'Lisa Park',
      company: 'GreenLeaf Organics',
      email: 'lisa@greenleaf.com',
      phone: '+1 555-0102',
      industry: 'Food & Beverage',
      userId: clientUser2.id,
    },
  })

  const client3 = await prisma.client.upsert({
    where: { email: 'david@nexaretail.com' },
    update: {},
    create: {
      name: 'David Thompson',
      company: 'NexaRetail',
      email: 'david@nexaretail.com',
      phone: '+1 555-0103',
      industry: 'Retail',
      userId: clientUser3.id,
    },
  })

  // Project 1 – TechVision: CRM Implementation (In Progress)
  const p1Start = new Date('2026-01-15')
  const project1 = await prisma.project.upsert({
    where: { id: 'proj-techvision-crm' },
    update: {},
    create: {
      id: 'proj-techvision-crm',
      name: 'CRM Platform Implementation',
      description: 'Full implementation of Salesforce CRM including data migration, custom workflows, and team training.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      progress: 45,
      startDate: p1Start,
      targetEndDate: addDays(p1Start, 90),
      clientId: client1.id,
      podLeadId: podLead1.id,
      notes: 'Client has been very responsive. Data migration is the biggest risk.',
    },
  })

  const p1Phases = [
    {
      id: 'ph-p1-diagnose', type: PhaseType.DIAGNOSE, name: 'Diagnose', order: 1,
      durationDays: 14, plannedStartDate: p1Start, plannedEndDate: addDays(p1Start, 14),
      actualStartDate: p1Start, actualEndDate: addDays(p1Start, 16),
      status: PhaseStatus.COMPLETE, progress: 100,
      deliverables: 'Current state assessment, Requirements document, Risk register',
      clientDependencies: 'Access to current CRM data, Stakeholder interviews',
      clientNotes: 'We completed a thorough review of your existing systems. Full report delivered.',
      internalNotes: 'Found 3 legacy integrations that need custom connectors.',
    },
    {
      id: 'ph-p1-design', type: PhaseType.DESIGN, name: 'Design', order: 2,
      durationDays: 21, plannedStartDate: addDays(p1Start, 14), plannedEndDate: addDays(p1Start, 35),
      actualStartDate: addDays(p1Start, 16), actualEndDate: null,
      status: PhaseStatus.IN_PROGRESS, progress: 70,
      deliverables: 'System architecture, Data model, Integration specifications, UI mockups',
      clientDependencies: 'Approval of system architecture, Confirmation of user roles',
      clientNotes: 'Architecture approved. Currently finalizing data migration plan.',
      internalNotes: 'Custom connector for legacy ERP is complex – flagged for extra QA.',
    },
    {
      id: 'ph-p1-deploy', type: PhaseType.DEPLOY, name: 'Deploy', order: 3,
      durationDays: 28, plannedStartDate: addDays(p1Start, 37), plannedEndDate: addDays(p1Start, 65),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
      deliverables: 'Configured CRM environment, Migrated data, Test results',
      clientDependencies: 'UAT sign-off, IT access credentials',
      clientNotes: 'We will set up your full CRM environment and migrate all data.',
      internalNotes: 'Schedule data migration on weekend to minimize disruption.',
    },
    {
      id: 'ph-p1-execute', type: PhaseType.EXECUTE, name: 'Execute', order: 4,
      durationDays: 25, plannedStartDate: addDays(p1Start, 65), plannedEndDate: addDays(p1Start, 90),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
      deliverables: 'Training sessions completed, Go-live, Hypercare support',
      clientDependencies: 'Team availability for training, Go-live approval',
      clientNotes: 'Training, go-live, and 2 weeks of hypercare support.',
      internalNotes: 'Prepare training materials by week 8.',
    },
  ]

  for (const phase of p1Phases) {
    await prisma.phase.upsert({
      where: { id: phase.id },
      update: {},
      create: { ...phase, projectId: project1.id },
    })
  }

  // Tasks for Diagnose phase
  const diagnoseTasks = [
    { title: 'Stakeholder interviews', completed: true, order: 1 },
    { title: 'Document current workflows', completed: true, order: 2 },
    { title: 'Data audit and assessment', completed: true, order: 3 },
    { title: 'Risk identification', completed: true, order: 4 },
    { title: 'Requirements sign-off', completed: true, order: 5 },
  ]
  for (const task of diagnoseTasks) {
    await prisma.task.create({ data: { ...task, phaseId: 'ph-p1-diagnose' } }).catch(() => {})
  }

  const designTasks = [
    { title: 'System architecture design', completed: true, order: 1 },
    { title: 'Data model definition', completed: true, order: 2 },
    { title: 'Integration specifications', completed: true, order: 3 },
    { title: 'Legacy connector design', completed: false, order: 4 },
    { title: 'Client architecture approval', completed: false, order: 5 },
  ]
  for (const task of designTasks) {
    await prisma.task.create({ data: { ...task, phaseId: 'ph-p1-design' } }).catch(() => {})
  }

  // Change Request
  await prisma.changeRequest.create({
    data: {
      title: 'Diagnose Phase Extended',
      description: 'Additional stakeholder interviews required due to newly identified legacy systems',
      reason: 'Three undocumented legacy integrations discovered during initial assessment',
      daysAdded: 2,
      dateOfChange: addDays(p1Start, 14),
      newProjectedCompletion: addDays(p1Start, 92),
      projectId: project1.id,
      createdById: podLead1.id,
      impactedPhases: { connect: [{ id: 'ph-p1-design' }, { id: 'ph-p1-deploy' }, { id: 'ph-p1-execute' }] },
    },
  }).catch(() => {})

  // Comments
  await prisma.comment.createMany({
    data: [
      { content: 'Diagnose phase complete. Great collaboration from the TechVision team!', isInternal: false, projectId: project1.id, authorId: podLead1.id },
      { content: 'Legacy ERP connector needs extra testing - allocate additional QA time', isInternal: true, projectId: project1.id, authorId: podLead1.id },
      { content: 'Architecture design approved and signed off.', isInternal: false, projectId: project1.id, authorId: admin.id },
    ],
    skipDuplicates: true,
  })

  // Project 2 – GreenLeaf: E-Commerce (Active, early stage)
  const p2Start = new Date('2026-02-01')
  const project2 = await prisma.project.upsert({
    where: { id: 'proj-greenleaf-ecom' },
    update: {},
    create: {
      id: 'proj-greenleaf-ecom',
      name: 'E-Commerce Platform Launch',
      description: 'Build and launch a Shopify-based e-commerce store with custom integrations for inventory and fulfilment.',
      status: ProjectStatus.ACTIVE,
      priority: Priority.CRITICAL,
      progress: 20,
      startDate: p2Start,
      targetEndDate: addDays(p2Start, 75),
      clientId: client2.id,
      podLeadId: podLead2.id,
    },
  })

  const p2Phases = [
    {
      id: 'ph-p2-diagnose', type: PhaseType.DIAGNOSE, name: 'Diagnose', order: 1,
      durationDays: 10, plannedStartDate: p2Start, plannedEndDate: addDays(p2Start, 10),
      actualStartDate: p2Start, actualEndDate: addDays(p2Start, 10),
      status: PhaseStatus.COMPLETE, progress: 100,
      deliverables: 'Product catalog audit, Competitor analysis, Technical requirements',
      clientDependencies: 'Product catalog export, Brand guidelines',
      clientNotes: 'Discovery complete. Full brief delivered on Feb 11.',
    },
    {
      id: 'ph-p2-design', type: PhaseType.DESIGN, name: 'Design', order: 2,
      durationDays: 14, plannedStartDate: addDays(p2Start, 10), plannedEndDate: addDays(p2Start, 24),
      actualStartDate: addDays(p2Start, 10), actualEndDate: null,
      status: PhaseStatus.IN_PROGRESS, progress: 40,
      deliverables: 'Store theme, UI designs, Integration specs',
      clientDependencies: 'Brand asset approval, Product imagery',
      clientNotes: 'Store design underway. Awaiting final product images.',
    },
    {
      id: 'ph-p2-deploy', type: PhaseType.DEPLOY, name: 'Deploy', order: 3,
      durationDays: 28, plannedStartDate: addDays(p2Start, 24), plannedEndDate: addDays(p2Start, 52),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
      deliverables: 'Staging store, Integrations, UAT',
      clientDependencies: 'Product data, Pricing approval',
      clientNotes: 'We will build and test your full store before launch.',
    },
    {
      id: 'ph-p2-execute', type: PhaseType.EXECUTE, name: 'Execute', order: 4,
      durationDays: 23, plannedStartDate: addDays(p2Start, 52), plannedEndDate: addDays(p2Start, 75),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
      deliverables: 'Live store, Staff training, Launch support',
      clientDependencies: 'Go-live approval, Team training dates',
      clientNotes: 'Launch and 3-week post-launch monitoring included.',
    },
  ]

  for (const phase of p2Phases) {
    await prisma.phase.upsert({
      where: { id: phase.id },
      update: {},
      create: { ...phase, projectId: project2.id },
    })
  }

  // Project 3 – NexaRetail: BI Dashboard (Completed)
  const p3Start = new Date('2025-09-01')
  const project3 = await prisma.project.upsert({
    where: { id: 'proj-nexaretail-bi' },
    update: {},
    create: {
      id: 'proj-nexaretail-bi',
      name: 'Business Intelligence Dashboard',
      description: 'Custom BI dashboard integrating POS, inventory, and HR data for real-time executive reporting.',
      status: ProjectStatus.COMPLETED,
      priority: Priority.HIGH,
      progress: 100,
      startDate: p3Start,
      targetEndDate: addDays(p3Start, 80),
      actualEndDate: addDays(p3Start, 83),
      completedAt: addDays(p3Start, 83),
      clientId: client3.id,
      podLeadId: podLead1.id,
    },
  })

  const p3Phases = [
    {
      id: 'ph-p3-diagnose', type: PhaseType.DIAGNOSE, name: 'Diagnose', order: 1,
      durationDays: 14, plannedStartDate: p3Start, plannedEndDate: addDays(p3Start, 14),
      actualStartDate: p3Start, actualEndDate: addDays(p3Start, 14),
      status: PhaseStatus.COMPLETE, progress: 100,
    },
    {
      id: 'ph-p3-design', type: PhaseType.DESIGN, name: 'Design', order: 2,
      durationDays: 18, plannedStartDate: addDays(p3Start, 14), plannedEndDate: addDays(p3Start, 32),
      actualStartDate: addDays(p3Start, 14), actualEndDate: addDays(p3Start, 32),
      status: PhaseStatus.COMPLETE, progress: 100,
    },
    {
      id: 'ph-p3-deploy', type: PhaseType.DEPLOY, name: 'Deploy', order: 3,
      durationDays: 30, plannedStartDate: addDays(p3Start, 32), plannedEndDate: addDays(p3Start, 62),
      actualStartDate: addDays(p3Start, 32), actualEndDate: addDays(p3Start, 65),
      status: PhaseStatus.COMPLETE, progress: 100,
    },
    {
      id: 'ph-p3-execute', type: PhaseType.EXECUTE, name: 'Execute', order: 4,
      durationDays: 18, plannedStartDate: addDays(p3Start, 62), plannedEndDate: addDays(p3Start, 80),
      actualStartDate: addDays(p3Start, 65), actualEndDate: addDays(p3Start, 83),
      status: PhaseStatus.COMPLETE, progress: 100,
    },
  ]

  for (const phase of p3Phases) {
    await prisma.phase.upsert({
      where: { id: phase.id },
      update: {},
      create: { ...phase, projectId: project3.id },
    })
  }

  // Project 4 – NexaRetail: Mobile App (Active, at risk)
  const p4Start = new Date('2026-02-15')
  const project4 = await prisma.project.upsert({
    where: { id: 'proj-nexaretail-app' },
    update: {},
    create: {
      id: 'proj-nexaretail-app',
      name: 'Customer Loyalty Mobile App',
      description: 'React Native mobile app for NexaRetail loyalty program with points, rewards, and push notifications.',
      status: ProjectStatus.AT_RISK,
      priority: Priority.HIGH,
      progress: 30,
      startDate: p4Start,
      targetEndDate: addDays(p4Start, 100),
      clientId: client3.id,
      podLeadId: podLead2.id,
    },
  })

  const p4Phases = [
    {
      id: 'ph-p4-diagnose', type: PhaseType.DIAGNOSE, name: 'Diagnose', order: 1,
      durationDays: 14, plannedStartDate: p4Start, plannedEndDate: addDays(p4Start, 14),
      actualStartDate: p4Start, actualEndDate: addDays(p4Start, 18),
      status: PhaseStatus.COMPLETE, progress: 100,
    },
    {
      id: 'ph-p4-design', type: PhaseType.DESIGN, name: 'Design', order: 2,
      durationDays: 21, plannedStartDate: addDays(p4Start, 14), plannedEndDate: addDays(p4Start, 35),
      actualStartDate: addDays(p4Start, 18), actualEndDate: null,
      status: PhaseStatus.BLOCKED, progress: 50,
      clientDependencies: 'Brand guidelines approval OVERDUE – blocking design completion',
      clientNotes: 'We need your updated brand guidelines to proceed. This is currently blocking progress.',
      internalNotes: 'Client brand guidelines update delayed. Escalated to David Thompson.',
    },
    {
      id: 'ph-p4-deploy', type: PhaseType.DEPLOY, name: 'Deploy', order: 3,
      durationDays: 35, plannedStartDate: addDays(p4Start, 39), plannedEndDate: addDays(p4Start, 74),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
    },
    {
      id: 'ph-p4-execute', type: PhaseType.EXECUTE, name: 'Execute', order: 4,
      durationDays: 26, plannedStartDate: addDays(p4Start, 74), plannedEndDate: addDays(p4Start, 100),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
    },
  ]

  for (const phase of p4Phases) {
    await prisma.phase.upsert({
      where: { id: phase.id },
      update: {},
      create: { ...phase, projectId: project4.id },
    })
  }

  await prisma.changeRequest.create({
    data: {
      title: 'Design Phase Blocked – Brand Guidelines Delayed',
      description: 'Client has not provided updated brand guidelines required to complete app design.',
      reason: 'Client internal brand refresh delayed by external agency',
      daysAdded: 4,
      dateOfChange: addDays(p4Start, 35),
      newProjectedCompletion: addDays(p4Start, 104),
      projectId: project4.id,
      createdById: podLead2.id,
      impactedPhases: { connect: [{ id: 'ph-p4-design' }, { id: 'ph-p4-deploy' }, { id: 'ph-p4-execute' }] },
    },
  }).catch(() => {})

  // Project 5 – TechVision: Security Audit (On Hold)
  const p5Start = new Date('2026-03-01')
  const project5 = await prisma.project.upsert({
    where: { id: 'proj-techvision-sec' },
    update: {},
    create: {
      id: 'proj-techvision-sec',
      name: 'Security & Compliance Audit',
      description: 'SOC 2 readiness assessment and remediation roadmap for TechVision cloud infrastructure.',
      status: ProjectStatus.ON_HOLD,
      priority: Priority.MEDIUM,
      progress: 10,
      startDate: p5Start,
      targetEndDate: addDays(p5Start, 60),
      clientId: client1.id,
      podLeadId: podLead1.id,
      notes: 'On hold pending client budget approval for Q2.',
    },
  })

  const p5Phases = [
    {
      id: 'ph-p5-diagnose', type: PhaseType.DIAGNOSE, name: 'Diagnose', order: 1,
      durationDays: 14, plannedStartDate: p5Start, plannedEndDate: addDays(p5Start, 14),
      actualStartDate: p5Start, actualEndDate: null,
      status: PhaseStatus.IN_PROGRESS, progress: 40,
    },
    {
      id: 'ph-p5-design', type: PhaseType.DESIGN, name: 'Design', order: 2,
      durationDays: 14, plannedStartDate: addDays(p5Start, 14), plannedEndDate: addDays(p5Start, 28),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
    },
    {
      id: 'ph-p5-deploy', type: PhaseType.DEPLOY, name: 'Deploy', order: 3,
      durationDays: 20, plannedStartDate: addDays(p5Start, 28), plannedEndDate: addDays(p5Start, 48),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
    },
    {
      id: 'ph-p5-execute', type: PhaseType.EXECUTE, name: 'Execute', order: 4,
      durationDays: 12, plannedStartDate: addDays(p5Start, 48), plannedEndDate: addDays(p5Start, 60),
      actualStartDate: null, actualEndDate: null,
      status: PhaseStatus.NOT_STARTED, progress: 0,
    },
  ]

  for (const phase of p5Phases) {
    await prisma.phase.upsert({
      where: { id: phase.id },
      update: {},
      create: { ...phase, projectId: project5.id },
    })
  }

  console.log('✅ Seed complete!')
  console.log('\n📧 Login credentials:')
  console.log('  Admin:    admin@horizon3dx.com / admin123')
  console.log('  Pod Lead: sarah@horizon3dx.com / pod123')
  console.log('  Pod Lead: marcus@horizon3dx.com / pod123')
  console.log('  Client:   james@techvision.com / client123 (TechVision – 2 projects)')
  console.log('  Client:   lisa@greenleaf.com / client123 (GreenLeaf – 1 project)')
  console.log('  Client:   david@nexaretail.com / client123 (NexaRetail – 2 projects)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
