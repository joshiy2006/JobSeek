import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, X, CircleAlert as AlertCircle, Sparkles } from 'lucide-react';

export default function JobSearch() {
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const resultsTopRef = useRef(null);

  useEffect(() => {
    fetchJobs('', '', 1);
  }, []);

  const fetchJobs = async (title, loc, page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page, page_size: 10 });
      if (title.trim()) params.append('title', title.trim());
      if (loc.trim()) params.append('location', loc.trim());

      const response = await fetch(`http://localhost:8000/jobs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();

      setJobs(data.jobs || []);
      setTotalJobs(data.count || 0);
      setSearched(true);
    } catch (error) {
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

  const getMockSalary = (job) => {
    const exp = job.experience ? job.experience.toLowerCase() : '';
    if (exp.includes('0-2') || exp.includes('0-3') || exp.includes('1-3') || exp.includes('0-1')) return '₹4–8 LPA';
    if (exp.includes('2-4') || exp.includes('2-5') || exp.includes('3-5') || exp.includes('3-6')) return '₹8–12 LPA';
    if (exp.includes('5-10') || exp.includes('8-12') || exp.includes('5+')) return '₹15–25 LPA';
    const seed = job.id % 3;
    if (seed === 0) return '₹6–10 LPA';
    if (seed === 1) return '₹10–15 LPA';
    return '₹12–18 LPA';
  };

  const getMockEmploymentType = (job) => {
    const seed = job.id % 4;
    if (seed === 0) return 'Full Time';
    if (seed === 1) return 'Full Time (Remote)';
    if (seed === 2) return 'Contract';
    return 'Full Time';
  };

  const getMockPosted = (job) => {
    const seed = job.id % 5;
    if (seed === 0) return 'Just now';
    if (seed === 1) return '1 day ago';
    if (seed === 2) return '2 days ago';
    if (seed === 3) return '3 days ago';
    return '5 days ago';
  };

  const formatSkills = (skillsStr) => {
    if (!skillsStr) return [];
    return skillsStr.split(',').map(s => s.trim()).filter(Boolean);
  };

  const totalPages = Math.ceil(totalJobs / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchJobs(jobTitle, location, page);
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 dark:text-slate-100">
          Find Jobs
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </h2>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">
          Explore career opportunities across Indian growth hubs
        </p>
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
        ) : jobs.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-sm font-semibold text-slate-500 px-1 dark:text-slate-400">
              <span>{totalJobs.toLocaleString('en-IN')} matching jobs</span>
              <span className="badge badge-indigo">Active Listings</span>
            </div>

            {jobs.map((job) => (
              <div
                key={job.id}
                className="card card-hover p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 dark:bg-slate-900"
              >
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{job.jobtitle}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-0.5 dark:text-slate-400">{job.company}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 font-medium dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      {job.location}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      {job.experience || '0-2 Yrs'}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <DollarSign className="w-3.5 h-3.5" />
                      {getMockSalary(job)}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 dark:border-slate-800">
                    {formatSkills(job.skills).slice(0, 4).map((skill, idx) => (
                      <span key={idx} className="badge badge-slate normal-case tracking-normal">
                        {skill}
                      </span>
                    ))}
                    {formatSkills(job.skills).length === 0 && (
                      <span className="text-xs text-slate-400">General Skills</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="hidden md:flex items-center gap-1 text-xs text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    {getMockPosted(job)}
                  </span>
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
                  Page {currentPage} of {totalPages}
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedJob.jobtitle}</h3>
                <p className="text-sm font-medium text-slate-500 mt-0.5 dark:text-slate-400">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 card-flat p-4 text-xs font-semibold dark:bg-slate-800">
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
                    {selectedJob.experience || '0-2 Yrs'}
                  </span>
                </div>
                <div>
                  <span className="section-label block mb-1">Salary Range</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-bold">
                    <DollarSign className="w-3.5 h-3.5" />
                    {getMockSalary(selectedJob)}
                  </span>
                </div>
                <div>
                  <span className="section-label block mb-1">Type</span>
                  <span className="text-slate-800 dark:text-slate-200">{getMockEmploymentType(selectedJob)}</span>
                </div>
              </div>

              <div>
                <h4 className="section-label mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {formatSkills(selectedJob.skills).map((skill, idx) => (
                    <span key={idx} className="badge badge-indigo normal-case tracking-normal">{skill}</span>
                  ))}
                  {formatSkills(selectedJob.skills).length === 0 && (
                    <span className="text-xs text-slate-400 italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <h4 className="section-label mb-2">Job Description</h4>
                <div className="card-flat p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-line font-medium dark:bg-slate-800 dark:text-slate-300">
                  {selectedJob.page_content || `No detailed description available for this role. Key skills include: ${selectedJob.skills}. Required experience: ${selectedJob.experience}.`}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 dark:border-slate-800">
              <button onClick={() => setSelectedJob(null)} className="btn-secondary px-5 py-2.5 text-xs">
                Close
              </button>
              <a
                href={selectedJob.job_link || `https://www.google.com/search?q=${encodeURIComponent(selectedJob.jobtitle + ' ' + selectedJob.company + ' job')}`}
                target="_blank"
                rel="noreferrer"
                className="btn-primary px-5 py-2.5 text-xs flex items-center justify-center"
              >
                Apply on Partner Site
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
