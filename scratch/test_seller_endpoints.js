async function testEndpoints() {
  console.log('Testing Seller APIs via polyfill...');
  try {
    // 1. Fetch seller profile
    const selectPayload = {
      table: 'sellers',
      action: 'select',
      filters: [{ column: 'user_id', operator: 'eq', value: 'test-seller-uuid' }],
      isSingle: false,
      isMaybeSingle: true
    };

    let response = await fetch('http://localhost:80/api/supabase-polyfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(selectPayload)
    });
    let result = await response.json();
    console.log('1. SELECT Sellers Result:', JSON.stringify(result, null, 2));

    // 2. Fetch products
    const productsPayload = {
      table: 'products',
      action: 'select',
      filters: [{ column: 'seller_id', operator: 'eq', value: 'test-seller-uuid' }],
      isSingle: false
    };

    response = await fetch('http://localhost:80/api/supabase-polyfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productsPayload)
    });
    result = await response.json();
    console.log('2. SELECT Products Result:', JSON.stringify(result, null, 2));

    // 3. Update Store Settings
    const updatePayload = {
      table: 'sellers',
      action: 'update',
      updateData: {
        store_name: 'Jaipur Blue Pottery II',
        store_description: 'Updated description',
        address: '123 New Art Gallery Row',
        city: 'Jaipur',
        state: 'RJ',
        pincode: '302001'
      },
      filters: [{ column: 'id', operator: 'eq', value: 'test-seller-profile-uuid' }]
    };

    response = await fetch('http://localhost:80/api/supabase-polyfill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload)
    });
    result = await response.json();
    console.log('3. UPDATE Store Settings Result:', JSON.stringify(result, null, 2));

  } catch (err) {
    console.error('Error testing endpoints:', err);
  }
}

testEndpoints();
