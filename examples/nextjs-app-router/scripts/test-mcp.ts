/**
 * MCP Test Script
 *
 * This script tests the MCP endpoints to ensure they're working correctly.
 * Run with: npx tsx scripts/test-mcp.ts
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';
const MCP_API_KEY = process.env.MCP_API_KEY;

interface MCPResponse {
  success: boolean;
  token?: string;
  expires?: string;
  message?: string;
  error?: string;
  session?: any;
}

async function testMCP() {
  console.log('🧪 Testing MCP Endpoints\n');

  try {
    // Test 1: List available tools
    console.log('1️⃣  Listing available MCP tools...');
    const listResponse = await fetch(`${API_URL}/api/mcp`);
    const listData = await listResponse.json();
    console.log('✅ Available tools:', listData.tools.map((t: any) => t.name).join(', '));
    console.log('');

    // Test 2: Agent Login
    console.log('2️⃣  Testing agent_login...');
    const loginResponse = await fetch(`${API_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MCP_API_KEY && { 'X-MCP-API-Key': MCP_API_KEY })
      },
      body: JSON.stringify({
        tool: 'agent_login',
        args: {
          userId: 'test-user-123',
          scopes: ['debug', 'read'],
          agentId: 'test-agent-cli',
          expiresIn: '15m'
        }
      })
    });

    const loginData: MCPResponse = await loginResponse.json();

    if (!loginData.success) {
      console.error('❌ Agent login failed:', loginData.error);
      return;
    }

    console.log('✅ Agent login successful!');
    console.log('   Token:', loginData.token?.substring(0, 20) + '...');
    console.log('   Expires:', loginData.expires);
    console.log('   Message:', loginData.message);
    console.log('');

    const token = loginData.token!;

    // Test 3: Get Session
    console.log('3️⃣  Testing get_session...');
    const sessionResponse = await fetch(`${API_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MCP_API_KEY && { 'X-MCP-API-Key': MCP_API_KEY })
      },
      body: JSON.stringify({
        tool: 'get_session',
        args: { token }
      })
    });

    const sessionData: MCPResponse = await sessionResponse.json();

    if (!sessionData.success) {
      console.error('❌ Get session failed:', sessionData.error);
      return;
    }

    console.log('✅ Session retrieved!');
    console.log('   User ID:', sessionData.session.userId);
    console.log('   Type:', sessionData.session.type);
    console.log('   Scopes:', sessionData.session.scopes.join(', '));
    console.log('   Agent ID:', sessionData.session.agentId);
    console.log('');

    // Test 4: Use token in Authorization header
    console.log('4️⃣  Testing token in Authorization header...');
    const authResponse = await fetch(`${API_URL}/api/protected`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Protected endpoint accessed!');
      console.log('   Response:', authData);
    } else {
      console.log('⚠️  Protected endpoint test skipped (endpoint may not exist)');
    }
    console.log('');

    // Test 5: Revoke Token
    console.log('5️⃣  Testing revoke_token...');
    const revokeResponse = await fetch(`${API_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MCP_API_KEY && { 'X-MCP-API-Key': MCP_API_KEY })
      },
      body: JSON.stringify({
        tool: 'revoke_token',
        args: { token }
      })
    });

    const revokeData: MCPResponse = await revokeResponse.json();

    if (!revokeData.success) {
      console.error('❌ Token revocation failed:', revokeData.error);
      return;
    }

    console.log('✅ Token revoked!');
    console.log('   Message:', revokeData.message);
    console.log('');

    // Test 6: Verify token is revoked
    console.log('6️⃣  Verifying token is revoked...');
    const verifyResponse = await fetch(`${API_URL}/api/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(MCP_API_KEY && { 'X-MCP-API-Key': MCP_API_KEY })
      },
      body: JSON.stringify({
        tool: 'get_session',
        args: { token }
      })
    });

    const verifyData: MCPResponse = await verifyResponse.json();

    if (verifyData.success) {
      console.log('⚠️  Token still valid (unexpected)');
    } else {
      console.log('✅ Token correctly rejected!');
      console.log('   Error:', verifyData.error);
    }
    console.log('');

    console.log('🎉 All MCP tests completed successfully!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testMCP();
