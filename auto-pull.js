const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration
const CHECK_INTERVAL = 10000; // Check every 10 seconds (adjust as needed)
const BRANCH = 'claude/chinese-ayi-tutor-agent-011CUp8xrwpSQXhxsTEN3NyC';

console.log('🔄 Auto-pull service started');
console.log(`📡 Checking for updates every ${CHECK_INTERVAL / 1000} seconds`);
console.log(`🌿 Branch: ${BRANCH}\n`);

async function checkAndPull() {
  try {
    // Fetch latest changes from remote
    await execPromise('git fetch origin');

    // Check if local is behind remote
    const { stdout } = await execPromise(`git rev-list HEAD...origin/${BRANCH} --count`);
    const behindCount = parseInt(stdout.trim());

    if (behindCount > 0) {
      console.log(`\n🆕 ${behindCount} new commit(s) detected!`);
      console.log('⬇️  Pulling changes...');

      const { stdout: pullOutput } = await execPromise(`git pull origin ${BRANCH}`);
      console.log(pullOutput);
      console.log('✅ Pull completed!\n');
    }
  } catch (error) {
    console.error('❌ Error checking for updates:', error.message);
  }
}

// Initial check
checkAndPull();

// Set up periodic checking
setInterval(checkAndPull, CHECK_INTERVAL);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Auto-pull service stopped');
  process.exit(0);
});
