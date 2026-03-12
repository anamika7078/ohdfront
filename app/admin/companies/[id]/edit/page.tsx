'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import Link from 'next/link';
import { ArrowLeft, Building2, Mail, Briefcase, Users } from 'lucide-react';
import toast from 'react-hot-toast';

interface Company {
  _id: string;
  name: string;
  email: string;
  industry?: string;
  employeeCount?: number;
  status?: string;
}

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params?.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [employeeCount, setEmployeeCount] = useState<number | ''>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await companyAPI.getById(companyId);
      const data: Company = res.data.company || res.data;
      setCompany(data);
      setName(data.name);
      setEmail(data.email);
      setIndustry(data.industry || '');
      setEmployeeCount(
        typeof data.employeeCount === 'number' ? data.employeeCount : data.employeeCount || ''
      );
      setStatus((data.status as 'active' | 'inactive') || 'active');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      setSaving(true);
      await companyAPI.update(companyId, {
        name,
        email,
        industry: industry || undefined,
        employeeCount: employeeCount === '' ? undefined : employeeCount,
        status,
      });
      toast.success('Company updated successfully');
      router.push(`/admin/companies/${companyId}`);
    } catch (error: any) {
      console.error('Failed to update company', error);
      toast.error(error.response?.data?.error || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/companies/${companyId}`}
            className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Company
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Edit Company
          </h1>
          <p className="mt-2 text-gray-500">
            Update organization details used across reports and survey communication.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {loading && !company ? (
            <p className="text-sm text-gray-500">Loading company...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building2 className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                      placeholder="e.g. Acme Corporation"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Industry
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                      placeholder="e.g. Information Technology"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Employees
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Users className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={employeeCount}
                      onChange={(e) =>
                        setEmployeeCount(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-gray-200 pl-10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                      placeholder="e.g. 250"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 focus:bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-4 border-t border-gray-100 mt-6">
                <Link
                  href={`/admin/companies/${companyId}`}
                  className="px-6 py-2.5 rounded-xl text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


