import React, { useEffect, useState } from 'react';
import { Edit2, Save } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface Permission {
  name: string;
  admin: boolean;
  seller: boolean;
  buyer: boolean;
}

interface RolePermissions {
  [key: string]: {
    admin: boolean;
    seller: boolean;
    buyer: boolean;
  };
}

const Roles = () => {
  const [permissions, setPermissions] = useState<Permission[]>([
    { name: 'Products', admin: true, seller: true, buyer: false },
    { name: 'Orders', admin: true, seller: true, buyer: true },
    { name: 'Users', admin: true, seller: false, buyer: false },
    { name: 'Analytics', admin: true, seller: true, buyer: false },
    { name: 'Leads', admin: true, seller: false, buyer: false },
    { name: 'Subscriptions', admin: true, seller: false, buyer: false },
    { name: 'CMS', admin: true, seller: false, buyer: false },
    { name: 'Settings', admin: true, seller: false, buyer: false },
  ]);

  const [editPermissions, setEditPermissions] = useState<Permission[]>(permissions);
  const [showModal, setShowModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleTogglePermission = (permissionName: string, role: 'admin' | 'seller' | 'buyer') => {
    setEditPermissions(
      editPermissions.map((perm) =>
        perm.name === permissionName
          ? { ...perm, [role]: !perm[role] }
          : perm
      )
    );
  };

  const handleSavePermissions = () => {
    setPermissions(editPermissions);
    setShowModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCancel = () => {
    setEditPermissions(permissions);
    setShowModal(false);
  };

  const roleDescriptions = {
    admin: 'Full access to all platform features and settings',
    seller: 'Access to manage products, orders, and analytics',
    buyer: 'Limited access for browsing and purchasing',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Role Based Access Control</h1>
        <p className="text-gray-600 mt-2">Manage user roles and their permissions</p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          Permissions saved successfully!
        </div>
      )}

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['admin', 'seller', 'buyer'].map((role) => {
          const permCount = permissions.filter((p) => p[role as 'admin' | 'seller' | 'buyer']).length;
          return (
            <Card key={role} className="border-2 border-orange-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{role} Role</h3>
                  <p className="text-sm text-gray-600 mt-1">{roleDescriptions[role as keyof typeof roleDescriptions]}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{permCount}</span> permissions enabled
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Permissions Matrix */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Permission Matrix</h2>
          <Button
            onClick={() => {
              setEditPermissions(permissions);
              setShowModal(true);
            }}
            icon={<Edit2 className="w-4 h-4" />}
          >
            Edit Permissions
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Feature</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Admin</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Seller</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Buyer</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission.name} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{permission.name}</td>
                  <td className="px-6 py-4 text-center">
                    {permission.admin ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600">✓</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200">
                        <span className="text-gray-400">✕</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {permission.seller ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600">✓</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200">
                        <span className="text-gray-400">✕</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {permission.buyer ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                        <span className="text-green-600">✓</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200">
                        <span className="text-gray-400">✕</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          ✓ = Permission granted | ✕ = Permission denied
        </div>
      </Card>

      {/* Detailed Permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['admin', 'seller', 'buyer'].map((role) => (
          <Card key={role}>
            <h3 className="text-lg font-semibold text-gray-900 capitalize mb-4">{role} Permissions</h3>
            <div className="space-y-2">
              {permissions
                .filter((p) => p[role as 'admin' | 'seller' | 'buyer'])
                .map((permission) => (
                  <div key={permission.name} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-gray-700">{permission.name}</span>
                  </div>
                ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Permissions Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCancel}
        title="Edit Role Permissions"
      >
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {editPermissions.map((permission) => (
            <div key={permission.name} className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-3">{permission.name}</h3>
              <div className="space-y-2">
                {['admin', 'seller', 'buyer'].map((role) => (
                  <label
                    key={role}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={permission[role as 'admin' | 'seller' | 'buyer']}
                      onChange={() => handleTogglePermission(permission.name, role as 'admin' | 'seller' | 'buyer')}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6 border-t pt-4">
          <Button variant="secondary" onClick={handleCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSavePermissions} className="flex-1">
            Save Permissions
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Roles;
