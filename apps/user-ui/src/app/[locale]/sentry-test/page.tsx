'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const [message, setMessage] = useState('');

  const triggerError = () => {
    throw new Error('Test error from User UI - This is intentional!');
  };

  const triggerCustomError = () => {
    Sentry.setTag('test_type', 'custom_frontend');
    Sentry.setContext('test_context', {
      page: '/sentry-test',
      action: 'custom_error_button_click',
      timestamp: new Date().toISOString(),
    });
    throw new Error('Custom test error with context from User UI');
  };

  const captureMessage = () => {
    Sentry.captureMessage('Test message from User UI', 'info');
    setMessage('Message sent to Sentry successfully!');
    setTimeout(() => setMessage(''), 3000);
  };

  const testBackendError = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/sentry-test/error');
      if (!response.ok) {
        setMessage('Backend error triggered (check Sentry dashboard)');
      }
    } catch (error) {
      setMessage(`Backend request failed: ${error}`);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sentry Test Page - User UI
          </h1>
          <p className="text-gray-600 mb-8">
            Use these buttons to test Sentry error tracking for the customer frontend
          </p>

          {message && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{message}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Frontend Error Tests
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={triggerError}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Trigger Basic Error
                </button>
                <button
                  onClick={triggerCustomError}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  Trigger Custom Error
                </button>
                <button
                  onClick={captureMessage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Capture Message
                </button>
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">
                Backend Error Tests
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={testBackendError}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Test Backend Error
                </button>
                <a
                  href="http://localhost:8080/api/sentry-test/health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Backend Health Check
                </a>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-100 rounded-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Testing Instructions:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Make sure you&apos;ve configured SENTRY_DSN in your .env file</li>
                <li>Click any button above to trigger an error or message</li>
                <li>Check your Sentry dashboard to see the error</li>
                <li>
                  Errors should appear under the &quot;tecshop-user-ui&quot; project
                </li>
                <li>Backend errors appear under &quot;tecshop-backend&quot; project</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
