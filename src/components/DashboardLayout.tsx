'use client'

import { useState } from 'react'
import {
  Phone,
  Ticket,
  Building2,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Menu,
  X,
  LogOut
} from 'lucide-react'

interface DashboardStats {
  totalCalls: number
  totalTickets: number
  activePractices: number
  monthlyRevenue: number
  openTickets: number
  resolvedTickets: number
  urgentTickets: number
  recentCalls: number
}

const mockStats: DashboardStats = {
  totalCalls: 156,
  totalTickets: 23,
  activePractices: 4,
  monthlyRevenue: 8500,
  openTickets: 8,
  resolvedTickets: 15,
  urgentTickets: 3,
  recentCalls: 12
}

const mockRecentActivity = [
  { id: 1, type: 'call', description: 'Inbound call from Smile Dental Care', time: '2 mins ago', status: 'completed' },
  { id: 2, type: 'ticket', description: 'Insurance claim submission - Delta Dental', time: '15 mins ago', status: 'in_progress' },
  { id: 3, type: 'call', description: 'Emergency appointment scheduling', time: '32 mins ago', status: 'completed' },
  { id: 4, type: 'ticket', description: 'Billing system integration support', time: '1 hour ago', status: 'urgent' },
  { id: 5, type: 'call', description: 'Post-surgery follow-up call', time: '2 hours ago', status: 'completed' },
]

const mockPractices = [
  { name: 'Smile Dental Care', serviceLevel: 'Premium', status: 'active', lastContact: '2 hours ago' },
  { name: 'Family Dentistry Plus', serviceLevel: 'Standard', status: 'active', lastContact: '4 hours ago' },
  { name: 'Advanced Oral Surgery', serviceLevel: 'Enterprise', status: 'active', lastContact: '1 day ago' },
  { name: 'Bright Smiles Orthodontics', serviceLevel: 'Basic', status: 'active', lastContact: '2 days ago' },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <h1 className="text-xl font-bold text-blue-600">KreativLab CRM</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-6 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main</p>
          </div>
          <a href="#" className="flex items-center px-6 py-3 text-gray-700 bg-blue-50 border-r-4 border-blue-500">
            <TrendingUp size={20} className="mr-3" />
            Dashboard
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Building2 size={20} className="mr-3" />
            Practices
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Phone size={20} className="mr-3" />
            Call Center
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Ticket size={20} className="mr-3" />
            Support Tickets
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <DollarSign size={20} className="mr-3" />
            Billing
          </a>
          <a href="#" className="flex items-center px-6 py-3 text-gray-600 hover:bg-gray-50">
            <Users size={20} className="mr-3" />
            Team
          </a>
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              HT
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">Happy Teeth Support</p>
              <p className="text-xs text-gray-500">htsscrm</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('auth')
              window.location.href = '/login'
            }}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
          >
            <LogOut size={16} className="mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Navigation */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4"
              >
                <Menu size={24} />
              </button>
              <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome back, Happy Teeth Support Services
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                HT
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Calls Today</p>
                  <p className="text-2xl font-bold text-gray-900">{mockStats.totalCalls}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12% from yesterday</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{mockStats.openTickets}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-600">{mockStats.urgentTickets} urgent</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Practices</p>
                  <p className="text-2xl font-bold text-gray-900">{mockStats.activePractices}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600">All systems operational</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${mockStats.monthlyRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8% this month</span>
              </div>
            </div>
          </div>

          {/* Recent Activity & Practice Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockRecentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'urgent' ? 'bg-red-100' :
                        activity.status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        {activity.type === 'call' ? (
                          <Phone className={`w-4 h-4 ${
                            activity.status === 'urgent' ? 'text-red-600' :
                            activity.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        ) : (
                          <Ticket className={`w-4 h-4 ${
                            activity.status === 'urgent' ? 'text-red-600' :
                            activity.status === 'in_progress' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {activity.status === 'urgent' && <AlertCircle className="w-5 h-5 text-red-500" />}
                        {activity.status === 'in_progress' && <Clock className="w-5 h-5 text-yellow-500" />}
                        {activity.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Practice Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Practice Status</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockPractices.map((practice, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{practice.name}</p>
                          <p className="text-xs text-gray-500">{practice.serviceLevel} Plan</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-500">Active</span>
                        </div>
                        <p className="text-xs text-gray-400">{practice.lastContact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}