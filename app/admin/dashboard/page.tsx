'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { databaseService } from '@/lib/database';
import { Order, OrderStatus, Service } from '@/lib/types';
import { formatNairaFromKobo } from '@/lib/validations';
import { withAuth } from '@/lib/context/AuthContext';
import { responsiveClasses as rc } from '@/lib/animations';

function AdminDashboardPage() {
  const { user, isAdmin, userProfile, logout } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    inProgressOrders: 0,
    todayRevenue: 0,
    totalCustomers: 0
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent orders
      const recentOrdersResponse = await databaseService.getOrdersByStatus(OrderStatus.PENDING, 20);
      if (recentOrdersResponse.success && recentOrdersResponse.data) {
        setOrders(recentOrdersResponse.data);
      }

      // Load today's orders
      const today = new Date().toISOString().split('T')[0];
      const todayOrdersResponse = await databaseService.getOrdersByDate(today);
      if (todayOrdersResponse.success && todayOrdersResponse.data) {
        setTodayOrders(todayOrdersResponse.data);
        
        // Calculate today's revenue
        const revenue = todayOrdersResponse.data.reduce((sum, order) => sum + order.finalAmount, 0);
        setStats(prev => ({ ...prev, todayRevenue: revenue }));
      }

      // Load order statistics
      const pendingResponse = await databaseService.getOrdersByStatus(OrderStatus.PENDING);
      const inProgressResponse = await databaseService.getOrdersByStatus(OrderStatus.IN_PROGRESS);
      
      setStats(prev => ({
        ...prev,
        pendingOrders: pendingResponse.data?.length || 0,
        inProgressOrders: inProgressResponse.data?.length || 0,
        totalOrders: (pendingResponse.data?.length || 0) + (inProgressResponse.data?.length || 0)
      }));

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (!user) return;

    try {
      const response = await databaseService.updateOrderStatus(
        orderId,
        newStatus,
        user.$id,
        `Status updated to ${newStatus} by ${user.name}`
      );

      if (response.success) {
        // Refresh data
        loadDashboardData();
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PICKED_UP:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.IN_PROGRESS:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.READY:
        return 'bg-green-100 text-green-800';
      case OrderStatus.DELIVERED:
        return 'bg-gray-100 text-gray-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return '⏳';
      case OrderStatus.PICKED_UP:
        return '🚚';
      case OrderStatus.IN_PROGRESS:
        return '🧽';
      case OrderStatus.READY:
        return '✅';
      case OrderStatus.DELIVERED:
        return '📦';
      case OrderStatus.CANCELLED:
        return '❌';
      default:
        return '📋';
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className={`${rc.header} border-b border-gray-200`}>
        <div className={rc.container}>
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <Link href="/admin/dashboard" className="text-2xl font-bold text-blue-600 animate-fadeIn">
                Gab'z Admin
              </Link>
              <span className="text-sm text-gray-500 hidden sm:block animate-fadeIn">
                Staff Dashboard
              </span>
            </div>
            
            <div className="hidden lg:flex items-center space-x-4 animate-slideIn">
              <Link href="/admin/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>
              <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900">Customers</Link>
              <Link href="/admin/services/manage" className="text-gray-600 hover:text-gray-900">Services</Link>
            </div>

            <div className="flex items-center">
              <div className="relative animate-scaleIn">
                <button
                  onClick={() => {
                    const menu = document.getElementById('admin-menu');
                    menu?.classList.toggle('hidden');
                  }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{user?.name}</span>
                </button>
                
                <div id="admin-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fadeIn">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`${rc.sidebar} bg-white lg:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col py-6 px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Menu</h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-col space-y-4">
            <Link href="/admin/orders" className="text-gray-600 hover:text-gray-900 py-2">Orders</Link>
            <Link href="/admin/customers" className="text-gray-600 hover:text-gray-900 py-2">Customers</Link>
            <Link href="/admin/services/manage" className="text-gray-600 hover:text-gray-900 py-2">Services</Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`${rc.main} ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className={rc.container}>
          {/* Header */}
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>

          {/* Stats Grid */}
          <div className={`${rc.grid} mb-8`}>
            {/* Stats cards with animations */}
            <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </div>

            <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.inProgressOrders}</p>
                </div>
              </div>
            </div>

            <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNairaFromKobo(stats.todayRevenue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`${rc.card} mb-8 animate-fadeIn`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/admin/orders"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="font-medium text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-600">Manage customer orders and track progress</p>
              </Link>
              <Link
                href="/admin/services/manage"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="font-medium text-gray-900">Manage Services</h3>
                <p className="text-sm text-gray-600">Update pricing & availability</p>
              </Link>
              <Link
                href="/admin/customers"
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                <h3 className="font-medium text-gray-900">Customer List</h3>
                <p className="text-sm text-gray-600">View customer information and history</p>
              </Link>
            </div>
          </div>

          {/* Recent Orders */}
          <div className={`${rc.card} animate-fadeIn`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                      </tr>
                    ))
                  ) : (
                    orders.map((order, index) => (
                      <tr
                        key={order.$id}
                        className="hover:bg-gray-50 transition-colors duration-200 animate-fadeIn"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.orderNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)} {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatNairaFromKobo(order.finalAmount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.$createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/admin/orders/${order.$id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(AdminDashboardPage);