/**
 * Script de debugging para probar las APIs de admin
 * Ejecutar en la consola del navegador cuando estés en el panel de admin
 */

// Test 1: Verificar que podemos hacer fetch a una API simple
async function testBasicAPI() {
    console.log('🔵 Testing basic API...');
    try {
        const response = await fetch('/api/test');
        const text = await response.text();
        console.log('Response text:', text);

        if (response.ok) {
            const data = JSON.parse(text);
            console.log('✅ Basic API works:', data);
            return true;
        } else {
            console.log('❌ Basic API failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('❌ Error in basic API test:', error);
        return false;
    }
}

// Test 2: Verificar que podemos obtener el token de Firebase Auth
async function testGetToken() {
    console.log('🔵 Testing Firebase Auth token...');
    try {
        const { auth } = await import('/src/lib/firebase');
        const user = auth.currentUser;

        if (!user) {
            console.log('❌ No user logged in');
            return null;
        }

        console.log('✅ User logged in:', user.email);
        const token = await user.getIdToken();
        console.log('✅ Token obtained (first 20 chars):', token.substring(0, 20) + '...');
        return token;
    } catch (error) {
        console.error('❌ Error getting token:', error);
        return null;
    }
}

// Test 3: Hacer una llamada de prueba al endpoint de aprobación con logging detallado
async function testApproveAPI(professionalId) {
    console.log('🔵 Testing approve API for professional:', professionalId);

    try {
        const { auth } = await import('/src/lib/firebase');
        const user = auth.currentUser;

        if (!user) {
            console.log('❌ No user logged in');
            return;
        }

        const token = await user.getIdToken();
        console.log('🟡 Making request to:', `/api/admin/professionals/${professionalId}/approve`);
        console.log('🟡 With token (first 20 chars):', token.substring(0, 20) + '...');

        const response = await fetch(`/api/admin/professionals/${professionalId}/approve`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        console.log('🟡 Response status:', response.status, response.statusText);
        console.log('🟡 Response headers:', Object.fromEntries(response.headers.entries()));

        const responseClone = response.clone();
        const responseText = await responseClone.text();
        console.log('🟡 Response text:', responseText);

        if (!response.ok) {
            console.log('❌ Request failed');
            try {
                const error = JSON.parse(responseText);
                console.log('Error data:', error);
            } catch {
                console.log('Could not parse error as JSON');
            }
            return;
        }

        if (!responseText || responseText.trim() === '') {
            console.log('❌ Empty response from server');
            return;
        }

        try {
            const data = JSON.parse(responseText);
            console.log('✅ Success:', data);
        } catch (parseError) {
            console.error('❌ Error parsing JSON:', parseError);
        }

    } catch (error) {
        console.error('❌ Error in approve API test:', error);
    }
}

// Ejecutar pruebas
async function runAllTests() {
    console.log('=== Starting API Debug Tests ===\n');

    await testBasicAPI();
    console.log('\n');

    await testGetToken();
    console.log('\n');

    console.log('To test approve API, run:');
    console.log('testApproveAPI("PROFESSIONAL_ID_HERE")');
    console.log('\n=== Tests Complete ===');
}

// Auto-run
runAllTests();
