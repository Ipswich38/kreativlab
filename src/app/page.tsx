import Link from 'next/link'
import { Phone, Shield, BarChart3, Clock, Users, CheckCircle } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <span className="text-xl font-bold text-gray-800">KreativLab</span>
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Dental Administrative Support CRM
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Comprehensive SaaS platform designed specifically for dental administrative support services.
          Manage practice relationships, patient communications, and revenue cycle operations efficiently.
        </p>
        <div className="space-x-4">
          <Link
            href="/dashboard"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors inline-block"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg text-lg hover:bg-blue-50 transition-colors inline-block"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
          Built for Dental Support Services
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Phone className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Call Center Management</h3>
            <p className="text-gray-600">
              Comprehensive call logging, patient support tickets, and communication tracking
              for efficient virtual support operations.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Users className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Practice Management</h3>
            <p className="text-gray-600">
              Manage relationships with dental practices, track service agreements,
              and monitor client satisfaction and performance metrics.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <BarChart3 className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Revenue Cycle Management</h3>
            <p className="text-gray-600">
              Track billing, collections, insurance claims, and financial performance
              with detailed analytics and reporting.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Shield className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">HIPAA Compliance</h3>
            <p className="text-gray-600">
              Built-in security controls, audit trails, and data protection
              to ensure compliance with healthcare regulations.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <Clock className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">24/7 Support Tracking</h3>
            <p className="text-gray-600">
              Round-the-clock patient support management with real-time
              ticket tracking and resolution monitoring.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <CheckCircle className="w-12 h-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-3">Performance Analytics</h3>
            <p className="text-gray-600">
              Detailed dashboards and reports for call center efficiency,
              client satisfaction, and team productivity metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Maximize Practice Efficiency
          </h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Patient Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Call Answer Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">30%</div>
              <div className="text-blue-100">Revenue Increase</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-blue-100">Practices Served</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Ready to Transform Your Dental Support Services?
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Join dental administrative support businesses that are maximizing
          chair time and profitability with KreativLab CRM.
        </p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-700 transition-colors inline-block"
        >
          Start Your Free Trial
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <span className="text-xl font-bold">KreativLab</span>
              </div>
              <p className="text-gray-400">
                Dental Administrative Support CRM platform designed to maximize
                practice efficiency and profitability.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/support" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 KreativLab. Built for dental administrative support services.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
