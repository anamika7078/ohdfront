'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { questionAPI, sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Section {
  _id: string;
  name: string;
}

interface Question {
  _id: string;
  text: string;
  order: number;
  sectionId: Section | string;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [sectionId, setSectionId] = useState('');
  const [text, setText] = useState('');
  const [order, setOrder] = useState<number | ''>('');
  const [creating, setCreating] = useState(false);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await questionAPI.getAll();
      setQuestions(res.data.questions || []);
    } catch (error: any) {
      console.error('Failed to load questions', error);
      toast.error(error.response?.data?.error || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const res = await sectionAPI.getAll();
      setSections(res.data.sections || []);
    } catch (error: any) {
      console.error('Failed to load sections', error);
      toast.error(error.response?.data?.error || 'Failed to load sections');
    }
  };

  useEffect(() => {
    fetchSections();
    fetchQuestions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectionId || !text || order === '') {
      toast.error('Section, text and order are required');
      return;
    }

    try {
      setCreating(true);
      const res = await questionAPI.create({
        sectionId,
        text,
        order,
      });
      toast.success('Question created');
      setSectionId('');
      setText('');
      setOrder('');
      setQuestions((prev) => [...prev, res.data.question]);
    } catch (error: any) {
      console.error('Failed to create question', error);
      toast.error(error.response?.data?.error || 'Failed to create question');
    } finally {
      setCreating(false);
    }
  };

  const getSectionName = (q: Question) => {
    if (typeof q.sectionId === 'string') {
      const section = sections.find((s) => s._id === q.sectionId);
      return section?.name || '-';
    }
    return q.sectionId?.name || '-';
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Questions</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage survey questions that employees will answer for each section.
          </p>
        </div>

        {/* Create question */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add new question</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select section</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Question text</label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. How effectively does leadership communicate the organization's vision?"
                required
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
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Add question'}
              </button>
            </div>
          </form>
        </div>

        {/* Question list */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Question bank</h2>
            {loading && <span className="text-xs text-gray-500">Loading...</span>}
          </div>
          {questions.length === 0 && !loading ? (
            <p className="text-sm text-gray-500">No questions found.</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q._id}
                  className="flex items-start justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {getSectionName(q)} • Q{q.order}
                    </p>
                    <p className="mt-1 text-sm text-gray-900">{q.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}


