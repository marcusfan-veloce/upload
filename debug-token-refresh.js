// Debug script for token refresh testing
// Run this in your browser console or as a Node.js script

async function testTokenRefresh() {
  console.log('=== Token Refresh Debug Test ===')

  try {
    // Test the refresh token API endpoint
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: 'YOUR_REFRESH_TOKEN_HERE', // Replace with actual refresh token
        uploadRecordId: 'YOUR_UPLOAD_RECORD_ID_HERE' // Replace with actual record ID
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Token refresh successful:', data)
    } else {
      const errorData = await response.json()
      console.error('❌ Token refresh failed:', errorData)
    }

  } catch (error) {
    console.error('❌ Network or other error:', error)
  }
}

// Function to check current token status
async function checkCurrentTokenStatus() {
  console.log('=== Checking Current Token Status ===')

  try {
    // This would need to be adapted based on your actual data structure
    const response = await fetch('/api/check-token-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Current token status:', data)
    } else {
      console.error('Failed to check token status')
    }

  } catch (error) {
    console.error('Error checking token status:', error)
  }
}

// Function to manually test token expiry
function testTokenExpiryCalculation() {
  console.log('=== Testing Token Expiry Calculation ===')

  const now = Date.now()
  const oneHourAgo = now - (60 * 60 * 1000)
  const fiveMinutesAgo = now - (5 * 60 * 1000)

  console.log('Current time:', new Date(now).toISOString())
  console.log('1 hour ago:', new Date(oneHourAgo).toISOString())
  console.log('5 minutes ago:', new Date(fiveMinutesAgo).toISOString())

  // Test buffer calculation
  const bufferTime = 5 * 60 * 1000 // 5 minutes
  const testExpiry = oneHourAgo + bufferTime

  console.log('Test expiry (1 hour ago + 5 min buffer):', new Date(testExpiry).toISOString())
  console.log('Needs refresh:', now >= (testExpiry - bufferTime))
}

// Run tests
console.log('Debug functions loaded. Run:')
console.log('- testTokenRefresh() to test the refresh API')
console.log('- checkCurrentTokenStatus() to check current status')
console.log('- testTokenExpiryCalculation() to test expiry logic')

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testTokenRefresh,
    checkCurrentTokenStatus,
    testTokenExpiryCalculation
  }
}
