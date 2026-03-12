'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI, mailAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface MailLog {
  _id: string;
  subject: string;
  status: string;
  totalRecipients?: number;
  successCount?: number;
  failureCount?: number;
  createdAt?: string;
}

interface Company {
  _id: string;
  name: string;
}

export default function MailPage() {
  const searchParams = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [surveyLinkPreview, setSurveyLinkPreview] = useState('');

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await mailAPI.getLogs();
      setLogs(res.data.logs || []);
    } catch (error: any) {
      console.error('Failed to load mail logs', error);
      toast.error(error.response?.data?.error || 'Failed to load mail logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const companyRes = await companyAPI.getAll();
        setCompanies(companyRes.data.companies || []);
        const companyIdFromQuery = searchParams.get('companyId');
        if (companyIdFromQuery) {
          setSelectedCompany(companyIdFromQuery);
        }
      } catch (error: any) {
        console.error('Failed to load companies', error);
        toast.error(error.response?.data?.error || 'Failed to load companies');
      }
      fetchLogs();
    };
    init();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedCompany) {
      setSurveyLinkPreview('');
      return;
    }
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : process.env.NEXT_PUBLIC_SURVEY_URL_BASE || '';
    if (!origin) {
      setSurveyLinkPreview('');
      return;
    }
    setSurveyLinkPreview(`${origin}/survey?companyId=${selectedCompany}`);
  }, [selectedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject || !selectedCompany) {
      toast.error('File, subject and company are required');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject);
    formData.append('companyId', selectedCompany);
    if (surveyLinkPreview) {
      formData.append('surveyLink', surveyLinkPreview);
    }
    const company = companies.find((c) => c._id === selectedCompany);
    if (company) {
      formData.append('companyName', company.name);
    }

    try {
      setSending(true);
      await mailAPI.sendBulk(formData);
      toast.success('Bulk mail sent (processing in background)');
      setSubject('');
      setMessage('');
      setFile(null);
      setSelectedCompany('');
      setSurveyLinkPreview('');
      fetchLogs();
    } catch (error: any) {
      console.error('Failed to send bulk mail', error);
      toast.error(error.response?.data?.error || 'Failed to send bulk mail');
    } finally {
      setSending(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mail Sender</h1>
          <p className="mt-1 text-sm text-gray-600">
            Send bulk survey invitations or reminders and track delivery logs.
          </p>
        </div>

        {/* Bulk mail form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Send bulk email</h2>
          <p className="text-xs text-gray-500">
            Upload a CSV or Excel file containing recipient email addresses. A survey link will be
            included in the email.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Organization Health Diagnostic Survey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Internal note (optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Internal note for this send (not shown to recipients)."
              />
            </div>

            {surveyLinkPreview && (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Survey link preview</p>
                <p className="text-[11px] text-gray-600 break-all">{surveyLinkPreview}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {sending ? 'Sending...' : 'Send bulk email'}
              </button>
            </div>
          </form>
        </div>

        {/* Mail logs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent mail logs</h2>
            {loadingLogs && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          {logs.length === 0 && !loadingLogs ? (
            <p className="text-sm text-gray-500">No mail logs yet.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-start justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{log.subject}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {log.totalRecipients ?? 0} recipients • {log.successCount ?? 0} sent •{' '}
                      {log.failureCount ?? 0} failed
                    </p>
                    {log.createdAt && (
                      <p className="mt-1 text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      log.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : log.status === 'failed'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


