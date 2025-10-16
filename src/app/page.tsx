export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            KreativLab
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Production-Ready Micro-Agents Platform with Full MCP Integration
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Launch Dashboard
            </button>
            <button className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-lg font-semibold transition-colors">
              Browse Marketplace
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              MCP Protocol Integration
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Full Model Context Protocol support for seamless agent communication and tool integration.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Isolated Execution
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Secure sandboxed environment using isolated-vm with comprehensive security policies.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Real-time Monitoring
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Comprehensive monitoring, logging, and security audit trails for production environments.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Agent Registry
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Discover, publish, and manage micro-agents with version control and marketplace features.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v4.586a1 1 0 01-.293.707l-2 2A1 1 0 0118 8H6a1 1 0 01-.707-.293l-2-2A1 1 0 013 5V1a1 1 0 011-1h2a1 1 0 011 1v3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              TypeScript APIs
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Type-safe tRPC APIs with comprehensive error handling and validation using Zod schemas.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Production Ready
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Built with Prisma, PostgreSQL, Redis, and modern DevOps practices for enterprise deployment.
            </p>
          </div>
        </div>

        {/* Architecture Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Platform Architecture
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Agent Registry</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Centralized discovery and management</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">MCP Gateway</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Protocol integration layer</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Execution Engine</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Sandboxed runtime environment</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-yellow-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Security Layer</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">Authentication & monitoring</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-indigo-600 mb-2">100%</div>
            <div className="text-gray-600 dark:text-gray-300">MCP Compatible</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">∞</div>
            <div className="text-gray-600 dark:text-gray-300">Scalable Agents</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">99.9%</div>
            <div className="text-gray-600 dark:text-gray-300">Uptime SLA</div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">24/7</div>
            <div className="text-gray-600 dark:text-gray-300">Monitoring</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Built with Next.js 15, TypeScript, Prisma, and isolated-vm
          </p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Documentation</a>
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">API Reference</a>
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">GitHub</a>
            <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Support</a>
          </div>
        </div>
      </div>
    </div>
  );
}
