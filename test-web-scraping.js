const axios = require('axios');

async function testWebScraping() {
  console.log('🧪 Testing Web Scraping API...');

  try {
    // Test the API endpoint
    const response = await axios.post('http://localhost:3000/api/scrape-dental-clinics', {
      location: {
        zipCode: '90210',
        city: 'Beverly Hills',
        state: 'CA'
      },
      filters: {
        hasEmail: false,
        hasPhone: false,
        hasWebsite: false
      }
    }, {
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log(`🎯 Found ${response.data.data.leads.length} dental clinic leads`);

      if (response.data.data.leads.length > 0) {
        const firstLead = response.data.data.leads[0];
        console.log('📋 First Lead Example:');
        console.log(`  - Name: ${firstLead.name}`);
        console.log(`  - Address: ${firstLead.address}`);
        console.log(`  - Phone: ${firstLead.phone || 'N/A'}`);
        console.log(`  - Email: ${firstLead.email || 'N/A'}`);
        console.log(`  - Website: ${firstLead.website || 'N/A'}`);
        console.log(`  - Specialties: ${firstLead.specialties.join(', ') || 'N/A'}`);
        console.log(`  - Needs Indicators: ${firstLead.needsIndicators.join(', ') || 'N/A'}`);
      }
    } else {
      console.log('❌ API returned error:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Error Response:', error.response.data);
    }
  }
}

// Test GET endpoint first
async function testGetEndpoint() {
  try {
    console.log('🔍 Testing GET endpoint...');
    const response = await axios.get('http://localhost:3000/api/scrape-dental-clinics');
    console.log('✅ GET Response:', response.data);
  } catch (error) {
    console.error('❌ GET Test failed:', error.message);
  }
}

async function runTests() {
  await testGetEndpoint();
  console.log('\n' + '='.repeat(50) + '\n');
  await testWebScraping();
}

runTests().catch(console.error);