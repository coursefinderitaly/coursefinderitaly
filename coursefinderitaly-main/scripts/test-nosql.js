// Fetch is available globally

async function testNoSQLInjection() {
  console.log("=== Testing NoSQL Injection on Login API ===");
  try {
    const payload = {
      identifier: { "$gt": "" },
      password: { "$gt": "" }
    };
    
    // Using fetch directly as it is mapped in standard Node.js v18+ 
    // If running an older node, this will fail. Let's assume Node 18+ is used for Vite React.
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log(`Status Code: ${res.status}`);
    console.log(`Response: ${text}`);

    if (res.status === 200 || res.status === 201) {
        console.error("VULNERABLE: NoSQL injection succeeded.");
    } else {
        console.log("SECURE: Injection rejected.");
    }
  } catch (err) {
    console.error("Test blocked/failed:", err.message);
  }
}

testNoSQLInjection();
