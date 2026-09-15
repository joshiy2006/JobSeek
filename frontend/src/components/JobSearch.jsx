import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Briefcase, DollarSign, X, CircleAlert as AlertCircle, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function JobSearch({ initialQuery = '' }) {
  const [jobTitle, setJobTitle] = useState(initialQuery);
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const resultsTopRef = useRef(null);

  // Runs once on mount. If the header search bar handed us a query
  // (jumping in from elsewhere in the dashboard), search with it right
  // away instead of loading the generic "most recent listings" default.
  useEffect(() => {
    fetchJobs(initialQuery, '', 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchJobs = async (title, loc, page = 1) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({ page });
      if (title.trim()) params.append('title', title.trim());
      if (loc.trim()) params.append('location', loc.trim());

      const response = await fetch(`${API_BASE_URL}/jobs?${params.toString()}`);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.detail || `Request failed with status ${response.status}`);
      }
      const data = await response.json();

      setJobs(data.jobs || []);
      setTotalJobs(data.count || 0);
      setPageSize(data.page_size || 30);
      setIsSearchActive(!!data.is_search);
      setSearched(true);
    } catch (error) {
      // Distinct from a genuine zero-result search — surface what
      // actually went wrong instead of masquerading as "no jobs found".
      setFetchError(error.message || 'Could not reach the job search service.');
      setJobs([]);
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs(jobTitle, location, 1);
  };

  // Real salary data — new_jobs_data has actual minimumSalary/
  // maximumSalary/currency columns, but they're stored as TEXT and as
  // raw rupee amounts, not LPA. Two things to handle: "0" is a
  // non-empty string (truthy in JS) even though the value means "not
  // disclosed", and 1500000 needs converting to 15 (lakhs) for display.
  const toLakhs = (rupees) => {
    const lakhs = rupees / 100000;
    return Number.isInteger(lakhs) ? String(lakhs) : lakhs.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  };

  const formatSalary = (job) => {
    const min = Number(job.minimumSalary);
    const max = Number(job.maximumSalary);
    const hasValidRange = Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0;

    if (!hasValidRange) return 'Not disclosed';

    const currency = job.currency || '₹';
    return `${currency}${toLakhs(min)}–${toLakhs(max)} LPA`;
  };

  const formatSkills = (skillsStr) => {
    if (!skillsStr) return [];
    return skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const totalPages = Math.ceil(totalJobs / pageSize);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchJobs(jobTitle, location, page);
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="page-header-icon">
          <Sparkles className="w-[18px] h-[18px]" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-heading dark:text-slate-100">
            Find Jobs
          </h2>
          <p className="text-sm text-slate-500 mt-0.5 dark:text-slate-400">
            Explore career opportunities across Indian growth hubs
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5 sm:p-6 dark:bg-slate-900">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5">
            <label className="block section-label mb-2">Job Title</label>
            <div className="relative">
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer, Data Analyst"
                className="input-base w-full pl-10 pr-4 py-3 text-sm"
              />
              <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="md:col-span-5">
            <label className="block section-label mb-2">Location</label>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Pune, Indore, Bangalore"
                className="input-base w-full pl-10 pr-4 py-3 text-sm"
              />
              <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      <div ref={resultsTopRef} className="space-y-3">
        {isLoading ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center dark:bg-slate-900">
            <div className="w-8 h-8 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Searching jobs...</p>
          </div>
        ) : fetchError ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto border border-orange-200 dark:bg-slate-900">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Couldn't load jobs</h3>
            <p className="text-sm text-orange-600 mt-1.5 max-w-sm font-medium">{fetchError}</p>
          </div>
        ) : jobs.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-500 px-1 dark:text-slate-400">
              <span>
                {isSearchActive
                  ? `${totalJobs.toLocaleString('en-IN')} matching jobs`
                  : `Showing the ${jobs.length} most recent listings`}
              </span>
              <span className="badge badge-indigo">Active Listings</span>
            </div>

            {jobs.map((job) => (
              <div
                key={job.jobId}
                className="card card-hover p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:bg-slate-900"
              >
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{job.title}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-0.5 dark:text-slate-400">{job.companyName}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {job.experience || 'Not specified'}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <DollarSign className="w-3.5 h-3.5" />
                      {formatSalary(job)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 dark:border-slate-800">
                    {formatSkills(job.tagsAndSkills).slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="badge badge-slate normal-case tracking-normal">
                        {skill}
                      </span>
                    ))}
                    {formatSkills(job.tagsAndSkills).length === 0 && (
                      <span className="text-xs text-slate-400">General Skills</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedJob(job)}
                    className="btn-primary px-4 py-2.5 text-xs"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`btn-secondary px-4 py-2 text-xs ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                  Page {currentPage} of {totalPages.toLocaleString('en-IN')}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`btn-secondary px-4 py-2 text-xs ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : searched ? (
          <div className="card p-12 flex flex-col items-center justify-center text-center max-w-xl mx-auto dark:bg-slate-900">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No matching jobs found</h3>
            <p className="text-sm text-slate-500 mt-1.5 max-w-sm dark:text-slate-400">
              Try changing the job title or location to broaden your search.
            </p>
          </div>
        ) : null}
      </div>

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="card max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col dark:bg-slate-900">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedJob.title}</h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5 dark:text-slate-400">{selectedJob.companyName}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 card-flat p-4 text-xs font-semibold dark:bg-slate-800">
                <div>
                  <span className="section-label block mb-1">Location</span>
                  <span className="text-slate-800 flex items-center gap-1 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    {selectedJob.location}
                  </span>
                </div>
                <div>
                  <span className="section-label block mb-1">Experience</span>
                  <span className="text-slate-800 flex items-center gap-1 dark:text-slate-200">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    {selectedJob.experience || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="section-label block mb-1">Salary Range</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    {formatSalary(selectedJob)}
                  </span>
                </div>
                {selectedJob.AggregateRating && (
                  <div>
                    <span className="section-label block mb-1">Company Rating</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {selectedJob.AggregateRating} ★ {selectedJob.ReviewsCount ? `(${selectedJob.ReviewsCount} reviews)` : ''}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="section-label mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {formatSkills(selectedJob.tagsAndSkills).map((skill, idx) => (
                    <span key={idx} className="badge badge-indigo normal-case tracking-normal">{skill}</span>
                  ))}
                  {formatSkills(selectedJob.tagsAndSkills).length === 0 && (
                    <span className="text-xs text-slate-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="section-label mb-2">Job Description</h4>
                <div className="card-flat p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium dark:bg-slate-800 dark:text-slate-300">
                  {selectedJob.jobDescription || `No detailed description available for this role. Key skills include: ${selectedJob.tagsAndSkills}. Required experience: ${selectedJob.experience}.`}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 dark:border-slate-800">
              <button onClick={() => setSelectedJob(null)} className="btn-secondary px-5 py-2.5 text-xs">
                Close
              </button>
              {/* No job_link column exists in new_jobs_data, so this
                  always falls back to a Google search — not a direct
                  apply link, unlike the previous dataset. */}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(selectedJob.title + ' ' + selectedJob.companyName + ' job')}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary px-5 py-2.5 text-xs flex items-center justify-center"
              >
                Search for This Role
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}