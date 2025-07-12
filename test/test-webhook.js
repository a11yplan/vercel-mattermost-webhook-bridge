const testPayloads = {
  deployment: {
    type: "deployment",
    payload: {
      deployment: {
        id: "dpl_test123",
        url: "my-app-abc123.vercel.app",
        name: "my-app",
        target: "production",
        ready: false,
        meta: {
          githubCommitRef: "main",
          githubCommitMessage: "Add new feature",
          githubCommitAuthorLogin: "johndoe",
          githubCommitSha: "abc123def456"
        }
      },
      project: {
        id: "prj_test123",
        name: "my-awesome-app"
      },
      team: {
        id: "team_test123",
        name: "My Team"
      }
    },
    createdAt: new Date().toISOString()
  },
  deploymentReady: {
    type: "deployment-ready",
    payload: {
      deployment: {
        id: "dpl_test456",
        url: "my-app-xyz789.vercel.app",
        name: "my-app",
        target: "production",
        ready: true,
        meta: {
          githubCommitMessage: "Fix bug in user authentication"
        }
      },
      project: {
        id: "prj_test456",
        name: "my-awesome-app"
      }
    },
    createdAt: new Date().toISOString()
  },
  deploymentError: {
    type: "deployment-error",
    payload: {
      deployment: {
        id: "dpl_test789",
        name: "my-app",
        target: "production",
        errorMessage: "Build failed: Module not found",
        meta: {
          githubCommitRef: "feature/new-ui"
        }
      },
      project: {
        id: "prj_test789",
        name: "my-awesome-app"
      }
    },
    createdAt: new Date().toISOString()
  }
};

async function testWebhook(payload) {
  console.log('Testing webhook with payload type:', payload.type);
  console.log('Sending to: http://localhost:8787/webhook');
  
  try {
    const response = await fetch('http://localhost:8787/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
    console.log('---');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Vercel webhook conversions...\n');
  console.log('Make sure to run "npm run dev" in another terminal first!\n');
  console.log('Also ensure MATTERMOST_WEBHOOK_URL is set in .dev.vars\n');
  
  for (const [name, payload] of Object.entries(testPayloads)) {
    await testWebhook(payload);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('✅ Tests completed!');
}

runTests();