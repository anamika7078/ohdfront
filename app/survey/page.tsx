'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { companyAPI, questionAPI, responseAPI, sectionAPI } from '@/lib/apiClient';
import toast from 'react-hot-toast';

type NumericRating = 1 | 2 | 3 | 4 | 5;

interface Section {
  _id: string;
  name: string;
  pillar: number;
  order: number;
}

interface Question {
  _id: string;
  text: string;
  sectionId: string | Section;
  order: number;
}

interface Company {
  _id: string;
  name: string;
}

const TOTAL_TIME_SECONDS = 30 * 60; // 30 minutes

const numericToLetterRating = (value: NumericRating): 'A' | 'B' | 'C' | 'D' | 'E' => {
  // Keep internal scoring consistent where A is highest (5) and E is lowest (1)
  const map: Record<NumericRating, 'A' | 'B' | 'C' | 'D' | 'E'> = {
    5: 'A',
    4: 'B',
    3: 'C',
    2: 'D',
    1: 'E',
  };
  return map[value];
};

export default function SurveyPage() {
  const searchParams = useSearchParams();
  const initialCompanyId = searchParams.get('companyId') || '';

  const [company, setCompany] = useState<Company | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [department, setDepartment] = useState('');

  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME_SECONDS);
  const [expired, setExpired] = useState(false);

  const [answers, setAnswers] = useState<Record<string, NumericRating | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch sections, questions and company meta
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);
        const [sectionRes, questionRes] = await Promise.all([
          sectionAPI.getAll(),
          questionAPI.getAll(),
        ]);

        setSections(sectionRes.data.sections || []);
        setQuestions(questionRes.data.questions || []);

        if (initialCompanyId) {
          const companyRes = await companyAPI.getById(initialCompanyId);
          setCompany(companyRes.data.company || companyRes.data);
        }
      } catch (error: any) {
        console.error('Failed to load survey data', error);
        toast.error(error.response?.data?.error || 'Failed to load survey data');
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, [initialCompanyId]);

  // Timer logic
  useEffect(() => {
    if (!started || expired) return;

    if (timeLeft <= 0) {
      setExpired(true);
      toast.error('Time is up. The 30-minute window has ended.');
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [started, expired, timeLeft]);

  // Convert question order (1-5) to letter (A-E)
  const orderToLetter = (order: number): string => {
    return String.fromCharCode(64 + order); // 65 is 'A', so 64 + 1 = 'A'
  };

  const groupedByPillar = useMemo(() => {
    // Pillar name mapping (should match initDatabase.ts)
    const pillarNames: Record<number, string> = {
      1: 'LEADERSHIP & STRATEGIC DIRECTION',
      2: 'MANAGEMENT & PEOPLE SYSTEMS',
      3: 'CULTURE & ENGAGEMENT',
      4: 'SYSTEMS & EXECUTION',
      5: 'GROWTH & SUSTAINABILITY',
    };

    // Group sections by pillar
    const pillarMap = new Map<number, { pillar: number; pillarName: string; subsections: Array<{ section: Section; questions: Question[] }> }>();
    
    // Sort sections by pillar and order
    const sortedSections = sections
      .slice()
      .sort((a, b) => {
        if (a.pillar !== b.pillar) return a.pillar - b.pillar;
        return a.order - b.order;
      });

    // Group sections by pillar
    sortedSections.forEach((section) => {
      if (!pillarMap.has(section.pillar)) {
        pillarMap.set(section.pillar, {
          pillar: section.pillar,
          pillarName: pillarNames[section.pillar] || `Pillar ${section.pillar}`,
          subsections: [],
        });
      }

      const pillarData = pillarMap.get(section.pillar)!;
      const sectionQuestions = questions
        .filter((q) => {
          const sid = typeof q.sectionId === 'string' ? q.sectionId : q.sectionId._id;
          return sid === section._id;
        })
        .sort((a, b) => a.order - b.order);

      pillarData.subsections.push({
        section,
        questions: sectionQuestions,
      });
    });

    // Convert map to array and sort by pillar number
    return Array.from(pillarMap.values()).sort((a, b) => a.pillar - b.pillar);
  }, [sections, questions]);

  const totalQuestions = questions.length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialCompanyId) {
      toast.error('Invalid or missing company link. Please contact your administrator.');
      return;
    }
    if (!department.trim()) {
      toast.error('Please enter your department to begin.');
      return;
    }
    setStarted(true);
  };

  const setAnswer = (questionId: string, value: NumericRating) => {
    if (!started || expired) return;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!started) {
      toast.error('Please start the assessment first.');
      return;
    }
    if (expired) {
      toast.error('Time is up. You cannot submit after 30 minutes.');
      return;
    }
    if (!initialCompanyId) {
      toast.error('Invalid company link.');
      return;
    }

    // Ensure all questions are answered
    const answeredCount = Object.values(answers).filter(Boolean).length;
    if (totalQuestions === 0) {
      toast.error('No questions configured. Please contact your administrator.');
      return;
    }
    if (answeredCount !== totalQuestions) {
      toast.error(`Please answer all questions before submitting.`);
      return;
    }

    const payloadAnswers = questions.map((q) => {
      const value = answers[q._id] as NumericRating;
      return {
        questionId: q._id,
        rating: numericToLetterRating(value),
      };
    });

    try {
      setSubmitting(true);
      await responseAPI.submit({
        companyId: initialCompanyId,
        employeeName: department.trim(),
        answers: payloadAnswers,
      });
      toast.success('Thank you! Your responses have been submitted.');
      setSubmitting(false);
      setStarted(false);
      setExpired(false);
      setTimeLeft(TOTAL_TIME_SECONDS);
      setAnswers({});
    } catch (error: any) {
      console.error('Failed to submit response', error);
      toast.error(error.response?.data?.error || 'Failed to submit response');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header with logo and title */}
        <header className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="relative w-32 h-16">
            <Image
              src="/ohdlogo.png"
              alt="Harbor & Wells - OHD"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Harbor &amp; Wells
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
              Organizational Health Diagnostic (OHD)
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              5 Pillars • 20 Parameters / Pillar • 100 Questions • Equal Weight Model
            </p>
            {company && (
              <p className="mt-1 text-xs font-medium text-blue-700">
                You are responding for: <span className="font-semibold">{company.name}</span>
              </p>
            )}
          </div>
        </header>

        {/* Instructions & participant info */}
        <section className="bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6 mb-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-sm font-semibold tracking-wide text-slate-800 mb-2">
                Before You Begin – Please Read Carefully
              </h2>
              <ol className="space-y-1.5 text-xs md:text-sm text-slate-600 list-decimal list-inside">
                <li>
                  There are no right or wrong answers. This is a perception-based diagnostic designed
                  to understand your genuine experience.
                </li>
                <li>
                  Your responses are completely confidential. Individual answers are not visible to
                  management, leadership, or any internal authority.
                </li>
                <li>
                  Even Harbor &amp; Wells, the administering agency, does not have access to
                  individual responses. Only aggregated, anonymized data is used.
                </li>
                <li>
                  No individual performance evaluation is linked to this assessment. Your responses
                  will not impact your appraisal, role, or compensation.
                </li>
                <li>
                  Only incomplete submissions are flagged. If a form is left incomplete, only the
                  employee number/identifier may be used to request completion — not your answers.
                </li>
                <li>The total time limit is 30 minutes. The timer starts when you click “Start”.</li>
                <li>There is no time restriction per question within the 30-minute window.</li>
                <li>
                  On average, you will have approximately 20 seconds per question. Respond
                  instinctively rather than overthinking.
                </li>
                <li>
                  Please provide sincere and honest feedback – let your true inner feelings come out:
                  “What do I actually feel?”
                </li>
                <li>
                  Respond based on your current experience – not assumptions. Answer according to what
                  you truly experience in your role and environment today.
                </li>
              </ol>
            </div>

            {/* Timer + response scale */}
            <div className="w-full md:w-64 space-y-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                    Time Remaining
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-medium text-blue-700 border border-blue-100">
                    30 min total
                  </span>
                </div>
                <p className="font-mono text-xl md:text-2xl font-semibold text-blue-900">
                  {started ? formatTime(timeLeft) : '30:00'}
                </p>
                {!started ? (
                  <p className="mt-1 text-[11px] text-blue-800">
                    Timer will start when you click <span className="font-semibold">Start</span>.
                  </p>
                ) : expired ? (
                  <p className="mt-1 text-[11px] text-red-700 font-medium">
                    Time is up. You can no longer submit this assessment.
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-blue-800">
                    Please complete and submit before the timer reaches 00:00.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-semibold text-slate-800 mb-1 uppercase tracking-wide">
                  Response Scale
                </p>
                <ul className="space-y-0.5 text-[11px] text-slate-700">
                  <li>
                    <span className="font-semibold text-slate-900">1</span> = Strongly Disagree
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">2</span> = Disagree
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">3</span> = Neutral
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">4</span> = Agree
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">5</span> = Strongly Agree
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Participant information & start */}
          <form onSubmit={handleStart} className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
            <div className="md:col-span-4 md:flex md:items-center md:gap-6">
              <div className="md:flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={started}
                >
                  <option value="">Select Department</option>
                  <option value="Finance">Finance</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Operations">Operations</option>
                  <option value="IT">IT</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Customer Service">Customer Service</option>
                  <option value="Legal">Legal</option>
                  <option value="Procurement">Procurement</option>
                  <option value="Quality Assurance">Quality Assurance</option>
                  <option value="Research & Development">Research & Development</option>
                  <option value="Administration">Administration</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-4 flex justify-end">
              {!started ? (
                <button
                  type="submit"
                  disabled={loadingMeta || !initialCompanyId}
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                >
                  {loadingMeta ? 'Loading questions...' : 'Start Assessment'}
                </button>
              ) : (
                <p className="text-xs text-slate-600">
                  Assessment in progress. Please answer all questions and click{' '}
                  <span className="font-semibold">Submit</span> at the bottom.
                </p>
              )}
            </div>
          </form>
        </section>

        {/* Questions */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 md:p-6">
          {groupedByPillar.length === 0 ? (
            <p className="text-sm text-slate-600">
              No sections or questions are configured yet. Please contact your administrator.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {groupedByPillar.map((pillarData) => (
                <div key={pillarData.pillar} className="space-y-6">
                  {/* Pillar Header */}
                  <div className="border-b-2 border-blue-200 pb-2">
                    <h1 className="text-lg md:text-xl font-bold text-slate-900">
                      PILLAR {pillarData.pillar} (P{pillarData.pillar}) – {pillarData.pillarName}
                    </h1>
                  </div>

                  {/* Subsections */}
                  {pillarData.subsections.map(({ section, questions: qs }) => {
                    // Extract subsection name from "Pillar X_Y (Subsection Name)" format
                    const subsectionNameMatch = section.name.match(/^Pillar \d+_\d+ \((.+?)\)$/);
                    const subsectionName = subsectionNameMatch ? subsectionNameMatch[1] : section.name;
                    
                    return (
                    <div key={section._id} className="space-y-4 pl-4 border-l-2 border-slate-200">
                      {/* Subsection Header */}
                      <h2 className="text-base md:text-lg font-semibold text-slate-800">
                        {subsectionName}
                      </h2>
                      {qs.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No questions configured for this subsection.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {qs.map((q) => {
                            const current = answers[q._id];
                            // Each subsection restarts with A-E (question order 1-5 maps to A-E)
                            const questionLetter = orderToLetter(q.order);
                            
                            return (
                              <div
                                key={q._id}
                                className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3"
                              >
                                <p className="text-sm text-slate-900 mb-2">
                                  <span className="font-semibold">{questionLetter}.</span> {q.text}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {[
                                    { value: 1 as NumericRating, label: 'Strongly Disagree' },
                                    { value: 2 as NumericRating, label: 'Disagree' },
                                    { value: 3 as NumericRating, label: 'Neutral' },
                                    { value: 4 as NumericRating, label: 'Agree' },
                                    { value: 5 as NumericRating, label: 'Strongly Agree' },
                                  ].map((option) => {
                                    const active = current === option.value;
                                    return (
                                      <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setAnswer(q._id, option.value)}
                                        disabled={!started || expired}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition text-left ${
                                          active
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                            : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                                        } ${!started || expired ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        title={`${option.value} = ${option.label}`}
                                      >
                                        <span className="font-bold mr-1">{option.value}</span>
                                        <span className="hidden sm:inline">{option.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              ))}

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Questions answered:{' '}
                  <span className="font-semibold">
                    {Object.values(answers).filter(Boolean).length}/{totalQuestions}
                  </span>
                </p>
                <button
                  type="submit"
                  disabled={!started || expired || submitting || totalQuestions === 0}
                  className="inline-flex items-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium shadow hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Assessment'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}


