'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI, reportAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
interface Company {
  _id: string;
  name: string;
}

interface OverallReport {
  overallPercentage: number;
  totalResponses: number;
  totalCompanies: number;
  bestSection?: {
    sectionName: string;
    percentage: number;
  } | null;
  summaryInsights?: string[];
  ratingDistributionPercentage?: { A: number; B: number; C: number; D: number; E: number };
  ratingDistribution?: { A: number; B: number; C: number; D: number; E: number };
}

interface QuestionStat {
  questionId: string;
  questionText: string;
  ratingCount: { A: number; B: number; C: number; D: number; E: number };
  ratingPercentage: { A: number; B: number; C: number; D: number; E: number };
  totalResponses: number;
}

interface SectionStat {
  sectionId: string;
  sectionName: string;
  questionStats: QuestionStat[];
  sectionPercentage: number;
  totalResponses: number;
}

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'];
const RATING_LABELS: Record<string, string> = {
  A: 'Strongly Agree (5)',
  B: 'Agree (4)',
  C: 'Neutral (3)',
  D: 'Disagree (2)',
  E: 'Strongly Disagree (1)'
};

const getTopAnswer = (ratingCount: { A: number; B: number; C: number; D: number; E: number }) => {
  let top = 'none';
  let max = -1;
  Object.entries(ratingCount).forEach(([key, value]) => {
    if (value > max) {
      max = value;
      top = key;
    }
  });
  if (max === 0) return { label: 'No Responses', count: 0 };
  return { label: RATING_LABELS[top], count: max };
};

export default function ReportsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [overall, setOverall] = useState<OverallReport | null>(null);
  const [sections, setSections] = useState<SectionStat[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPillar, setSelectedPillar] = useState<string>('1');

  const fetchCompanies = async () => {
    try {
      const res = await companyAPI.getAll();
      setCompanies(res.data.companies || []);
    } catch (error: any) {
      console.error('Failed to load companies', error);
      toast.error(error.response?.data?.error || 'Failed to load companies');
    }
  };

  const fetchOverall = async (companyId?: string) => {
    try {
      setLoading(true);
      const res = await reportAPI.getOverallReport(companyId || undefined);
      setOverall(res.data.overallStats || null);
      setSections(res.data.sectionStats || []);
    } catch (error: any) {
      console.error('Failed to load report', error);
      toast.error(error.response?.data?.error || 'Failed to load report');
      setOverall(null);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    fetchOverall();
  }, []);

  const handleCompanyChange = (id: string) => {
    setSelectedCompany(id);
    fetchOverall(id || undefined);
  };

  const pieData = useMemo(() => {
    if (!overall?.ratingDistribution) return [];
    return [
      { name: 'Strongly Agree', value: overall.ratingDistribution.A },
      { name: 'Agree', value: overall.ratingDistribution.B },
      { name: 'Neutral', value: overall.ratingDistribution.C },
      { name: 'Disagree', value: overall.ratingDistribution.D },
      { name: 'Strongly Disagree', value: overall.ratingDistribution.E }
    ].filter(d => d.value > 0);
  }, [overall]);

  const sectionBarData = useMemo(() => {
    return sections.map(s => ({
      name: s.sectionName.length > 20 ? s.sectionName.substring(0, 20) + '...' : s.sectionName,
      Percentage: Number(s.sectionPercentage.toFixed(1))
    }));
  }, [sections]);

  const pillarChartData = useMemo(() => {
    if (!sections || sections.length === 0) return [];

    // Filter sections by selectedPillar
    const pillarPrefix = `Pillar ${selectedPillar}_`;
    const pillarSections = sections.filter(s => s.sectionName.startsWith(pillarPrefix));

    const data = pillarSections.map(s => {
      const match = s.sectionName.match(/^Pillar (\d+)_(\d+)/);
      const label = match ? `P${match[1]}.${match[2]}` : s.sectionName.split(' ')[0];

      let a = 0, b = 0, c = 0, d = 0, e = 0;
      s.questionStats.forEach(q => {
        a += q.ratingCount?.A || 0;
        b += q.ratingCount?.B || 0;
        c += q.ratingCount?.C || 0;
        d += q.ratingCount?.D || 0;
        e += q.ratingCount?.E || 0;
      });

      return {
        name: label,
        SA: a,
        A: b,
        N: c,
        D: d,
        SD: e
      };
    });

    if (data.length > 0) {
      const finalScore = {
        name: 'FINAL SCORE',
        SA: data.reduce((acc, curr) => acc + curr.SA, 0),
        A: data.reduce((acc, curr) => acc + curr.A, 0),
        N: data.reduce((acc, curr) => acc + curr.N, 0),
        D: data.reduce((acc, curr) => acc + curr.D, 0),
        SD: data.reduce((acc, curr) => acc + curr.SD, 0),
      };
      data.push(finalScore);
    }

    return data;
  }, [sections, selectedPillar]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              View comprehensive insights, graphical representation, and breakdown of scores.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Overall health
            </p>
            <p className="mt-3 text-4xl font-bold text-gray-900">
              {overall && typeof overall.overallPercentage === 'number'
                ? `${overall.overallPercentage.toFixed(1)}%`
                : '--'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Average rating across all responses.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Responses
            </p>
            <p className="mt-3 text-4xl font-bold text-gray-900">
              {overall && typeof overall.totalResponses === 'number'
                ? overall.totalResponses
                : '--'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Total employee survey submissions.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Companies
            </p>
            <p className="mt-3 text-4xl font-bold text-gray-900">
              {overall && typeof overall.totalCompanies === 'number'
                ? overall.totalCompanies
                : '--'}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Organizations included in this view.
            </p>
          </div>
        </div>

        {/* Pillar Scoring Analysis */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex-shrink-0">Pillar Scoring Analysis</h2>
            <select
              value={selectedPillar}
              onChange={(e) => setSelectedPillar(e.target.value)}
              className="w-full sm:w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">Pillar 1</option>
              <option value="2">Pillar 2</option>
              <option value="3">Pillar 3</option>
              <option value="4">Pillar 4</option>
              <option value="5">Pillar 5</option>
            </select>
          </div>
          <div className="h-96 w-full flex-grow">
            {pillarChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pillarChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f3f4f6' }} />
                  <Legend iconType="square" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="SD" name="SD" fill="#60a5fa" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="D" name="D" fill="#f97316" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="N" name="N" fill="#9ca3af" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="A" name="A" fill="#fbbf24" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="SA" name="SA" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data for this pillar</div>
            )}
          </div>
        </div>

        {/* Graphical Representation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex-shrink-0">Section Comparison</h2>
            <div className="h-72 w-full flex-grow">
              {sectionBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionBarData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} />
                    <Bar dataKey="Percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No section data</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex-shrink-0">Overall Rating Distribution</h2>
            <div className="h-72 w-full flex-grow">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">No rating data</div>
              )}
            </div>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
