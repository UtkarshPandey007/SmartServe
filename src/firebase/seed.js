// One-time seed script: migrates hardcoded data to Firestore
import { doc, setDoc, writeBatch, collection } from 'firebase/firestore';
import { db } from './config';
import { needs } from '../data/needs';
import { volunteers } from '../data/volunteers';
import { tasks } from '../data/tasks';
import { monthlyStats, categoryDistribution, geographicCoverage, kpiData, leaderboard, weeklyTrend } from '../data/analytics';

export async function seedDatabase() {
  console.log('🌱 Starting database seed...');

  try {
    // Seed needs — use need.id as document ID for easy lookup
    const needsBatch = writeBatch(db);
    needs.forEach(need => {
      const ref = doc(db, 'needs', need.id);
      needsBatch.set(ref, { ...need });
    });
    await needsBatch.commit();
    console.log(`✅ Seeded ${needs.length} needs`);

    // Seed volunteers
    const volBatch = writeBatch(db);
    volunteers.forEach(vol => {
      const ref = doc(db, 'volunteers', vol.id);
      volBatch.set(ref, { ...vol });
    });
    await volBatch.commit();
    console.log(`✅ Seeded ${volunteers.length} volunteers`);

    // Seed tasks
    const taskBatch = writeBatch(db);
    tasks.forEach(task => {
      const ref = doc(db, 'tasks', task.id);
      taskBatch.set(ref, { ...task });
    });
    await taskBatch.commit();
    console.log(`✅ Seeded ${tasks.length} tasks`);

    // Seed analytics summary
    await setDoc(doc(db, 'analytics', 'summary'), {
      monthlyStats,
      categoryDistribution,
      geographicCoverage,
      kpiData,
      leaderboard,
      weeklyTrend,
    });
    console.log('✅ Seeded analytics');

    console.log('🎉 Database seeding complete!');
    return true;
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
