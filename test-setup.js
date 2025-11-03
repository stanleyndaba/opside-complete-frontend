#!/usr/bin/env node

/**
 * Frontend-Backend Integration Test Script
 * Run with: node test-setup.js
 */

import https from 'https';
import http from 'http';

// Test configuration
const tests = [
    {
        name: 'Production Backend Health',
        url: 'https://clario-complete-backend-mvak.onrender.com/api/health',
        expectedStatus: [200, 404] // 404 is ok if endpoint doesn't exist yet
    },
    {
        name: 'Local Backend Health (if running)',
        url: 'http://localhost:3001/api/health',
        expectedStatus: [200, 404],
        optional: true
    },
    {
        name: 'Production Auth Endpoint',
        url: 'https://clario-complete-backend-mvak.onrender.com/api/auth/me',
        expectedStatus: [200, 401, 403] // Auth endpoints should respond
    }
];

function makeRequest(url) {
    return new Promise((resolve) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });
        
        req.on('error', (error) => {
            resolve({
                status: 0,
                error: error.message
            });
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            resolve({
                status: 0,
                error: 'Request timeout'
            });
        });
    });
}

async function runTest(test) {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    
    const result = await makeRequest(test.url);
    
    if (result.status === 0) {
        if (test.optional) {
            console.log(`   ⚠️  SKIP: ${result.error} (optional test)`);
            return { passed: true, skipped: true };
        } else {
            console.log(`   ❌ FAIL: ${result.error}`);
            return { passed: false, error: result.error };
        }
    }
    
    const statusOk = test.expectedStatus.includes(result.status);
    
    if (statusOk) {
        console.log(`   ✅ PASS: Status ${result.status}`);
        if (result.data) {
            try {
                const json = JSON.parse(result.data);
                console.log(`   📄 Response: ${JSON.stringify(json, null, 2).substring(0, 200)}...`);
            } catch {
                console.log(`   📄 Response: ${result.data.substring(0, 100)}...`);
            }
        }
        return { passed: true };
    } else {
        console.log(`   ❌ FAIL: Status ${result.status} (expected: ${test.expectedStatus.join(' or ')})`);
        return { passed: false, status: result.status };
    }
}

async function main() {
    console.log('🚀 Frontend-Backend Integration Test');
    console.log('=====================================');
    
    const results = [];
    
    for (const test of tests) {
        const result = await runTest(test);
        results.push({ test: test.name, ...result });
    }
    
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const passed = results.filter(r => r.passed && !r.skipped).length;
    const failed = results.filter(r => !r.passed).length;
    const skipped = results.filter(r => r.skipped).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Skipped: ${skipped}`);
    
    if (failed === 0) {
        console.log('\n🎉 All tests passed! Your backend is accessible.');
        console.log('\n📋 Next steps:');
        console.log('   1. Start your frontend: npm run dev');
        console.log('   2. Open the test page: test-fe-be-integration.html');
        console.log('   3. Run the browser tests to verify API integration');
    } else {
        console.log('\n⚠️  Some tests failed. Check your backend deployment.');
        console.log('\n🔧 Troubleshooting:');
        console.log('   - Ensure your backend is deployed and running');
        console.log('   - Check CORS configuration');
        console.log('   - Verify API endpoints exist');
    }
    
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);