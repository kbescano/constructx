/**
 * Populates a fresh ConstructX database with realistic demo data: staff
 * accounts, a product catalog, clients, suppliers, and a set of quotation
 * requests / client quotations / orders spread across every pipeline stage
 * -- so a first-time visitor lands on a dashboard and reports that already
 * have something to explore, instead of an empty shell.
 *
 * Safe to re-run: every section checks for existing records first and
 * skips what's already there.
 *
 * Run with: npx tsx scripts/seed.ts
 * (or: npm install -D tsx first, if not already present)
 */
// Unlike `npm run dev`, a plain script run doesn't go through Next.js's own
// .env loading -- load it explicitly, before anything reads process.env.
import 'dotenv/config'
import { getPayload, type Payload } from 'payload'
import config from '../src/payload.config'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function upsertUser(
  payload: Payload,
  data: { email: string; password: string; name: string; role: 'admin' | 'marketing' | 'user' },
) {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: data.email } }, limit: 1 })
  if (existing.docs.length > 0) {
    console.log(`  skip (exists): ${data.email}`)
    return existing.docs[0]
  }
  const user = await payload.create({ collection: 'users', data })
  console.log(`  created user: ${data.email} / ${data.password} (${data.role})`)
  return user
}

async function upsertByField<T extends Record<string, any>>(
  payload: Payload,
  collection: string,
  matchField: string,
  data: T,
) {
  const existing = await payload.find({ collection: collection as any, where: { [matchField]: { equals: data[matchField] } }, limit: 1 })
  if (existing.docs.length > 0) return existing.docs[0]
  return payload.create({ collection: collection as any, data })
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const PRODUCTS: Array<{ name: string; category: string; unit: string; description?: string; featured?: boolean }> = [
  { name: 'Hex Bolt 12mm x 100mm (Grade 8.8)', category: 'bolts-fasteners', unit: 'piece' },
  { name: 'Anchor Bolt 16mm x 200mm', category: 'bolts-fasteners', unit: 'piece' },
  { name: 'Flat Washer 12mm', category: 'bolts-fasteners', unit: 'piece' },
  { name: 'Mild Steel Plate 10mm x 4ft x 8ft', category: 'steel-plates', unit: 'piece', featured: true },
  { name: 'Checkered Steel Plate 6mm', category: 'steel-plates', unit: 'sqm' },
  { name: 'Sheet Pile Type II 400mm', category: 'sheet-pile', unit: 'piece' },
  { name: 'Deformed Bar 16mm x 6m (Grade 40)', category: 'steel-bars', unit: 'length', featured: true },
  { name: 'Deformed Bar 20mm x 6m (Grade 40)', category: 'steel-bars', unit: 'length' },
  { name: 'Round Bar 25mm x 6m', category: 'steel-bars', unit: 'length' },
  { name: 'Square Tube 50mm x 50mm x 3mm', category: 'steel-bars', unit: 'length' },
  { name: 'W-Beam 200mm x 100mm x 6m', category: 'beams', unit: 'piece', featured: true },
  { name: 'I-Beam 150mm x 75mm x 6m', category: 'beams', unit: 'piece' },
  { name: 'Black Iron Pipe 2" Sch 40', category: 'black-iron', unit: 'length' },
  { name: 'Black Iron Elbow 90° 2"', category: 'black-iron', unit: 'piece' },
  { name: 'GI Pipe 3" Sch 40', category: 'galvanized-iron', unit: 'length' },
  { name: 'GI Sheet 0.6mm Plain', category: 'galvanized-iron', unit: 'sqm' },
  { name: 'Copper Pipe 1/2" Type L', category: 'copper', unit: 'length' },
  { name: 'Stainless Sheet 304 1.2mm', category: 'stainless', unit: 'sqm' },
  { name: 'PE Flange 4" Class 150', category: 'pipe-fittings', unit: 'piece' },
  { name: 'Gate Valve 2"', category: 'pipe-fittings', unit: 'piece' },
  { name: 'Chain Link Fence 6ft x 50m (Gauge 12)', category: 'fence-wire', unit: 'set' },
  { name: 'Barbed Wire 500m Roll', category: 'fence-wire', unit: 'piece' },
  { name: 'Safety Helmet (Hard Hat)', category: 'ppe', unit: 'piece' },
  { name: 'Safety Shoes Steel Toe', category: 'ppe', unit: 'piece' },
  { name: 'THHN Wire 3.5mm² (150m Roll)', category: 'electrical-cabling', unit: 'piece' },
]

const CLIENTS = [
  { name: 'Ramon Villareal', company: 'Villareal Construction & Development', phone: '0917-234-5601', email: 'ramon@villarealconstruction.ph', address: 'Km 14 Sumulong Hwy, Antipolo City' },
  { name: 'Grace Tolentino', company: 'GT Builders Corp.', phone: '0917-234-5602', email: 'grace@gtbuilders.ph', address: 'Ortigas Ave Ext, Cainta, Rizal' },
  { name: 'Marlon Reyes', company: 'Reyes & Sons Fabrication', phone: '0917-234-5603', email: 'marlon@reyesfab.ph', address: 'Governor’s Dr, Gen. Trias, Cavite' },
  { name: 'Bianca Uy', company: 'Uy Industrial Supply', phone: '0917-234-5604', email: 'bianca@uyindustrial.ph', address: 'MacArthur Hwy, San Fernando, Pampanga' },
  { name: 'Ferdie Alcantara', company: 'Alcantara Realty & Builders', phone: '0917-234-5605', email: 'ferdie@alcantararealty.ph', address: 'National Hwy, Sta. Rosa, Laguna' },
]

const SUPPLIERS = [
  { name: 'Rico Manalo', company: 'Manalo Steel Distribution', phone: '0917-345-6701', email: 'rico@manalosteel.ph', address: 'Valenzuela Steel Complex, Valenzuela City' },
  { name: 'Cristina Lim', company: 'Lim Hardware & Trading', phone: '0917-345-6702', email: 'cristina@limhardware.ph', address: 'Banawe St, Quezon City' },
  { name: 'Danilo Castro', company: 'Castro Pipe & Fittings Corp.', phone: '0917-345-6703', email: 'danilo@castropipe.ph', address: 'North Luzon Expwy Access Rd, Marilao, Bulacan' },
]

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seed() {
  const payload = await getPayload({ config })

  console.log('1/7 Staff accounts...')
  const admin = await upsertUser(payload, { email: 'admin@constructx.demo', password: 'Demo1234!', name: 'Admin', role: 'admin' })
  await upsertUser(payload, { email: 'marketing@constructx.demo', password: 'Demo1234!', name: 'Marketing', role: 'marketing' })
  const staffJuan = await upsertUser(payload, { email: 'juan@constructx.demo', password: 'Demo1234!', name: 'Juan Dela Cruz', role: 'user' })
  const staffMaria = await upsertUser(payload, { email: 'maria@constructx.demo', password: 'Demo1234!', name: 'Maria Santos', role: 'user' })

  console.log('2/7 Product catalog...')
  const productIds: Record<string, string> = {}
  for (const p of PRODUCTS) {
    const existing = await payload.find({ collection: 'products', where: { name: { equals: p.name } }, limit: 1 })
    if (existing.docs.length > 0) {
      productIds[p.name] = String(existing.docs[0].id)
      continue
    }
    const created = await payload.create({
      collection: 'products',
      data: { ...p, inStock: true, featured: p.featured ?? false },
    })
    productIds[p.name] = String(created.id)
  }
  console.log(`  ${Object.keys(productIds).length} products ready`)

  console.log('3/7 Clients...')
  for (const c of CLIENTS) await upsertByField(payload, 'clients', 'email', c)

  console.log('4/7 Suppliers...')
  for (const s of SUPPLIERS) await upsertByField(payload, 'suppliers', 'email', s)

  console.log('5/7 Quotation requests (pipeline inbox)...')
  const existingRFQs = await payload.find({ collection: 'quotation-requests', limit: 1 })
  const rfqs: any[] = []
  if (existingRFQs.totalDocs > 0) {
    console.log('  skip (quotation-requests already seeded)')
  } else {
    const rfqSeeds = [
      { customerName: 'Ramon Villareal', phone: '0917-234-5601', email: 'ramon@villarealconstruction.ph', projectType: 'commercial', source: 'facebook', status: 'pending', assignedTo: staffJuan.id, items: [{ material: productIds['W-Beam 200mm x 100mm x 6m'], quantity: 12 }, { material: productIds['Hex Bolt 12mm x 100mm (Grade 8.8)'], quantity: 200 }], message: 'For a 2-storey warehouse extension, need pricing and lead time.' },
      { customerName: 'Grace Tolentino', phone: '0917-234-5602', email: 'grace@gtbuilders.ph', projectType: 'residential', source: 'website', status: 'pending', assignedTo: staffMaria.id, items: [{ material: productIds['Deformed Bar 16mm x 6m (Grade 40)'], quantity: 150 }], message: 'Rebar for a 3-storey townhouse project.' },
      { customerName: 'Marlon Reyes', phone: '0917-234-5603', email: 'marlon@reyesfab.ph', projectType: 'other', source: 'existingClient', status: 'processing', assignedTo: staffJuan.id, items: [{ material: productIds['Mild Steel Plate 10mm x 4ft x 8ft'], quantity: 20 }, { material: productIds['Checkered Steel Plate 6mm'], quantity: 15 }], message: 'Repeat order, same specs as last quarter.' },
      { customerName: 'Bianca Uy', phone: '0917-234-5604', email: 'bianca@uyindustrial.ph', projectType: 'commercial', source: 'viber', status: 'processing', assignedTo: staffMaria.id, items: [{ material: productIds['GI Pipe 3" Sch 40'], quantity: 80 }, { material: productIds['GI Sheet 0.6mm Plain'], quantity: 40 }], message: 'Quoting for a client -- need best price on volume.' },
      { customerName: 'Ferdie Alcantara', phone: '0917-234-5605', email: 'ferdie@alcantararealty.ph', projectType: 'residential', source: 'google', status: 'informal-quote', assignedTo: staffJuan.id, items: [{ material: productIds['Chain Link Fence 6ft x 50m (Gauge 12)'], quantity: 6 }], message: 'Perimeter fencing for a subdivision phase.' },
      { customerName: 'Nathaniel Ong', phone: '0917-234-5606', email: 'nathaniel@ongtrading.ph', projectType: 'commercial', source: 'callText', status: 'quote-sent', assignedTo: staffMaria.id, items: [{ material: productIds['Deformed Bar 20mm x 6m (Grade 40)'], quantity: 300 }, { material: productIds['Round Bar 25mm x 6m'], quantity: 60 }], message: 'Formal quote requested for a 5-storey commercial building.' },
      { customerName: 'Precious Domingo', phone: '0917-234-5607', email: 'precious@domingobuilders.ph', projectType: 'renovation', source: 'facebook', status: 'completed', assignedTo: staffJuan.id, items: [{ material: productIds['Safety Helmet (Hard Hat)'], quantity: 30 }, { material: productIds['Safety Shoes Steel Toe'], quantity: 30 }], message: 'PPE restock for the crew.' },
      { customerName: 'Edgardo Mercado', phone: '0917-234-5608', email: 'edgardo@mercadodev.ph', projectType: 'commercial', source: 'marketPlace', status: 'rejected', assignedTo: staffMaria.id, items: [{ material: productIds['Stainless Sheet 304 1.2mm'], quantity: 25 }], message: 'Went with another supplier on lead time.' },
    ]
    for (const r of rfqSeeds) {
      const { items, ...rest } = r as any
      const created = await payload.create({
        collection: 'quotation-requests',
        data: { ...rest, items: items.map((i: any) => ({ material: i.material, quantity: i.quantity })) },
      })
      rfqs.push(created)
    }
    console.log(`  created ${rfqs.length} quotation requests`)
  }

  console.log('6/7 Client quotations (some converting to orders)...')
  const existingQuotes = await payload.find({ collection: 'client-quotations', limit: 1 })
  if (existingQuotes.totalDocs > 0) {
    console.log('  skip (client-quotations already seeded)')
  } else {
    const rfqByName = (name: string) => rfqs.find((r) => r.customerName === name)

    // Draft -- still being put together
    await payload.create({
      collection: 'client-quotations',
      data: {
        quotationDate: daysAgo(2),
        customerName: 'Bianca Uy', company: 'Uy Industrial Supply', address: 'MacArthur Hwy, San Fernando, Pampanga', contactNumber: '0917-234-5604',
        salesPerson: 'Maria Santos',
        sourceRequestId: String(rfqByName('Bianca Uy')?.id || ''),
        items: [
          { qty: 80, unit: 'length', description: 'GI Pipe 3" Sch 40', unitCost: 620, marginAmount: 130, unitPrice: 750 },
          { qty: 40, unit: 'sqm', description: 'GI Sheet 0.6mm Plain', unitCost: 410, marginAmount: 90, unitPrice: 500 },
        ],
        status: 'draft',
      },
    })

    // Pending approval
    await payload.create({
      collection: 'client-quotations',
      data: {
        quotationDate: daysAgo(5),
        customerName: 'Nathaniel Ong', company: 'Ong Trading', address: 'Quirino Hwy, Novaliches, QC', contactNumber: '0917-234-5606',
        salesPerson: 'Maria Santos',
        sourceRequestId: String(rfqByName('Nathaniel Ong')?.id || ''),
        items: [
          { qty: 300, unit: 'length', description: 'Deformed Bar 20mm x 6m (Grade 40)', unitCost: 980, marginAmount: 170, unitPrice: 1150 },
          { qty: 60, unit: 'length', description: 'Round Bar 25mm x 6m', unitCost: 1450, marginAmount: 250, unitPrice: 1700 },
        ],
        status: 'pending_approval',
      },
    })

    // Approved, not yet converted
    await payload.create({
      collection: 'client-quotations',
      data: {
        quotationDate: daysAgo(9),
        customerName: 'Ferdie Alcantara', company: 'Alcantara Realty & Builders', address: 'National Hwy, Sta. Rosa, Laguna', contactNumber: '0917-234-5605',
        salesPerson: 'Juan Dela Cruz',
        sourceRequestId: String(rfqByName('Ferdie Alcantara')?.id || ''),
        items: [
          { qty: 6, unit: 'set', description: 'Chain Link Fence 6ft x 50m (Gauge 12)', unitCost: 8200, marginAmount: 1300, unitPrice: 9500 },
        ],
        status: 'quotation_approved',
      },
    })

    // Order Confirmed #1 -- will fully progress through fulfillment below
    const quote1 = await payload.create({
      collection: 'client-quotations',
      data: {
        quotationDate: daysAgo(38),
        customerName: 'Ramon Villareal', company: 'Villareal Construction & Development', address: 'Km 14 Sumulong Hwy, Antipolo City', contactNumber: '0917-234-5601',
        salesPerson: 'Juan Dela Cruz',
        sourceRequestId: String(rfqByName('Ramon Villareal')?.id || ''),
        items: [
          { qty: 12, unit: 'piece', description: 'W-Beam 200mm x 100mm x 6m', unitCost: 9800, marginAmount: 1700, unitPrice: 11500 },
          { qty: 200, unit: 'piece', description: 'Hex Bolt 12mm x 100mm (Grade 8.8)', unitCost: 38, marginAmount: 12, unitPrice: 50 },
        ],
        deliveryFee: 3500,
        status: 'draft',
      },
    })
    await payload.update({ collection: 'client-quotations', id: quote1.id, data: { status: 'pending_approval' } })
    await payload.update({ collection: 'client-quotations', id: quote1.id, data: { status: 'quotation_approved' } })
    await payload.update({ collection: 'client-quotations', id: quote1.id, data: { status: 'order_confirmed' } })

    // Order Confirmed #2 -- will progress partway (shipped, partial payment)
    const quote2 = await payload.create({
      collection: 'client-quotations',
      data: {
        quotationDate: daysAgo(12),
        customerName: 'Grace Tolentino', company: 'GT Builders Corp.', address: 'Ortigas Ave Ext, Cainta, Rizal', contactNumber: '0917-234-5602',
        salesPerson: 'Maria Santos',
        sourceRequestId: String(rfqByName('Grace Tolentino')?.id || ''),
        items: [
          { qty: 150, unit: 'length', description: 'Deformed Bar 16mm x 6m (Grade 40)', unitCost: 720, marginAmount: 130, unitPrice: 850 },
        ],
        deliveryFee: 2000,
        status: 'draft',
      },
    })
    await payload.update({ collection: 'client-quotations', id: quote2.id, data: { status: 'pending_approval' } })
    await payload.update({ collection: 'client-quotations', id: quote2.id, data: { status: 'quotation_approved' } })
    await payload.update({ collection: 'client-quotations', id: quote2.id, data: { status: 'order_confirmed' } })

    console.log('  created 5 client quotations (2 converted to orders)')
  }

  console.log('7/7 Progressing orders + supplier POs...')
  const orders = await payload.find({ collection: 'orders', limit: 20 })
  if (orders.docs.length === 0) {
    console.log('  skip (no orders yet)')
  } else {
    const orderA: any = orders.docs.find((o: any) => o.customerName === 'Ramon Villareal')
    const orderB: any = orders.docs.find((o: any) => o.customerName === 'Grace Tolentino')

    if (orderA && orderA.fulfillmentStatus !== 'delivered') {
      await payload.update({
        collection: 'orders',
        id: orderA.id,
        data: {
          orderDate: daysAgo(38),
          targetDeliveryDate: daysAgo(25),
          paymentStatus: 'paid',
          paymentMethod: 'bank_transfer',
          fulfillmentStatus: 'delivered',
          opex: [
            { description: 'Delivery truck rental', amount: 2500, expenseDate: daysAgo(28), status: 'liquidated' },
            { description: 'Loading crew (2 days)', amount: 1800, expenseDate: daysAgo(27), status: 'liquidated' },
          ],
        },
      })
      const po = await payload.create({
        collection: 'supplier-purchase-orders',
        data: {
          poDate: daysAgo(35),
          project: 'Villareal Warehouse Extension',
          supplierName: 'Rico Manalo', supplierCompany: 'Manalo Steel Distribution', supplierPhone: '0917-345-6701',
          sourceOrderId: String(orderA.id),
          preparedBy: 'Juan Dela Cruz',
          items: [
            { description: 'W-Beam 200mm x 100mm x 6m', qty: 12, unit: 'piece', unitPrice: 9800 },
            { description: 'Hex Bolt 12mm x 100mm (Grade 8.8)', qty: 200, unit: 'piece', unitPrice: 38 },
          ],
          status: 'fulfilled',
        },
      })
      console.log(`  order ${orderA.orderNumber}: delivered + paid, PO ${po.poNumber}`)
    }

    if (orderB && orderB.fulfillmentStatus !== 'shipped' && orderB.fulfillmentStatus !== 'delivered') {
      await payload.update({
        collection: 'orders',
        id: orderB.id,
        data: {
          orderDate: daysAgo(12),
          targetDeliveryDate: daysAgo(2),
          paymentStatus: 'partial',
          amountPaid: 60000,
          paymentMethod: 'cash',
          fulfillmentStatus: 'shipped',
          opex: [
            { description: 'Delivery fuel & toll', amount: 1200, expenseDate: daysAgo(4), status: 'pending' },
          ],
        },
      })
      const po = await payload.create({
        collection: 'supplier-purchase-orders',
        data: {
          poDate: daysAgo(10),
          project: 'GT Builders Townhouse Phase 2',
          supplierName: 'Cristina Lim', supplierCompany: 'Lim Hardware & Trading', supplierPhone: '0917-345-6702',
          sourceOrderId: String(orderB.id),
          preparedBy: 'Maria Santos',
          items: [
            { description: 'Deformed Bar 16mm x 6m (Grade 40)', qty: 150, unit: 'length', unitPrice: 720 },
          ],
          status: 'issued',
        },
      })
      console.log(`  order ${orderB.orderNumber}: shipped + partial payment, PO ${po.poNumber}`)
    }
  }

  console.log('\nSeed complete.')
  console.log('Log in at /admin-login with any of:')
  console.log('  admin@constructx.demo / Demo1234!   (Super Admin)')
  console.log('  marketing@constructx.demo / Demo1234!   (Marketing)')
  console.log('  juan@constructx.demo / Demo1234!   (Sales staff)')
  console.log('  maria@constructx.demo / Demo1234!   (Sales staff)')
  console.log('CHANGE THESE PASSWORDS before sharing the link publicly.')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
