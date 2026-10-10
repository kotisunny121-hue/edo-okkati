import bcrypt from 'bcryptjs';
import { User } from './models/User.js';
import { Organization } from './models/Organization.js';
import { Resource } from './models/Resource.js';
import { ResourceRequest } from './models/ResourceRequest.js';
import { InventoryTransaction } from './models/InventoryTransaction.js';
import { VolunteerAssignment } from './models/VolunteerAssignment.js';
import { Notification } from './models/Notification.js';
import { AuditLog } from './models/AuditLog.js';

export async function seedDatabase(): Promise<void> {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('Database already contains records. Skipping seed.');
    return;
  }

  console.log('Seeding initial emergency database records...');

  const defaultPassword = 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(defaultPassword, salt);

  // 1. Create Users for every role
  const superAdmin = await User.create({
    name: 'Chief Relief Director',
    email: 'superadmin@emergency.relief',
    passwordHash,
    phone: '+1 (555) 019-9000',
    role: 'super_admin',
    status: 'active',
  });

  const admin = await User.create({
    name: 'Sarah Connor (Relief Ops)',
    email: 'admin@emergency.relief',
    passwordHash,
    phone: '+1 (555) 019-9001',
    role: 'admin',
    status: 'active',
  });

  const provider = await User.create({
    name: 'Marcus Vance (Apex Logistics)',
    email: 'provider@emergency.relief',
    passwordHash,
    phone: '+1 (555) 019-9002',
    role: 'provider',
    status: 'active',
  });

  const seeker = await User.create({
    name: 'Elena Rostova (District 4 Seeker)',
    email: 'seeker@emergency.relief',
    passwordHash,
    phone: '+1 (555) 019-9003',
    role: 'seeker',
    status: 'active',
  });

  const volunteer = await User.create({
    name: 'David Kim (Rapid Response Dispatch)',
    email: 'volunteer@emergency.relief',
    passwordHash,
    phone: '+1 (555) 019-9004',
    role: 'volunteer',
    status: 'active',
  });

  const ngoUser = await User.create({
    name: 'Dr. Anita Roy (Hope Coalition)',
    email: 'ngo@redcross-relief.org',
    passwordHash,
    phone: '+1 (555) 019-9005',
    role: 'organization',
    status: 'active',
  });

  // 2. Create Organizations
  const hopeOrg = await Organization.create({
    name: 'Hope Disaster Relief Coalition',
    registrationNumber: 'NGO-USA-2024-9981',
    contactEmail: 'contact@hope-relief.org',
    contactPhone: '+1 (555) 019-4400',
    address: '742 Staging Depot Blvd, San Francisco, CA 94103',
    status: 'verified',
    verificationNotes: 'Official 501(c)(3) relief disaster organization certified by FEMA regional coordination.',
    createdBy: ngoUser._id,
    verifiedBy: admin._id,
    verifiedAt: new Date(),
  });

  ngoUser.organizationId = hopeOrg._id as any;
  await ngoUser.save();

  await Organization.create({
    name: 'Community Mutual Aid Taskforce',
    registrationNumber: 'CMA-PEND-4402',
    contactEmail: 'aid@mutualtaskforce.org',
    contactPhone: '+1 (555) 019-8811',
    address: '120 Market St, Oakland, CA 94607',
    status: 'pending',
    verificationNotes: 'Application submitted for regional emergency food distribution accreditation.',
    createdBy: provider._id,
  });

  // 3. Create Sample Emergency Resources
  const r1 = await Resource.create({
    title: 'Ready-to-Eat Emergency Food Rations (MRE)',
    category: 'food',
    description: 'High-calorie, nutrient-dense self-heating meal packs suitable for flood and hurricane displaced families. 3-year shelf life.',
    quantityAvailable: 650,
    quantityReserved: 50,
    unit: 'packets',
    condition: 'new',
    providerId: provider._id,
    locationName: 'Apex Central Logistics Depot',
    address: '101 Bayfront Expressway, San Francisco, CA',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    availabilityStatus: 'partially_available',
    moderationStatus: 'approved',
  });

  const r2 = await Resource.create({
    title: 'Purified Bottled Drinking Water (Pallet Stacks)',
    category: 'water',
    description: 'Sealed 1-gallon bottles of spring water certified free from contaminants. Essential for boil-water advisory zones.',
    quantityAvailable: 1200,
    quantityReserved: 0,
    unit: 'gallons',
    condition: 'new',
    providerId: ngoUser._id,
    organizationId: hopeOrg._id,
    locationName: 'Hope Coalition Relief Depot #1',
    address: '742 Staging Depot Blvd, San Francisco, CA',
    coordinates: { lat: 37.7833, lng: -122.4167 },
    availabilityStatus: 'available',
    moderationStatus: 'approved',
  });

  const r3 = await Resource.create({
    title: 'Comprehensive Trauma & First Aid Surgical Kits',
    category: 'first_aid',
    description: 'Includes sterile gauze, tourniquets, burn dressings, antiseptic washes, scissors, sutures, and splints for urgent triage.',
    quantityAvailable: 45,
    quantityReserved: 15,
    unit: 'kits',
    condition: 'new',
    providerId: ngoUser._id,
    organizationId: hopeOrg._id,
    locationName: 'Civic Triage Health Center',
    address: '350 McAllister St, San Francisco, CA',
    coordinates: { lat: 37.7808, lng: -122.4173 },
    availabilityStatus: 'partially_available',
    moderationStatus: 'approved',
  });

  const r4 = await Resource.create({
    title: 'Thermal Weatherproof Fleece Blankets',
    category: 'clothing',
    description: 'Heavy insulation wool-blend emergency blankets for cold night shelters and earthquake evacuees.',
    quantityAvailable: 300,
    quantityReserved: 0,
    unit: 'blankets',
    condition: 'new',
    providerId: provider._id,
    locationName: 'Apex South Warehouse',
    address: '1500 Mission St, San Francisco, CA',
    coordinates: { lat: 37.7725, lng: -122.418 },
    availabilityStatus: 'available',
    moderationStatus: 'approved',
  });

  const r5 = await Resource.create({
    title: 'Family Hygiene & Sanitation Packs',
    category: 'hygiene',
    description: 'Contains antibacterial soap, toothbrushes, toothpaste, wet wipes, menstrual hygiene items, and water purification tablets.',
    quantityAvailable: 180,
    quantityReserved: 20,
    unit: 'kits',
    condition: 'new',
    providerId: ngoUser._id,
    organizationId: hopeOrg._id,
    locationName: 'Mission Community Center Relief Post',
    address: '2450 Mission St, San Francisco, CA',
    coordinates: { lat: 37.7588, lng: -122.4191 },
    availabilityStatus: 'partially_available',
    moderationStatus: 'approved',
  });

  const r6 = await Resource.create({
    title: 'Heavy-Duty 8-Person Emergency Tents',
    category: 'shelter',
    description: 'All-weather, water-repellent canvas field tents with ground tarps and aluminum support frames.',
    quantityAvailable: 28,
    quantityReserved: 0,
    unit: 'tents',
    condition: 'new',
    providerId: provider._id,
    locationName: 'Marina Harbor Shelter Hub',
    address: 'Marina Blvd & Scott St, San Francisco, CA',
    coordinates: { lat: 37.8044, lng: -122.4382 },
    availabilityStatus: 'available',
    moderationStatus: 'approved',
  });

  const r7 = await Resource.create({
    title: 'High-Lumen Search & Rescue LED Headlamps',
    category: 'rescue',
    description: 'Rechargeable IPX6 waterproof tactical lights with strobe and emergency SOS signaling modes.',
    quantityAvailable: 85,
    quantityReserved: 0,
    unit: 'units',
    condition: 'new',
    providerId: provider._id,
    locationName: 'Presidio Equipment Depot',
    address: 'Presidio Blvd, San Francisco, CA',
    coordinates: { lat: 37.7989, lng: -122.4662 },
    availabilityStatus: 'available',
    moderationStatus: 'approved',
  });

  // 4. Initial inventory transactions
  await InventoryTransaction.create([
    {
      resourceId: r1._id,
      performedBy: provider._id,
      type: 'initial',
      quantityChanged: 700,
      previousQuantity: 0,
      newQuantity: 700,
      note: 'Initial stock intake from regional disaster relief partner',
    },
    {
      resourceId: r1._id,
      performedBy: provider._id,
      type: 'reserved',
      quantityChanged: 50,
      previousQuantity: 700,
      newQuantity: 650,
      note: 'Reserved for District 4 community shelter request',
    },
    {
      resourceId: r2._id,
      performedBy: ngoUser._id,
      type: 'initial',
      quantityChanged: 1200,
      previousQuantity: 0,
      newQuantity: 1200,
      note: 'Bulk bottled water pallet intake',
    },
  ]);

  // 5. Create Sample Requests
  // Approved request with reserved stock
  const approvedReq = await ResourceRequest.create({
    resourceId: r1._id,
    seekerId: seeker._id,
    providerId: provider._id,
    requestedQuantity: 50,
    approvedQuantity: 50,
    reason: 'Emergency shelter housing 18 displaced flood victims in temporary gym facility.',
    urgency: 'high',
    destinationAddress: 'Evac Shelter #3, 500 Folsom St, San Francisco, CA',
    contactPhone: '+1 (555) 019-9003',
    status: 'approved',
    volunteerId: volunteer._id,
    statusHistory: [
      {
        status: 'pending',
        changedBy: seeker._id,
        note: 'Urgent food ration request submitted',
        timestamp: new Date(Date.now() - 3600000 * 4),
      },
      {
        status: 'approved',
        changedBy: provider._id,
        note: 'Approved for full requested amount. Ready for collection.',
        timestamp: new Date(Date.now() - 3600000 * 2),
      },
    ],
  });

  // Pending request
  await ResourceRequest.create({
    resourceId: r3._id,
    seekerId: seeker._id,
    providerId: ngoUser._id,
    organizationId: hopeOrg._id,
    requestedQuantity: 5,
    approvedQuantity: 0,
    reason: 'First aid kits needed for community triage post after storm surge.',
    urgency: 'critical',
    destinationAddress: 'Community Triage Post, 220 4th St, San Francisco, CA',
    contactPhone: '+1 (555) 019-9003',
    status: 'pending',
    statusHistory: [
      {
        status: 'pending',
        changedBy: seeker._id,
        note: 'Submitted request for first aid kits',
        timestamp: new Date(Date.now() - 1800000),
      },
    ],
  });

  // Fulfilled request
  await ResourceRequest.create({
    resourceId: r2._id,
    seekerId: seeker._id,
    providerId: ngoUser._id,
    organizationId: hopeOrg._id,
    requestedQuantity: 100,
    approvedQuantity: 100,
    reason: 'Water supply disruption in residential block B.',
    urgency: 'medium',
    destinationAddress: 'Block B Distribution Point, 1100 Howard St, San Francisco, CA',
    contactPhone: '+1 (555) 019-9003',
    status: 'fulfilled',
    volunteerId: volunteer._id,
    statusHistory: [
      {
        status: 'pending',
        changedBy: seeker._id,
        note: 'Submitted request',
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        status: 'approved',
        changedBy: ngoUser._id,
        note: 'Approved 100 gallons',
        timestamp: new Date(Date.now() - 72000000),
      },
      {
        status: 'fulfilled',
        changedBy: volunteer._id,
        note: 'Delivered and handed over to resident coordinator',
        timestamp: new Date(Date.now() - 36000000),
      },
    ],
  });

  // 6. Volunteer Assignment
  await VolunteerAssignment.create({
    requestId: approvedReq._id,
    volunteerId: volunteer._id,
    assignedBy: provider._id,
    status: 'assigned',
    collectionLocation: 'Apex Central Logistics Depot, 101 Bayfront Expressway, San Francisco, CA',
    dropoffLocation: 'Evac Shelter #3, 500 Folsom St, San Francisco, CA',
    collectionNotes: 'Check in with security gate 2, ask for Marcus Vance.',
  });

  // 7. Notifications
  await Notification.create([
    {
      recipientId: seeker._id,
      title: 'Request Approved: Emergency Food Rations',
      message: 'Your request for 50 packets of Ready-to-Eat Emergency Food Rations has been approved by Apex Logistics.',
      type: 'request_approved',
      link: '/dashboard/seeker',
      read: false,
    },
    {
      recipientId: provider._id,
      title: 'New Emergency Resource Request',
      message: 'Elena Rostova requested 50 packets of Ready-to-Eat Emergency Food Rations (Urgency: HIGH).',
      type: 'request_created',
      link: '/dashboard/provider',
      read: true,
    },
    {
      recipientId: volunteer._id,
      title: 'New Delivery Assignment',
      message: 'You have been assigned to deliver 50 packets of MREs to Evac Shelter #3.',
      type: 'system',
      link: '/dashboard/volunteer',
      read: false,
    },
  ]);

  // 8. Audit Logs
  await AuditLog.create([
    {
      userId: superAdmin._id,
      userEmail: superAdmin.email,
      role: 'super_admin',
      action: 'SYSTEM_BOOTSTRAP',
      resourceType: 'System',
      details: { environment: 'production-ready', seeded: true },
      ip: '127.0.0.1',
    },
    {
      userId: admin._id,
      userEmail: admin.email,
      role: 'admin',
      action: 'ORG_VERIFICATION_REVIEW',
      resourceType: 'Organization',
      resourceId: hopeOrg._id.toString(),
      details: { status: 'verified', name: hopeOrg.name },
      ip: '127.0.0.1',
    },
  ]);

  console.log('Database successfully seeded with realistic emergency resources and multi-role accounts!');
}
