'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import Link from 'next/link';
import { ArrowLeft, Mail, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Company {
  _id: string;
  name: string;
  email: string;
  industry?: string;
  employeeCount?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getById(companyId);
      setCompany(res.data.company || res.data);
    } catch (error: any) {
      console.error('Failed to load company', error);
      toast.error(error.response?.data?.error || 'Failed to load company');
      router.push('/admin/companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchCompany();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const handleDelete = async () => {
    if (!companyId) return;
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      setDeleting(true);
      await companyAPI.delete(companyId);
      toast.success('Company deleted successfully');
      router.push('/admin/companies');
    } catch (error: any) {
      console.error('Failed to delete company', error);
      toast.error(error.response?.data?.error || 'Failed to delete company');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/companies')}
              className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Companies
            </button>
          </div>
          {company && (
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/mail?companyId=${company._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 border border-blue-100"
              >
                <Mail className="w-4 h-4" />
                Send Survey Mail
              </Link>
              <Link
                href={`/admin/companies/${company._id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 border border-indigo-100"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 border border-red-100 disabled:opacity-60"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>

        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {company ? company.name : 'Company details'}
          </h1>
          <p className="mt-2 text-gray-500 text-sm">
            View organization profile and manage communication for the diagnostic.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {loading ? (
            <p className="text-sm text-gray-500">Loading company details...</p>
          ) : !company ? (
            <p className="text-sm text-gray-500">Company not found.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Company Name</p>
                  <p className="text-sm text-gray-900">{company.name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Contact Email</p>
                  <p className="text-sm text-gray-900">{company.email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Industry</p>
                  <p className="text-sm text-gray-900">{company.industry || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Total Employees</p>
                  <p className="text-sm text-gray-900">
                    {typeof company.employeeCount === 'number'
                      ? company.employeeCount
                      : company.employeeCount ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Status</p>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                    {company.status || 'active'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Created At</p>
                  <p className="text-sm text-gray-900">
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleString()
                      : '-'}
                  </p>
                </div>
                {company.updatedAt && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Last Updated</p>
                    <p className="text-sm text-gray-900">
                      {new Date(company.updatedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


