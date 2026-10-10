import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { User } from '../server/models/User.js';
import { Resource } from '../server/models/Resource.js';
import { ResourceRequest } from '../server/models/ResourceRequest.js';
import { InventoryTransaction } from '../server/models/InventoryTransaction.js';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('1. Authentication & Security Models', () => {
  it('correctly hashes passwords and prevents plain text storage', async () => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('SecurePassword@123', salt);

    const user = await User.create({
      name: 'Test Officer',
      email: 'test@relief.gov',
      passwordHash: hash,
      role: 'provider',
      status: 'active',
    });

    expect(user.passwordHash).not.toBe('SecurePassword@123');
    expect(await user.comparePassword('SecurePassword@123')).toBe(true);
    expect(await user.comparePassword('WrongPassword')).toBe(false);
  });

  it('enforces unique email constraint', async () => {
    await expect(
      User.create({
        name: 'Duplicate Officer',
        email: 'test@relief.gov',
        passwordHash: 'dummy',
        role: 'seeker',
      })
    ).rejects.toThrow();
  });
});

describe('2. Inventory Atomic Management & Reservation Safety', () => {
  it('atomically deducts available stock and reserves quantity on request approval', async () => {
    const provider = await User.create({
      name: 'Depot Provider',
      email: 'depot@relief.org',
      passwordHash: 'dummy',
      role: 'provider',
    });

    const resource = await Resource.create({
      title: 'Water Purification Packets',
      category: 'water',
      description: 'Emergency water purification sachets',
      quantityAvailable: 100,
      quantityReserved: 0,
      unit: 'packets',
      providerId: provider._id,
      locationName: 'Depot Alpha',
      address: '100 Main St',
      coordinates: { lat: 37.77, lng: -122.41 },
      availabilityStatus: 'available',
    });

    // Simulate atomic reservation approval
    const requestedQty = 30;
    const updated = await Resource.findOneAndUpdate(
      { _id: resource._id, quantityAvailable: { $gte: requestedQty } },
      { $inc: { quantityAvailable: -requestedQty, quantityReserved: requestedQty } },
      { new: true }
    );

    expect(updated).not.toBeNull();
    expect(updated?.quantityAvailable).toBe(70);
    expect(updated?.quantityReserved).toBe(30);

    // Concurrency safety check: attempt to reserve more than remaining 70
    const overReservation = await Resource.findOneAndUpdate(
      { _id: resource._id, quantityAvailable: { $gte: 80 } },
      { $inc: { quantityAvailable: -80, quantityReserved: 80 } },
      { new: true }
    );

    expect(overReservation).toBeNull(); // Must reject when quantityAvailable < requested!
  });

  it('restores reserved quantity to available when an approved request is cancelled', async () => {
    const provider = await User.create({
      name: 'Depot Provider 2',
      email: 'depot2@relief.org',
      passwordHash: 'dummy',
      role: 'provider',
    });

    const resource = await Resource.create({
      title: 'Emergency Rations',
      category: 'food',
      description: 'MREs',
      quantityAvailable: 50,
      quantityReserved: 20,
      unit: 'boxes',
      providerId: provider._id,
      locationName: 'Depot Beta',
      address: '200 Main St',
      coordinates: { lat: 37.77, lng: -122.41 },
    });

    // Cancel releases 20 units back
    const released = await Resource.findByIdAndUpdate(
      resource._id,
      { $inc: { quantityAvailable: 20, quantityReserved: -20 } },
      { new: true }
    );

    expect(released?.quantityAvailable).toBe(70);
    expect(released?.quantityReserved).toBe(0);
  });

  it('atomically deducts reserved quantity without corrupting available inventory on fulfillment', async () => {
    const provider = await User.create({
      name: 'Depot Provider 3',
      email: 'depot3@relief.org',
      passwordHash: 'dummy',
      role: 'provider',
    });

    const resource = await Resource.create({
      title: 'First Aid Kits',
      category: 'first_aid',
      description: 'Triage trauma kits',
      quantityAvailable: 40,
      quantityReserved: 10,
      unit: 'kits',
      providerId: provider._id,
      locationName: 'Depot Gamma',
      address: '300 Main St',
      coordinates: { lat: 37.77, lng: -122.41 },
    });

    // Fulfillment confirmation: decrements reserved quantity
    const fulfilled = await Resource.findByIdAndUpdate(
      resource._id,
      { $inc: { quantityReserved: -10 } },
      { new: true }
    );

    expect(fulfilled?.quantityAvailable).toBe(40);
    expect(fulfilled?.quantityReserved).toBe(0);
  });
});

describe('3. Request Workflow Transitions', () => {
  it('creates request in pending status with audit history', async () => {
    const seeker = await User.create({
      name: 'Evacuee Seeker',
      email: 'evacuee@relief.gov',
      passwordHash: 'dummy',
      role: 'seeker',
    });

    const provider = await User.create({
      name: 'Provider Bravo',
      email: 'bravo@relief.gov',
      passwordHash: 'dummy',
      role: 'provider',
    });

    const resource = await Resource.create({
      title: 'Thermal Blankets',
      category: 'clothing',
      description: 'Heavy fleece blankets',
      quantityAvailable: 100,
      quantityReserved: 0,
      unit: 'blankets',
      providerId: provider._id,
      locationName: 'Bravo Depot',
      address: '400 Main St',
      coordinates: { lat: 37.77, lng: -122.41 },
    });

    const request = await ResourceRequest.create({
      resourceId: resource._id,
      seekerId: seeker._id,
      providerId: provider._id,
      requestedQuantity: 15,
      reason: 'Urgent cold shelter conditions for 10 families',
      urgency: 'high',
      destinationAddress: 'Evac Shelter #5',
      contactPhone: '+1-555-0199',
      status: 'pending',
      statusHistory: [
        {
          status: 'pending',
          changedBy: seeker._id,
          note: 'Request created',
          timestamp: new Date(),
        },
      ],
    });

    expect(request.status).toBe('pending');
    expect(request.statusHistory.length).toBe(1);
    expect(request.statusHistory[0].status).toBe('pending');
  });
});
