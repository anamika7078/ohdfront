'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI, reportAPI, sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { AxiosError } from 'axios';

interface OverallStats {
  overallPercentage: number;
  ratingDistribution: { A: number; B: number; C: number; D: number; E: number };
  ratingDistributionPercentage: { A: number; B: number; C: number; D: number; E: number };
  totalResponses: number;
  totalCompanies: number;
  bestSection?: {
    sectionId: string;
    sectionName: string;
    percentage: number;
  } | null;
  summaryInsights?: string[];
}

interface SectionStat {
  sectionId: string;
  sectionName: string;
  sectionPercentage: number;
  totalResponses: number;
}

interface RawSectionStat {
  sectionId: string;
  sectionName?: string;
  sectionPercentage?: number;
  totalResponses?: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionStat[]>([]);
  const [companiesCount, setCompaniesCount] = useState(0);
  const [sectionsCount, setSectionsCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [reportRes, companiesRes, sectionsRes] = await Promise.all([
        reportAPI.getOverallReport(),
        companyAPI.getAll(),
        sectionAPI.getAll(),
      ]);

      const reportData = reportRes.data;
      setOverallStats(reportData.overallStats || null);
      
      // Transform section stats for charts
      if (reportData.sectionStats && Array.isArray(reportData.sectionStats)) {
        const rawStats = reportData.sectionStats as RawSectionStat[];
        const transformed = rawStats.map((stat) => ({
          sectionId: stat.sectionId,
          sectionName: stat.sectionName || 'Unknown',
          sectionPercentage: stat.sectionPercentage ?? 0,
          totalResponses: stat.totalResponses ?? 0,
        }));
        setSectionStats(transformed);
      }

      setCompaniesCount(companiesRes.data.companies?.length || 0);
      setSectionsCount(sectionsRes.data.sections?.length || 0);
    } catch (error) {
      const err = error as AxiosError<{ error?: string }>;
      console.error('Failed to load dashboard data', err);
      const message = err.response?.data?.error || err.message || 'Failed to load dashboard data';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Prepare rating distribution data for charts
  const ratingData = overallStats
    ? [
        { name: 'A (Excellent)', value: overallStats.ratingDistribution.A, percentage: overallStats.ratingDistributionPercentage.A, color: '#10b981' },
        { name: 'B (Good)', value: overallStats.ratingDistribution.B, percentage: overallStats.ratingDistributionPercentage.B, color: '#3b82f6' },
        { name: 'C (Average)', value: overallStats.ratingDistribution.C, percentage: overallStats.ratingDistributionPercentage.C, color: '#f59e0b' },
        { name: 'D (Poor)', value: overallStats.ratingDistribution.D, percentage: overallStats.ratingDistributionPercentage.D, color: '#ef4444' },
        { name: 'E (Very Poor)', value: overallStats.ratingDistribution.E, percentage: overallStats.ratingDistributionPercentage.E, color: '#dc2626' },
      ]
    : [];

  // Prepare section performance data (top 10 sections)
  const sectionPerformanceData = sectionStats
    .sort((a, b) => b.sectionPercentage - a.sectionPercentage)
    .slice(0, 10)
    .map((section) => ({
      name: section.sectionName.length > 20 ? section.sectionName.substring(0, 20) + '...' : section.sectionName,
      percentage: Number(section.sectionPercentage.toFixed(1)),
      responses: section.totalResponses,
    }));

  // Get health status color
  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-50 border-emerald-200';
    if (percentage >= 60) return 'bg-blue-50 border-blue-200';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Overview of organization health metrics and insights
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Overall Health */}
          <div className={`bg-white rounded-2xl shadow-sm border-2 p-6 ${overallStats ? getHealthBgColor(overallStats.overallPercentage) : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Overall Health
                </p>
                <p className={`mt-3 text-4xl font-bold ${overallStats ? getHealthColor(overallStats.overallPercentage) : 'text-gray-900'}`}>
                  {overallStats && typeof overallStats.overallPercentage === 'number'
                    ? `${overallStats.overallPercentage.toFixed(1)}%`
                    : '--'}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    overallStats && overallStats.overallPercentage >= 80
                      ? 'bg-emerald-500'
                      : overallStats && overallStats.overallPercentage >= 60
                      ? 'bg-blue-500'
                      : overallStats && overallStats.overallPercentage >= 40
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: overallStats && typeof overallStats.overallPercentage === 'number'
                      ? `${overallStats.overallPercentage}%`
                      : '0%',
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Total Companies */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Companies
                </p>
                <p className="mt-3 text-4xl font-bold text-gray-900">{companiesCount}</p>
                <p className="mt-2 text-xs text-gray-500">Registered organizations</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Responses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Responses
                </p>
                <p className="mt-3 text-4xl font-bold text-gray-900">
                  {overallStats ? overallStats.totalResponses : 0}
                </p>
                <p className="mt-2 text-xs text-gray-500">Survey submissions</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Sections */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Sections
                </p>
                <p className="mt-3 text-4xl font-bold text-gray-900">{sectionsCount}</p>
                <p className="mt-2 text-xs text-gray-500">Health categories</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution - Pie Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h2>
            {ratingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: PieLabelRenderProps & { percentage?: number }) =>
                      `${props.name}: ${props.percentage?.toFixed(1) ?? '0.0'}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No rating data available</p>
              </div>
            )}
          </div>

          {/* Rating Distribution - Bar Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rating Count</h2>
            {ratingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No rating data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Section Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Section Performance (Top 10)</h2>
          {sectionPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={sectionPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={150} />
                <Legend />
                <Bar dataKey="percentage" fill="#8b5cf6" name="Performance %" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-gray-500">
              <p>No section performance data available</p>
            </div>
          )}
        </div>

        {/* Insights */}
        {overallStats && (overallStats.bestSection || (overallStats.summaryInsights && overallStats.summaryInsights.length > 0)) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Key Insights</h2>
            {overallStats.bestSection && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                  Best Performing Section
                </p>
                <p className="mt-1 text-sm font-medium text-emerald-900">
                  {overallStats.bestSection.sectionName}{' '}
                  <span className="font-normal">
                    ({typeof overallStats.bestSection.percentage === 'number'
                      ? overallStats.bestSection.percentage.toFixed(1)
                      : '0.0'}%)
                  </span>
                </p>
              </div>
            )}
            {overallStats.summaryInsights && overallStats.summaryInsights.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Summary</p>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {overallStats.summaryInsights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
