'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { databaseService } from '@/lib/database';
import { User, AdminUser, Order, OrderStatus, Service, ServiceType, UserRole } from '@/lib/types';
import { formatNairaFromKobo, convertNairaToKobo } from '@/lib/validations';
import { authService } from '@/lib/auth';
import { responsiveClasses as rc } from '@/lib/animations';
import Link from 'next/link';

// Interface for customer with calculated stats
interface CustomerWithStats extends User {
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  status: 'active' | 'inactive';
}

// Interface for staff with calculated stats
interface StaffWithStats extends AdminUser {
  ordersHandled: number;
  performance: number;
  status: 'active' | 'on-leave' | 'inactive';
}

export default function OwnerDashboard() {
  const { user, userRole, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real data states
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [staff, setStaff] = useState<StaffWithStats[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    activeCustomers: 0,
    pendingOrders: 0,
    completedOrders: 0,
    averageOrderValue: 0,
    customerSatisfaction: 4.8,
    totalStaff: 0,
    activeStaff: 0
  });

  // Service management states
  const [showCreateService, setShowCreateService] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    name: '',
    type: ServiceType.WASH_AND_FOLD,
    description: '',
    basePrice: '',
    pricePerKg: '',
    pricePerItem: '',
    estimatedDuration: '',
    category: '',
    displayOrder: '',
    availableAreas: [] as string[],
    tags: [] as string[],
    specialInstructions: '',
    isActive: true
  });

  // Staff registration states
  const [showCreateStaff, setShowCreateStaff] = useState(false);
  const [staffFormData, setStaffFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.STAFF,
    employeeId: '',
    hireDate: new Date().toISOString().split('T')[0],
    permissions: [] as string[],
    assignedAreas: [] as string[],
    workingHours: {
      start: '08:00',
      end: '17:00'
    },
    workingDays: [] as string[]
  });

  const availablePermissions = [
    'view_orders',
    'manage_orders',
    'view_customers',
    'manage_customers',
    'view_services',
    'manage_services',
    'view_reports',
    'manage_staff'
  ];

  const workingDaysOptions = [
    'monday', 'tuesday', 'wednesday', 'thursday', 
    'friday', 'saturday', 'sunday'
  ];

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is an owner
    if (!user) {
      router.push('/owner/login');
      return;
    }

    if (!userRole || userRole !== UserRole.OWNER) {
      router.push('/login');
      return;
    }

    setIsLoading(false);
    
    // Load real data here
    loadDashboardData();
  }, [user, userRole, router]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load customers data
      await loadCustomersData();
      
      // Load staff data
      await loadStaffData();
      
      // Load orders data
      await loadOrdersData();
      
      // Load services data
      await loadServicesData();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomersData = async () => {
    try {
      const customersResponse = await databaseService.getAllUsers();
      if (customersResponse.success && customersResponse.data) {
        // All users in the users collection are customers by default
        const customerUsers = customersResponse.data;
        
        // Get order statistics for each customer
        const customersWithStats = await Promise.all(
          customerUsers.map(async (customer): Promise<CustomerWithStats> => {
            const ordersResponse = await databaseService.getOrdersByCustomer(customer.$id);
            
            let totalOrders = 0;
            let totalSpent = 0;
            let lastOrderDate: string | undefined;
            
            if (ordersResponse.success && ordersResponse.data) {
              totalOrders = ordersResponse.data.length;
              totalSpent = ordersResponse.data.reduce((sum, order) => sum + order.finalAmount, 0);
              
              // Find most recent order
              if (ordersResponse.data.length > 0) {
                const sortedOrders = ordersResponse.data.sort((a, b) => 
                  new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
                );
                lastOrderDate = sortedOrders[0].$createdAt;
              }
            }
            
            // Determine if customer is active (ordered in last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const isActive = lastOrderDate ? new Date(lastOrderDate) > thirtyDaysAgo : false;
            
            return {
              ...customer,
              totalOrders,
              totalSpent,
              lastOrderDate,
              status: isActive ? 'active' : 'inactive'
            };
          })
        );
        
        setCustomers(customersWithStats);
        
        // Update stats
        const activeCustomers = customersWithStats.filter(c => c.status === 'active').length;
        setStats(prev => ({ ...prev, activeCustomers }));
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadStaffData = async () => {
    try {
      const staffResponse = await databaseService.getAllAdminUsers();
      if (staffResponse.success && staffResponse.data) {
        const staffWithStats: StaffWithStats[] = staffResponse.data.map(member => ({
          ...member,
          ordersHandled: member.totalOrdersHandled || 0,
          performance: member.averageRating || 4.5,
          status: member.isActive ? 'active' : 'inactive'
        }));
        
        setStaff(staffWithStats);
        
        // Update stats
        const activeStaff = staffWithStats.filter(s => s.status === 'active').length;
        setStats(prev => ({ 
          ...prev, 
          totalStaff: staffWithStats.length,
          activeStaff 
        }));
      }
    } catch (error) {
      console.error('Failed to load staff:', error);
    }
  };

  const loadOrdersData = async () => {
    try {
      // Load recent orders
      const pendingResponse = await databaseService.getOrdersByStatus(OrderStatus.PENDING, 10);
      if (pendingResponse.success && pendingResponse.data) {
        setRecentOrders(pendingResponse.data);
      }
      
      // Load order statistics
      const [
        allPendingResponse,
        inProgressResponse,
        completedResponse
      ] = await Promise.all([
        databaseService.getOrdersByStatus(OrderStatus.PENDING),
        databaseService.getOrdersByStatus(OrderStatus.IN_PROGRESS),
        databaseService.getOrdersByStatus(OrderStatus.DELIVERED)
      ]);
      
      const pendingCount = allPendingResponse.data?.length || 0;
      const inProgressCount = inProgressResponse.data?.length || 0;
      const completedCount = completedResponse.data?.length || 0;
      const totalOrders = pendingCount + inProgressCount + completedCount;
      
      // Calculate total revenue from completed orders
      const totalRevenue = completedResponse.data?.reduce((sum, order) => sum + order.finalAmount, 0) || 0;
      
      // Calculate average order value
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Calculate monthly revenue (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyRevenue = completedResponse.data?.filter(order => 
        new Date(order.$createdAt) > thirtyDaysAgo
      ).reduce((sum, order) => sum + order.finalAmount, 0) || 0;
      
      setStats(prev => ({
        ...prev,
        totalRevenue,
        monthlyRevenue,
        totalOrders,
        pendingOrders: pendingCount,
        completedOrders: completedCount,
        averageOrderValue
      }));
      
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const loadServicesData = async () => {
    try {
      const servicesResponse = await databaseService.getActiveServices();
      if (servicesResponse.success && servicesResponse.data) {
        setServices(servicesResponse.data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    }
  };

  const lagosAreas = [
    'Lagos Island', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja', 
    'Surulere', 'Yaba', 'Gbagada', 'Magodo', 'Ojodu', 'Alaba', 
    'Festac', 'Isolo', 'Mushin', 'Oshodi', 'Apapa'
  ];

  const resetServiceForm = () => {
    setServiceFormData({
      name: '',
      type: ServiceType.WASH_AND_FOLD,
      description: '',
      basePrice: '',
      pricePerKg: '',
      pricePerItem: '',
      estimatedDuration: '',
      category: '',
      displayOrder: '',
      availableAreas: [],
      tags: [],
      specialInstructions: '',
      isActive: true
    });
    setEditingService(null);
    setShowCreateService(false);
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const serviceData = {
        name: serviceFormData.name,
        type: serviceFormData.type,
        description: serviceFormData.description,
        basePrice: convertNairaToKobo(parseFloat(serviceFormData.basePrice)),
        pricePerKg: serviceFormData.pricePerKg ? convertNairaToKobo(parseFloat(serviceFormData.pricePerKg)) : undefined,
        pricePerItem: serviceFormData.pricePerItem ? convertNairaToKobo(parseFloat(serviceFormData.pricePerItem)) : undefined,
        estimatedDuration: parseInt(serviceFormData.estimatedDuration),
        category: serviceFormData.category,
        displayOrder: parseInt(serviceFormData.displayOrder) || 0,
        availableAreas: serviceFormData.availableAreas,
        tags: serviceFormData.tags,
        specialInstructions: serviceFormData.specialInstructions,
        isActive: serviceFormData.isActive,
        minOrderValue: 0,
        maxOrderValue: 10000000 // ₦100,000 default max
      };

      if (editingService) {
        const response = await databaseService.updateService(editingService.$id, serviceData);
        if (response.success) {
          await loadServicesData();
          resetServiceForm();
          alert('Service updated successfully!');
        } else {
          alert(`Failed to update service: ${response.error}`);
        }
      } else {
        const response = await databaseService.createService(serviceData);
        if (response.success) {
          await loadServicesData();
          resetServiceForm();
          alert('Service created successfully!');
        } else {
          alert(`Failed to create service: ${response.error}`);
        }
      }
    } catch (error) {
      console.error('Service operation failed:', error);
      alert('Failed to save service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditService = (service: Service) => {
    setServiceFormData({
      name: service.name,
      type: service.type,
      description: service.description,
      basePrice: (service.basePrice / 100).toString(),
      pricePerKg: service.pricePerKg ? (service.pricePerKg / 100).toString() : '',
      pricePerItem: service.pricePerItem ? (service.pricePerItem / 100).toString() : '',
      estimatedDuration: service.estimatedDuration.toString(),
      category: service.category,
      displayOrder: service.displayOrder.toString(),
      availableAreas: service.availableAreas,
      tags: service.tags,
      specialInstructions: service.specialInstructions || '',
      isActive: service.isActive
    });
    setEditingService(service);
    setShowCreateService(true);
  };

  const handleToggleServiceStatus = async (service: Service) => {
    try {
      const response = await databaseService.updateService(service.$id, {
        isActive: !service.isActive
      });
      if (response.success) {
        await loadServicesData();
      } else {
        alert(`Failed to update service status: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle service status:', error);
      alert('Failed to update service status');
    }
  };

  // Staff registration functions
  const resetStaffForm = () => {
    setStaffFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: UserRole.STAFF,
      employeeId: '',
      hireDate: new Date().toISOString().split('T')[0],
      permissions: [],
      assignedAreas: [],
      workingHours: {
        start: '08:00',
        end: '17:00'
      },
      workingDays: []
    });
    setShowCreateStaff(false);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      // Validation
      if (staffFormData.permissions.length === 0) {
        alert('Please select at least one permission');
        return;
      }
      if (staffFormData.assignedAreas.length === 0) {
        alert('Please select at least one assigned area');
        return;
      }
      if (staffFormData.workingDays.length === 0) {
        alert('Please select at least one working day');
        return;
      }

      const response = await authService.registerAdmin({
        email: staffFormData.email,
        password: staffFormData.password,
        firstName: staffFormData.firstName,
        lastName: staffFormData.lastName,
        phone: staffFormData.phone,
        role: staffFormData.role,
        permissions: staffFormData.permissions,
        assignedAreas: staffFormData.assignedAreas,
        workingHours: staffFormData.workingHours,
        workingDays: staffFormData.workingDays,
        employeeId: staffFormData.employeeId,
        hireDate: staffFormData.hireDate
      });

      if (response.success) {
        await loadStaffData();
        resetStaffForm();
        alert('Staff member created successfully! They can now login at /admin/login');
      } else {
        alert(`Failed to create staff member: ${response.error}`);
      }
    } catch (error) {
      console.error('Staff creation failed:', error);
      alert('Failed to create staff member');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/owner/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <div className={`${rc.grid} mb-8`}>
        <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatNairaFromKobo(stats.totalRevenue)}</p>
              <p className="text-sm text-gray-500">
                {formatNairaFromKobo(stats.monthlyRevenue)} this month
              </p>
            </div>
          </div>
        </div>

        <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-sm text-gray-500">
                {((stats.completedOrders / stats.totalOrders) * 100).toFixed(1)}% completion rate
              </p>
            </div>
          </div>
        </div>

        <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Staff Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeStaff}/{stats.totalStaff}</p>
              <p className="text-sm text-gray-500">
                Active team members
              </p>
            </div>
          </div>
        </div>

        <div className={`${rc.card} animate-slideIn`} style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
              <p className="text-sm text-gray-500">
                In the last 30 days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className={`${rc.card} mb-8 animate-fadeIn`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-purple-600 hover:text-purple-800">
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
                  </tr>
                ))
              ) : (
                recentOrders.map((order, index) => (
                  <tr
                    key={order.$id}
                    className="hover:bg-gray-50 transition-colors duration-200 animate-fadeIn"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === OrderStatus.DELIVERED
                          ? 'bg-green-100 text-green-800'
                          : order.status === OrderStatus.PENDING
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNairaFromKobo(order.finalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.$createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderCustomers = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Details</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Complete list of all customers and their activity</p>
        </div>
        <div className="flex space-x-2">
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            Active: {customers.filter(c => c.status === 'active').length}
          </span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
            Inactive: {customers.filter(c => c.status === 'inactive').length}
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer) => (
              <tr key={customer.$id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      Joined: {new Date(customer.$createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{customer.email}</div>
                  <div className="text-sm text-gray-500">
                    {customer.phone?.number || 'No phone'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {customer.totalOrders}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ₦{customer.totalSpent.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => router.push(`/admin/customers/${customer.$id}`)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    View
                  </button>
                  <button className="text-green-600 hover:text-green-900">Contact</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No customers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-6">
      {/* Staff Header */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Staff Management</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Complete list of all staff members and their performance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Active: {staff.filter(s => s.status === 'active').length}
              </span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                Inactive: {staff.filter(s => s.status === 'inactive').length}
              </span>
            </div>
            <button
              onClick={() => setShowCreateStaff(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              + Add Staff
            </button>
          </div>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showCreateStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Add New Staff Member</h3>
            </div>
            
            <form onSubmit={handleCreateStaff} className="px-6 py-4 space-y-4">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={staffFormData.firstName}
                    onChange={(e) => setStaffFormData({...staffFormData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={staffFormData.lastName}
                    onChange={(e) => setStaffFormData({...staffFormData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={staffFormData.email}
                    onChange={(e) => setStaffFormData({...staffFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={staffFormData.phone}
                    onChange={(e) => setStaffFormData({...staffFormData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+234XXXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={staffFormData.password}
                    onChange={(e) => setStaffFormData({...staffFormData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={staffFormData.role}
                    onChange={(e) => setStaffFormData({...staffFormData, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value={UserRole.STAFF}>Staff</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    value={staffFormData.employeeId}
                    onChange={(e) => setStaffFormData({...staffFormData, employeeId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="EMP001"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hire Date *
                  </label>
                  <input
                    type="date"
                    value={staffFormData.hireDate}
                    onChange={(e) => setStaffFormData({...staffFormData, hireDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    value={staffFormData.workingHours.start}
                    onChange={(e) => setStaffFormData({
                      ...staffFormData, 
                      workingHours: { ...staffFormData.workingHours, start: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time *
                  </label>
                  <input
                    type="time"
                    value={staffFormData.workingHours.end}
                    onChange={(e) => setStaffFormData({
                      ...staffFormData, 
                      workingHours: { ...staffFormData.workingHours, end: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permissions *
                </label>
                <div className="grid grid-cols-2 gap-2 border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={staffFormData.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStaffFormData({
                              ...staffFormData,
                              permissions: [...staffFormData.permissions, permission]
                            });
                          } else {
                            setStaffFormData({
                              ...staffFormData,
                              permissions: staffFormData.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{permission.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Assigned Areas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Areas *
                </label>
                <div className="grid grid-cols-3 gap-2 border border-gray-300 rounded-md p-3 max-h-32 overflow-y-auto">
                  {lagosAreas.map((area) => (
                    <label key={area} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={staffFormData.assignedAreas.includes(area)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStaffFormData({
                              ...staffFormData,
                              assignedAreas: [...staffFormData.assignedAreas, area]
                            });
                          } else {
                            setStaffFormData({
                              ...staffFormData,
                              assignedAreas: staffFormData.assignedAreas.filter(a => a !== area)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{area}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Working Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Days *
                </label>
                <div className="grid grid-cols-4 gap-2 border border-gray-300 rounded-md p-3">
                  {workingDaysOptions.map((day) => (
                    <label key={day} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={staffFormData.workingDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setStaffFormData({
                              ...staffFormData,
                              workingDays: [...staffFormData.workingDays, day]
                            });
                          } else {
                            setStaffFormData({
                              ...staffFormData,
                              workingDays: staffFormData.workingDays.filter(d => d !== day)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetStaffForm}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-gray-400"
                >
                  {isLoading ? 'Creating...' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">All Staff Members</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {staff.length} staff member(s) registered
          </p>
        </div>
        
        {isLoading ? (
          <div className="px-6 py-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500">No staff members found. Add your first staff member to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders Handled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map((member) => (
                  <tr key={member.$id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.firstName} {member.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Hired: {new Date(member.hireDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 capitalize">{member.role}</div>
                      <div className="text-sm text-gray-500">ID: {member.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.email}</div>
                      <div className="text-sm text-gray-500">
                        {member.phone?.number || 'No phone'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.ordersHandled}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">{member.performance.toFixed(1)}/5.0</span>
                        <div className="ml-2 flex">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-xs ${i < Math.floor(member.performance) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 
                        member.status === 'on-leave' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                      <button className="text-green-600 hover:text-green-900">Contact</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Services Management</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your laundry services</p>
          </div>
          <button
            onClick={() => setShowCreateService(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            + Add Service
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map((service) => (
                <tr key={service.$id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-500">{service.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{service.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNairaFromKobo(service.basePrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditService(service)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleServiceStatus(service)}
                      className={`${
                        service.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {service.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
              
              <Link href="/owner/dashboard" className="text-2xl font-bold text-purple-600 animate-fadeIn">
                Gab'z Owner
              </Link>
              <span className="text-sm text-gray-500 hidden sm:block animate-fadeIn">
                Business Dashboard
              </span>
            </div>
            
            <div className="hidden lg:flex items-center space-x-4 animate-slideIn">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">Staff Dashboard</Link>
              <Link href="/owner/reports" className="text-gray-600 hover:text-gray-900">Reports</Link>
              <Link href="/owner/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
            </div>

            <div className="flex items-center">
              <div className="relative animate-scaleIn">
                <button
                  onClick={() => {
                    const menu = document.getElementById('owner-menu');
                    menu?.classList.toggle('hidden');
                  }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-medium">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:block">{user?.name}</span>
                </button>
                
                <div id="owner-menu" className="hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 animate-fadeIn">
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
            <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900 py-2">Staff Dashboard</Link>
            <Link href="/owner/reports" className="text-gray-600 hover:text-gray-900 py-2">Reports</Link>
            <Link href="/owner/settings" className="text-gray-600 hover:text-gray-900 py-2">Settings</Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={`${rc.main} ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        <div className={rc.container}>
          {/* Header */}
          <div className="mb-8 animate-fadeIn">
            <h1 className="text-2xl font-bold text-gray-900">Business Overview</h1>
            <p className="text-gray-600">Welcome back, {user?.name}</p>
          </div>

          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'customers', name: 'Customers', icon: '👥' },
                { id: 'staff', name: 'Staff', icon: '👨‍💼' },
                { id: 'services', name: 'Services', icon: '🧺' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'customers' && renderCustomers()}
          {activeTab === 'staff' && renderStaff()}
          {activeTab === 'services' && renderServices()}
        </div>
      </main>
    </div>
  );
}