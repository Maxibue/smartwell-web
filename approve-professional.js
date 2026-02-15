// Simple script to approve a professional directly in Firestore
// Run this with: node approve-professional.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function approveProfessional(professionalId) {
    try {
        await db.collection('professionals').doc(professionalId).update({
            status: 'approved'
        });
        console.log(`✅ Professional ${professionalId} approved successfully!`);
    } catch (error) {
        console.error('❌ Error approving professional:', error);
    }
}

// Get professional ID from command line argument
const professionalId = process.argv[2];

if (!professionalId) {
    console.log('Usage: node approve-professional.js <professional-id>');
    console.log('Example: node approve-professional.js kDEkmtkaW6cuBP42Q5K9qHX7grH2');
    process.exit(1);
}

approveProfessional(professionalId).then(() => process.exit(0));
