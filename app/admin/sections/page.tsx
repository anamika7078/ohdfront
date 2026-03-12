'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Section {
  _id: string;
  name: string;
  description?: string;
  pillar: number;
  order: number;
}

const PILLAR_NAMES: Record<number, string> = {
  1: 'PILLAR 1 (P1) – LEADERSHIP & STRATEGIC DIRECTION',
  2: 'PILLAR 2 – MANAGEMENT & PEOPLE SYSTEMS',
  3: 'PILLAR 3 – CULTURE & ENGAGEMENT',
  4: 'PILLAR 4 – SYSTEMS & EXECUTION',
  5: 'PILLAR 5 – GROWTH & SUSTAINABILITY',
};

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pillar, setPillar] = useState<number | ''>('');
  const [order, setOrder] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await sectionAPI.getAll();
      setSections(res.data.sections || []);
    } catch (error: any) {
      console.error('Failed to load sections', error);
      toast.error(error.response?.data?.error || 'Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || pillar === '' || order === '') {
      toast.error('Name, pillar, and order are required');
      return;
    }

    try {
      setCreating(true);
      const res = await sectionAPI.create({
        name,
        description: description || undefined,
        pillar,
        order,
      });
      toast.success('Section created');
      setName('');
      setDescription('');
      setPillar('');
      setOrder('');
      setSections((prev) => [...prev, res.data.section]);
    } catch (error: any) {
      console.error('Failed to create section', error);
      toast.error(error.response?.data?.error || 'Failed to create section');
    } finally {
      setCreating(false);
    }
  };

  // Group sections by pillar
  const sectionsByPillar = sections.reduce((acc, section) => {
    if (!acc[section.pillar]) {
      acc[section.pillar] = [];
    }
    acc[section.pillar].push(section);
    return acc;
  }, {} as Record<number, Section[]>);

  // Sort sections within each pillar by order
  Object.keys(sectionsByPillar).forEach((pillarNum) => {
    sectionsByPillar[Number(pillarNum)].sort((a, b) => a.order - b.order);
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
          <p className="mt-1 text-sm text-gray-600">
            Define questionnaire sections that group related questions for the diagnostic.
          </p>
        </div>

        {/* Create section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add new section</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pillar <span className="text-red-500">*</span>
              </label>
              <select
                value={pillar}
                onChange={(e) => setPillar(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                required
              >
                <option value="">Select Pillar</option>
                {[1, 2, 3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    P{p} - {PILLAR_NAMES[p].split('–')[1]?.trim() || PILLAR_NAMES[p]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. Senior Leadership Effectiveness"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional short description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <input
                type="number"
                min={1}
                value={order}
                onChange={(e) => setOrder(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1"
                required
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Add section'}
              </button>
            </div>
          </form>
        </div>

        {/* Sections list grouped by pillar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Section list (Grouped by Pillar)</h2>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          {sections.length === 0 && !loading ? (
            <p className="text-sm text-gray-500">No sections found.</p>
          ) : (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((pillarNum) => {
                const pillarSections = sectionsByPillar[pillarNum] || [];
                if (pillarSections.length === 0) return null;

                return (
                  <div key={pillarNum} className="space-y-3">
                    <div className="border-b border-gray-200 pb-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {PILLAR_NAMES[pillarNum]}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pillarSections.length} section{pillarSections.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pillarSections.map((s) => (
                        <div
                          key={s._id}
                          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                P{pillarNum} • Parameter {s.order}
                              </p>
                              <p className="mt-1 text-sm font-medium text-gray-900">{s.name}</p>
                              {s.description && (
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                  {s.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


