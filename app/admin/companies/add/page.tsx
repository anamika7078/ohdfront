'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { UploadCloud, Building2, Mail, Briefcase, Users, ArrowLeft } from 'lucide-react';

export default function AddCompanyPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [industry, setIndustry] = useState('');
    const [employeeCount, setEmployeeCount] = useState<number | ''>('');
    const [creating, setCreating] = useState(false);

    // File upload state
    const [fileName, setFileName] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) {
            toast.error('Name and email are required');
            return;
        }

        try {
            setCreating(true);
            await companyAPI.create({
                name,
                email,
                industry: industry || undefined,
                employeeCount: employeeCount || undefined,
            });
            toast.success('Company created');
            router.push('/admin/companies');
        } catch (error: any) {
            console.error('Failed to create company', error);
            toast.error(error.response?.data?.error || 'Failed to create company');
        } finally {
            setCreating(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4">
                    <Link href="/admin/companies" className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to Companies
                    </Link>
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Add New Company</h1>
                    <p className="mt-2 text-gray-500">
                        Enter the details below to create a new organization profile for the diagnostic tool.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Email *</label>
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
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
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Total Employees</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Users className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="number"
                                        min={0}
                                        value={employeeCount}
                                        onChange={(e) => setEmployeeCount(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full rounded-xl border border-gray-200 pl-10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-gray-50 focus:bg-white"
                                        placeholder="e.g. 250"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Upload Section */}
                        <div className="pt-4 border-t border-gray-100 mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Supporting Document</label>
                            <input
                                type="file"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 hover:border-indigo-300 transition-colors group"
                            >
                                <div className="bg-indigo-100 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-6 h-6 text-indigo-600" />
                                </div>
                                {fileName ? (
                                    <div>
                                        <p className="text-sm font-medium text-indigo-700">{fileName}</p>
                                        <p className="text-xs text-gray-500 mt-1">Click to replace document</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX up to 10MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-8 flex justify-end gap-4 border-t border-gray-100 mt-6">
                            <Link
                                href="/admin/companies"
                                className="px-6 py-2.5 rounded-xl text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={creating}
                                className="inline-flex items-center px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-sm hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creating...' : 'Create Company'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
