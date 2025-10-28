import { createContext, useContext, useState } from 'react';

// Simple test context to isolate the issue
const TestContext = createContext();

const useTestContext = () => {
  const context = useContext(TestContext);
  if (!context) {
    throw new Error('useTestContext must be used within TestProvider');
  }
  return context;
};

const TestProvider = ({ children }) => {
  const [testValue, setTestValue] = useState('Hello World');

  const value = {
    testValue,
    setTestValue,
  };

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>;
};

const TestComponent = () => {
  const { testValue } = useTestContext();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Context Test</h1>
      <p>Test Value: {testValue}</p>
      <p>If you see this, React context is working!</p>
    </div>
  );
};

const TestSimpleAuth = () => {
  return (
    <TestProvider>
      <TestComponent />
    </TestProvider>
  );
};

export default TestSimpleAuth;
