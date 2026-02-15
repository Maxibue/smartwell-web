/**
 * Script to create a test professional in Firestore
 * Run with: node scripts/create-test-professional.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function createTestProfessional() {
    try {
        console.log('🔄 Creating test professional...');

        const professionalData = {
            // Personal Information
            firstName: 'María',
            lastName: 'González',
            title: 'Lic.',
            email: 'maria.gonzalez@test.com',

            // Professional Information
            specialty: 'Psicología Clínica',
            category: 'Salud Mental',
            bio: 'Psicóloga clínica con más de 10 años de experiencia en terapia cognitivo-conductual. Especializada en tratamiento de ansiedad, depresión y trastornos del estado de ánimo. Mi enfoque es empático, profesional y centrado en el paciente.',

            // Pricing and Sessions
            price: 45000,
            sessionDuration: 50,
            bufferTime: 10,

            // Status
            status: 'approved', // Pre-approved for testing

            // Availability (Monday to Friday, 9 AM to 5 PM)
            availability: {
                monday: {
                    enabled: true,
                    slots: [
                        { start: '09:00', end: '13:00' },
                        { start: '14:00', end: '17:00' }
                    ]
                },
                tuesday: {
                    enabled: true,
                    slots: [
                        { start: '09:00', end: '13:00' },
                        { start: '14:00', end: '17:00' }
                    ]
                },
                wednesday: {
                    enabled: true,
                    slots: [
                        { start: '09:00', end: '13:00' },
                        { start: '14:00', end: '17:00' }
                    ]
                },
                thursday: {
                    enabled: true,
                    slots: [
                        { start: '09:00', end: '13:00' },
                        { start: '14:00', end: '17:00' }
                    ]
                },
                friday: {
                    enabled: true,
                    slots: [
                        { start: '09:00', end: '13:00' },
                        { start: '14:00', end: '17:00' }
                    ]
                },
                saturday: {
                    enabled: false,
                    slots: []
                },
                sunday: {
                    enabled: false,
                    slots: []
                }
            },

            // Profile Image (using a placeholder)
            profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',

            // Ratings
            rating: 4.8,
            reviewCount: 24,

            // Timestamps
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // Create the professional document
        const docRef = await db.collection('professionals').add(professionalData);

        console.log('✅ Test professional created successfully!');
        console.log('📋 Professional ID:', docRef.id);
        console.log('👤 Name:', `${professionalData.title} ${professionalData.firstName} ${professionalData.lastName}`);
        console.log('💼 Specialty:', professionalData.specialty);
        console.log('💰 Price:', `$${professionalData.price}`);
        console.log('📅 Availability: Monday to Friday, 9 AM - 5 PM');
        console.log('\n🔗 Test URLs:');
        console.log(`   Profile: http://localhost:3000/profesionales/${docRef.id}`);
        console.log(`   Booking: http://localhost:3000/reservar?professional=${docRef.id}`);

        return docRef.id;
    } catch (error) {
        console.error('❌ Error creating test professional:', error);
        throw error;
    }
}

// Run the script
createTestProfessional()
    .then(() => {
        console.log('\n✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });
