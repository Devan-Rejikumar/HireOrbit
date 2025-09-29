const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:devan@localhost:5432/application_service_db"
    }
  }
});

async function cleanupApplications() {
  try {
    console.log('🧹 Starting cleanup...');
    
    // Delete application status history first (foreign key constraint)
    const deletedHistory = await prisma.applicationStatusHistory.deleteMany({});
    console.log(`✅ Deleted ${deletedHistory.count} status history records`);
    
    // Delete application notes
    const deletedNotes = await prisma.applicationNotes.deleteMany({});
    console.log(`✅ Deleted ${deletedNotes.count} application notes`);
    
    // Delete all applications
    const deletedApplications = await prisma.application.deleteMany({});
    console.log(`✅ Deleted ${deletedApplications.count} applications`);
    
    console.log('🎉 Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupApplications();
