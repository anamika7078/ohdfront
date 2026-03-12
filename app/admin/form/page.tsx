'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { companyAPI, sectionAPI, questionAPI, responseAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

interface Company {
  _id: string;
  name: string;
}

interface Section {
  _id: string;
  name: string;
  order: number;
}

interface Question {
  _id: string;
  text: string;
  sectionId: string | Section;
  order: number;
}

type Rating = 'A' | 'B' | 'C' | 'D' | 'E';

export default function FillFormPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [answers, setAnswers] = useState<Record<string, Rating | ''>>({});
  const [submitting, setSubmitting] = useState(false);

  const fetchMeta = async () => {
    try {
      const [companyRes, sectionRes, questionRes] = await Promise.all([
        companyAPI.getAll(),
        sectionAPI.getAll(),
        questionAPI.getAll(),
      ]);
      setCompanies(companyRes.data.companies || []);
      setSections(sectionRes.data.sections || []);
      setQuestions(questionRes.data.questions || []);
    } catch (error: any) {
      console.error('Failed to load form data', error);
      toast.error(error.response?.data?.error || 'Failed to load form data');
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  const groupedBySection = sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => ({
      section,
      questions: questions
        .filter((q) => {
          const sid = typeof q.sectionId === 'string' ? q.sectionId : q.sectionId._id;
          return sid === section._id;
        })
        .sort((a, b) => a.order - b.order),
    }));

  const setAnswer = (questionId: string, rating: Rating) => {
    setAnswers((prev) => ({ ...prev, [questionId]: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      toast.error('Please select a company');
      return;
    }

    const filledAnswers = Object.entries(answers)
      .filter(([_, rating]) => rating)
      .map(([questionId, rating]) => ({
        questionId,
        rating,
      }));

    if (filledAnswers.length === 0) {
      toast.error('Please answer at least one question');
      return;
    }

    try {
      setSubmitting(true);
      await responseAPI.submit({
        companyId: selectedCompany,
        answers: filledAnswers,
      });
      toast.success('Response submitted');
      setAnswers({});
    } catch (error: any) {
      console.error('Failed to submit response', error);
      toast.error(error.response?.data?.error || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fill Form</h1>
          <p className="mt-1 text-sm text-gray-600">
            Capture an employee&apos;s responses to the Organization Health Diagnostic.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Company</p>
              <p className="text-xs text-gray-500">
                Choose the company for which this response is being recorded.
              </p>
            </div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full md:w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select company</option>
              {companies.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Questions grouped by section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            {groupedBySection.map(({ section, questions: qs }) => (
              <div key={section._id} className="space-y-3">
                <h2 className="text-base font-semibold text-gray-900">
                  {section.order}. {section.name}
                </h2>
                {qs.length === 0 ? (
                  <p className="text-xs text-gray-500">No questions configured for this section.</p>
                ) : (
                  <div className="space-y-3">
                    {qs.map((q) => (
                      <div
                        key={q._id}
                        className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                      >
                        <p className="text-sm text-gray-900 mb-2">
                          {section.order}.{q.order} {q.text}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(['A', 'B', 'C', 'D', 'E'] as Rating[]).map((rating) => {
                            const active = answers[q._id] === rating;
                            return (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setAnswer(q._id, rating)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                                  active
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {rating}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {groupedBySection.length === 0 && (
              <p className="text-sm text-gray-500">
                No sections or questions configured yet. Create them first from the Sections and
                Questions pages.
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit response'}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}


