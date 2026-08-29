import 'dotenv/config';
import bcrypt from 'bcrypt';
import { db } from '../../config/database.js';
import {
  users,
  projects,
  milestones,
  procurementItems,
  contractorScores,
  projectStoppages,
  auditLog,
} from '../schema/index.js';
import { logger } from '../../lib/logger.js';

// ─── Seed Data ───────────────────────────────────────────────────────────────
// Creates sample data for development and testing.
// Run with: npm run db:seed

async function seed() {
  logger.info('🌱 Seeding database...');

  try {
    // Clean existing tables in dependency order
    await db.delete(auditLog);
    await db.delete(projectStoppages);
    await db.delete(milestones);
    await db.delete(procurementItems);
    await db.delete(contractorScores);
    await db.delete(projects);
    await db.delete(users);

    // ─── 1. Users ──────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('Admin@1234', 12);
    const viewerHash = await bcrypt.hash('Viewer@1234', 12);

    const [admin, viewer] = await db
      .insert(users)
      .values([
        {
          email: 'admin@scb.com',
          name: 'System Administrator',
          passwordHash,
          role: 'ADMIN' as const,
        },
        {
          email: 'viewer@scb.com',
          name: 'Project Viewer',
          passwordHash: viewerHash,
          role: 'VIEWER' as const,
        },
      ])
      .returning();

    logger.info(`Created ${2} users`);

    // ─── 2. Projects ───────────────────────────────────────────────────────
    const projectData = [
      {
        code: 'ENG-001',
        name: 'Core Banking Platform Upgrade',
        description: 'Migration to next-gen core banking system',
        status: 'ACTIVE' as const,
        startDate: new Date('2025-01-15'),
        endDate: new Date('2026-06-30'),
        contractValue: '4500000.00',
        finalCost: null,
        createdBy: admin.id,
      },
      {
        code: 'ENG-002',
        name: 'Data Center Expansion Phase II',
        description: 'New server racks, cooling, and networking infrastructure',
        status: 'ACTIVE' as const,
        startDate: new Date('2025-03-01'),
        endDate: new Date('2026-03-01'),
        contractValue: '8200000.00',
        finalCost: '8650000.00', // Over budget → AMBER/RED cost
        createdBy: admin.id,
      },
      {
        code: 'ENG-003',
        name: 'Branch Network Modernization',
        description: 'Upgrading 45 branch offices with modern networking equipment',
        status: 'ACTIVE' as const,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2026-12-31'),
        contractValue: '3200000.00',
        finalCost: null,
        createdBy: admin.id,
      },
      {
        code: 'ENG-004',
        name: 'Security Operations Center Build',
        description: '24/7 SOC facility with advanced monitoring capabilities',
        status: 'PLANNING' as const,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-09-30'),
        contractValue: '2100000.00',
        finalCost: null,
        createdBy: admin.id,
      },
      {
        code: 'ENG-005',
        name: 'Disaster Recovery Site Setup',
        description: 'Secondary DR site with full failover capabilities',
        status: 'COMPLETED' as const,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-12-31'),
        contractValue: '5600000.00',
        finalCost: '5450000.00', // Under budget → GREEN cost
        createdBy: admin.id,
      },
    ];

    const insertedProjects = await db
      .insert(projects)
      .values(projectData)
      .returning();

    logger.info(`Created ${insertedProjects.length} projects`);

    // ─── 3. Milestones ─────────────────────────────────────────────────────
    const milestoneData = [
      // ENG-001 milestones
      { projectId: insertedProjects[0].id, name: 'Requirements Finalized', baselineDate: new Date('2025-03-01'), forecastDate: new Date('2025-03-05'), status: 'COMPLETED' as const, actualDate: new Date('2025-03-04') },
      { projectId: insertedProjects[0].id, name: 'Vendor Selection Complete', baselineDate: new Date('2025-05-01'), forecastDate: new Date('2025-05-15'), status: 'COMPLETED' as const, actualDate: new Date('2025-05-14') },
      { projectId: insertedProjects[0].id, name: 'Phase 1 Go-Live', baselineDate: new Date('2025-09-01'), forecastDate: new Date('2025-10-15'), status: 'IN_PROGRESS' as const },
      { projectId: insertedProjects[0].id, name: 'Full Migration Complete', baselineDate: new Date('2026-03-01'), forecastDate: new Date('2026-04-20'), status: 'NOT_STARTED' as const },
      // ENG-002 milestones (heavily delayed)
      { projectId: insertedProjects[1].id, name: 'Site Preparation', baselineDate: new Date('2025-04-01'), forecastDate: new Date('2025-04-10'), status: 'COMPLETED' as const, actualDate: new Date('2025-04-08') },
      { projectId: insertedProjects[1].id, name: 'Equipment Procurement', baselineDate: new Date('2025-06-01'), forecastDate: new Date('2025-07-15'), status: 'COMPLETED' as const, actualDate: new Date('2025-07-12') },
      { projectId: insertedProjects[1].id, name: 'Rack Installation', baselineDate: new Date('2025-08-01'), forecastDate: new Date('2025-09-25'), status: 'IN_PROGRESS' as const },
      { projectId: insertedProjects[1].id, name: 'Network Configuration', baselineDate: new Date('2025-10-01'), forecastDate: new Date('2025-12-01'), status: 'NOT_STARTED' as const },
      // ENG-003 milestones
      { projectId: insertedProjects[2].id, name: 'Assessment Report', baselineDate: new Date('2025-07-15'), forecastDate: new Date('2025-07-20'), status: 'COMPLETED' as const, actualDate: new Date('2025-07-18') },
      { projectId: insertedProjects[2].id, name: 'Pilot Branch Deployment', baselineDate: new Date('2025-09-01'), forecastDate: new Date('2025-09-05'), status: 'IN_PROGRESS' as const },
      { projectId: insertedProjects[2].id, name: 'Full Rollout Phase 1 (15 branches)', baselineDate: new Date('2026-01-15'), forecastDate: new Date('2026-02-01'), status: 'NOT_STARTED' as const },
      { projectId: insertedProjects[2].id, name: 'Full Rollout Phase 2 (30 branches)', baselineDate: new Date('2026-06-01'), forecastDate: null, status: 'NOT_STARTED' as const },
      // ENG-004 milestones
      { projectId: insertedProjects[3].id, name: 'Architecture Design', baselineDate: new Date('2026-02-01'), forecastDate: new Date('2026-02-01'), status: 'NOT_STARTED' as const },
      { projectId: insertedProjects[3].id, name: 'Tool Selection', baselineDate: new Date('2026-04-01'), forecastDate: new Date('2026-04-01'), status: 'NOT_STARTED' as const },
      // ENG-005 milestones (all completed)
      { projectId: insertedProjects[4].id, name: 'DR Site Construction', baselineDate: new Date('2024-09-01'), forecastDate: new Date('2024-09-01'), status: 'COMPLETED' as const, actualDate: new Date('2024-08-28') },
      { projectId: insertedProjects[4].id, name: 'Equipment Installation', baselineDate: new Date('2025-01-15'), forecastDate: new Date('2025-01-15'), status: 'COMPLETED' as const, actualDate: new Date('2025-01-12') },
      { projectId: insertedProjects[4].id, name: 'Failover Testing', baselineDate: new Date('2025-06-01'), forecastDate: new Date('2025-06-01'), status: 'COMPLETED' as const, actualDate: new Date('2025-05-30') },
      { projectId: insertedProjects[4].id, name: 'Go-Live & Handover', baselineDate: new Date('2025-10-01'), forecastDate: new Date('2025-10-01'), status: 'COMPLETED' as const, actualDate: new Date('2025-09-28') },
    ];

    await db.insert(milestones).values(milestoneData);
    logger.info(`Created ${milestoneData.length} milestones`);

    // ─── 4. Procurement Items ──────────────────────────────────────────────
    const procurementData = [
      { projectId: insertedProjects[0].id, itemName: 'Oracle DB Licenses', tenderQuantity: 20, allocatedQuantity: 15, deliveredQuantity: 10, unitCost: '45000.00', status: 'PARTIALLY_DELIVERED' as const },
      { projectId: insertedProjects[0].id, itemName: 'Application Servers', tenderQuantity: 8, allocatedQuantity: 8, deliveredQuantity: 8, unitCost: '32000.00', status: 'DELIVERED' as const },
      { projectId: insertedProjects[1].id, itemName: 'Server Racks (42U)', tenderQuantity: 24, allocatedQuantity: 20, deliveredQuantity: 16, unitCost: '8500.00', status: 'PARTIALLY_DELIVERED' as const },
      { projectId: insertedProjects[1].id, itemName: 'PDU Units', tenderQuantity: 48, allocatedQuantity: 48, deliveredQuantity: 48, unitCost: '3200.00', status: 'DELIVERED' as const },
      { projectId: insertedProjects[1].id, itemName: 'Cooling Units', tenderQuantity: 6, allocatedQuantity: 4, deliveredQuantity: 2, unitCost: '125000.00', status: 'ALLOCATED' as const },
      { projectId: insertedProjects[2].id, itemName: 'Network Switches', tenderQuantity: 90, allocatedQuantity: 45, deliveredQuantity: 20, unitCost: '4500.00', status: 'PARTIALLY_DELIVERED' as const },
      { projectId: insertedProjects[2].id, itemName: 'Wireless Access Points', tenderQuantity: 180, allocatedQuantity: 90, deliveredQuantity: 30, unitCost: '850.00', status: 'PARTIALLY_DELIVERED' as const },
      { projectId: insertedProjects[2].id, itemName: 'Fiber Optic Cables (m)', tenderQuantity: 5000, allocatedQuantity: 2500, deliveredQuantity: 1000, unitCost: '12.50', status: 'ALLOCATED' as const },
      { projectId: insertedProjects[3].id, itemName: 'SIEM Platform License', tenderQuantity: 1, allocatedQuantity: 0, deliveredQuantity: 0, unitCost: '320000.00', status: 'PENDING' as const },
      { projectId: insertedProjects[3].id, itemName: 'Monitoring Displays', tenderQuantity: 12, allocatedQuantity: 0, deliveredQuantity: 0, unitCost: '2800.00', status: 'PENDING' as const },
    ];

    await db.insert(procurementItems).values(procurementData);
    logger.info(`Created ${procurementData.length} procurement items`);

    // ─── 5. Contractor Scores ──────────────────────────────────────────────
    const contractorData = [
      { contractorName: 'Al-Faisal Construction Co.', projectId: insertedProjects[1].id, schedule: 72, quality: 88, resources: 65, safety: 92, coordination: 70, docs: 78 },
      { contractorName: 'TechBuild Engineering', projectId: insertedProjects[0].id, schedule: 85, quality: 90, resources: 80, safety: 95, coordination: 88, docs: 82 },
      { contractorName: 'NetPro Solutions', projectId: insertedProjects[2].id, schedule: 90, quality: 85, resources: 88, safety: 91, coordination: 86, docs: 84 },
      { contractorName: 'SecureInfra Ltd.', projectId: insertedProjects[3].id, schedule: 78, quality: 82, resources: 75, safety: 88, coordination: 80, docs: 70 },
      { contractorName: 'Gulf Systems Integration', projectId: insertedProjects[4].id, schedule: 95, quality: 92, resources: 90, safety: 96, coordination: 93, docs: 91 },
    ];

    await db.insert(contractorScores).values(contractorData);
    logger.info(`Created ${contractorData.length} contractor scores`);

    // ─── 6. Project Stoppages & Extensions ────────────────────────────────
    const stoppageData = [
      {
        projectId: insertedProjects[0].id,
        reason: 'Civil Defense & Fire Safety Authority inspection permit delay',
        daysAdded: 15,
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-04-16'),
      },
      {
        projectId: insertedProjects[0].id,
        reason: 'Client requested architectural redesign of data vault security perimeter',
        daysAdded: 10,
        startDate: new Date('2025-06-10'),
        endDate: new Date('2025-06-20'),
      },
      {
        projectId: insertedProjects[1].id,
        reason: 'High-voltage transformer delivery delay from international manufacturer',
        daysAdded: 30,
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-31'),
      },
      {
        projectId: insertedProjects[2].id,
        reason: 'Telecom service provider duct civil works dispute (Active Delay)',
        daysAdded: null,
        startDate: new Date('2025-10-01'),
        endDate: null, // Ongoing delay
      },
    ];

    await db.insert(projectStoppages).values(stoppageData);
    logger.info(`Created ${stoppageData.length} project stoppages`);

    logger.info('✅ Database seeded successfully!');
    logger.info('───────────────────────────────────────');
    logger.info('Admin login: admin@scb.com / Admin@1234');
    logger.info('Viewer login: viewer@scb.com / Viewer@1234');
    logger.info('───────────────────────────────────────');
  } catch (error) {
    logger.error({ err: error }, '❌ Seed failed');
    throw error;
  }

  process.exit(0);
}

seed();
