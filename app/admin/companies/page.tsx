'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { Mail, Edit, Eye, Trash2, Plus } from 'lucide-react';

interface Company {
  _id: string;
  name: string;
  email: string;
  industry?: string;
  employeeCount?: number;
  status?: string;
  createdAt?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getAll();
      setCompanies(res.data.companies || []);
    } catch (error: any) {
      console.error('Failed to load companies', error);
      toast.error(error.response?.data?.error || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      await companyAPI.delete(id);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
      toast.success('Company deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete company');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage organizations participating in the Organization Health Diagnostic.
            </p>
          </div>
          <Link
            href="/admin/companies/add"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            Add New Company
          </Link>
        </div>

        {/* Create company */}


        {/* Companies table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Company list</h2>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          {companies.length === 0 && !loading ? (
            <p className="text-sm text-gray-500">No companies found yet. Add the first one above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Industry</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Employees</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Created</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {companies.map((c) => (
                    <tr key={c._id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-gray-600">{c.email}</td>
                      <td className="px-4 py-2 text-gray-600">{c.industry || '-'}</td>
                      <td className="px-4 py-2 text-gray-600">{c.employeeCount ?? '-'}</td>
                      <td className="px-4 py-2">
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          {c.status || 'active'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/mail?companyId=${c._id}`}
                            className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                            title="Send survey mail"
                          >
                            <Mail className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/companies/${c._id}/edit`}
                            className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                            title="Edit company"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/companies/${c._id}`}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(c._id)}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 bg-white border border-gray-200 rounded-lg shadow-sm transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


