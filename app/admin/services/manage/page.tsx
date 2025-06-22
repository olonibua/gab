'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { databaseService } from '@/lib/database';
import { Service, ServiceType } from '@/lib/types';
import { formatNairaFromKobo, convertNairaToKobo } from '@/lib/validations';
import { withAuth } from '@/lib/context/AuthContext';

function ServiceManagementPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
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

  const lagosAreas = [
    'Lagos Island', 'Victoria Island', 'Ikoyi', 'Lekki', 'Ikeja', 
    'Surulere', 'Yaba', 'Gbagada', 'Magodo', 'Ojodu', 'Alaba', 
    'Festac', 'Isolo', 'Mushin', 'Oshodi', 'Apapa'
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await databaseService.getActiveServices();
      if (response.success && response.data) {
        setServices(response.data);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          await loadServices();
          resetServiceForm();
          alert('Service updated successfully!');
        } else {
          alert(`Failed to update service: ${response.error}`);
        }
      } else {
        const response = await databaseService.createService(serviceData);
        if (response.success) {
          await loadServices();
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
        await loadServices();
      } else {
        alert(`Failed to update service status: ${response.error}`);
      }
    } catch (error) {
      console.error('Failed to toggle service status:', error);
      alert('Failed to update service status');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
            <p className="text-gray-600">Create and manage laundry services</p>
          </div>
          <button
            onClick={() => setShowCreateService(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add New Service
          </button>
        </div>

        {/* Service Form Modal */}
        {showCreateService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingService ? 'Edit Service' : 'Create New Service'}
              </h2>
              
              <form onSubmit={handleCreateService} className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Name</label>
                  <input
                    type="text"
                    value={serviceFormData.name}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <select
                    value={serviceFormData.type}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, type: e.target.value as ServiceType }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    {Object.values(ServiceType).map((type) => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={serviceFormData.description}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={3}
                    required
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base Price (₦)</label>
                    <input
                      type="number"
                      value={serviceFormData.basePrice}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price per KG (₦)</label>
                    <input
                      type="number"
                      value={serviceFormData.pricePerKg}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, pricePerKg: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price per Item (₦)</label>
                    <input
                      type="number"
                      value={serviceFormData.pricePerItem}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, pricePerItem: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>

                {/* Service Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      value={serviceFormData.category}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estimated Duration (hours)</label>
                    <input
                      type="number"
                      value={serviceFormData.estimatedDuration}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, estimatedDuration: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                      required
                    />
                  </div>
                </div>

                {/* Available Areas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Areas</label>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                    {lagosAreas.map((area) => (
                      <label key={area} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={serviceFormData.availableAreas.includes(area)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setServiceFormData(prev => ({
                                ...prev,
                                availableAreas: [...prev.availableAreas, area]
                              }));
                            } else {
                              setServiceFormData(prev => ({
                                ...prev,
                                availableAreas: prev.availableAreas.filter(a => a !== area)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">{area}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                  <textarea
                    value={serviceFormData.specialInstructions}
                    onChange={(e) => setServiceFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    rows={2}
                  />
                </div>

                {/* Active Status */}
                <div>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={serviceFormData.isActive}
                      onChange={(e) => setServiceFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Service is active</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetServiceForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-lg shadow">
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
                      <div className="text-sm text-gray-500">{service.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {service.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatNairaFromKobo(service.basePrice)}</div>
                      {service.pricePerKg && (
                        <div className="text-sm text-gray-500">
                          +{formatNairaFromKobo(service.pricePerKg)}/kg
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          service.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {service.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditService(service)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleServiceStatus(service)}
                        className={`${
                          service.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
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
    </div>
  );
}

export default withAuth(ServiceManagementPage, true); 