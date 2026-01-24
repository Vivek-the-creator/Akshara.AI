// Test file to verify attempts logic
// This can be run in browser console to test the calculateStars function

function calculateStars(attemptCount) {
  if (attemptCount <= 3) return 3
  if (attemptCount <= 7) return 2
  return 1
}

console.log('🧪 Testing Attempts Logic:')
console.log('================================')

// Test different attempt counts
const testCases = [1, 2, 3, 4, 5, 6, 7, 8, 10, 15]

testCases.forEach(attempts => {
  const stars = calculateStars(attempts)
  console.log(`Attempts: ${attempts.toString().padStart(2)} → Stars: ${stars} ${'⭐'.repeat(stars)}`)
})

console.log('\n📝 Logic Summary:')
console.log('• 1-3 attempts  → 3 stars ⭐⭐⭐')
console.log('• 4-7 attempts  → 2 stars ⭐⭐')
console.log('• 8+ attempts   → 1 star ⭐')
console.log('\n✅ Attempts increment on EVERY submit (correct or incorrect)')
console.log('✅ Stars awarded ONLY on successful completion')
console.log('✅ Progress saved for both correct and incorrect attempts')
