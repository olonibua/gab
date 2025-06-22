'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { databaseService } from '@/lib/database';
import { Order, OrderItem, Service, PaymentStatus } from '@/lib/types';
import OrderReceipt from '@/components/OrderReceipt';
import Link from 'next/link';

function ReceiptPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatusChecks, setPaymentStatusChecks] = useState(0);

  const loadOrderData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      // Load order and items
      const orderResponse = await databaseService.getOrderById(id as string);
      if (!orderResponse.success || !orderResponse.data) {
        setError('Order not found');
        return;
      }

      const { order, items } = orderResponse.data;
      
      // Verify this order belongs to the current user
      if (order.customerId !== user?.$id) {
        setError('Access denied');
        return;
      }

      setOrder(order);
      setOrderItems(items);

      // Load services if not already loaded
      if (services.length === 0) {
        const servicesResponse = await databaseService.getActiveServices();
        if (servicesResponse.success && servicesResponse.data) {
          setServices(servicesResponse.data);
        }
      }

    } catch (error) {
      console.error('Failed to load order data:', error);
      setError('Failed to load order data');
    } finally {
      setIsLoading(false);
      if (showRefreshing) setIsRefreshing(false);
    }
  }, [id, user?.$id, services.length]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadOrderData();
  }, [isAuthenticated, router, loadOrderData]);

  // Auto-refresh payment status for the first few minutes after payment
  useEffect(() => {
    if (!order || order.paymentStatus === PaymentStatus.PAID || paymentStatusChecks >= 10) {
      return;
    }

    // Check if this is coming from payment callback
    const fromPayment = searchParams.get('payment') === 'success';
    
    if (fromPayment || order.paymentStatus === PaymentStatus.PENDING) {
      const interval = setInterval(() => {
        console.log('Checking payment status...');
        loadOrderData(false);
        setPaymentStatusChecks(prev => prev + 1);
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [order, paymentStatusChecks, searchParams, loadOrderData]);

  const handleManualRefresh = () => {
    loadOrderData(true);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested order could not be found.'}</p>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                Gab'z Laundromat
              </Link>
              <span className="text-sm text-gray-500 hidden sm:block">
                Order Receipt
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Status Messages */}
        {order.paymentStatus === PaymentStatus.PAID ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Payment Confirmed & Order Received!
                </h3>
                <p className="mt-1 text-sm text-green-700">
                  Your order #{order.orderNumber} has been paid and confirmed. 
                  {order.deliveryType === 'pickup' 
                    ? ' You can bring this receipt when visiting our store.'
                    : ' We will contact you to confirm the pickup time.'
                  }
                </p>
              </div>
            </div>
          </div>
        ) : order.paymentStatus === PaymentStatus.PENDING ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Payment Pending
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your order #{order.orderNumber} is waiting for payment confirmation.
                    {isRefreshing && " Checking payment status..."}
                  </p>
                </div>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isRefreshing ? 'Checking...' : 'Refresh Status'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Payment Issue
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  There's an issue with your payment for order #{order.orderNumber}. 
                  Please contact support or try paying again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Receipt */}
        <OrderReceipt
          order={order}
          orderItems={orderItems}
          services={services}
          onPrint={handlePrint}
        />

        {/* Actions */}
        <div className="flex justify-center space-x-4 mt-8 print:hidden">
          <Link
            href={`/orders/${order.$id}`}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            View Order Details
          </Link>
          <Link
            href="/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReceiptPageContent />
    </Suspense>
  );
} 