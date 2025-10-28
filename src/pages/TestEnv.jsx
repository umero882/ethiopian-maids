import React from 'react';

const TestEnv = () => {
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  const allEnvVars = import.meta.env;

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Environment Variable Test</h1>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>VITE_STRIPE_PUBLISHABLE_KEY:</h2>
        <p style={{ wordBreak: 'break-all', background: stripeKey ? '#d4edda' : '#f8d7da', padding: '10px', borderRadius: '4px' }}>
          {stripeKey || 'NOT FOUND ❌'}
        </p>
        <p><strong>Type:</strong> {typeof stripeKey}</p>
        <p><strong>Length:</strong> {stripeKey ? stripeKey.length : 0}</p>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2>All VITE Environment Variables:</h2>
        <pre style={{ background: 'white', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify(allEnvVars, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>Expected Key:</h3>
        <code>pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle</code>
      </div>
    </div>
  );
};

export default TestEnv;
