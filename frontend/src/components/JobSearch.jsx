import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { Search, MapPin, Briefcase, Calendar, Award, DollarSign, Clock, X, Info, AlertCircle, Sparkles } from 'lucide-react';

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

  // Initial load: Fetch trending or all jobs
  useEffect(() => {
    fetchJobs('', '', 1);
  }, []);

  const fetchJobs = async (title, loc, page=1) => {
    setIsLoading(true);
    
    try {
      const params= new URLSearchParams({
        title,
        loc,
        page,
        page_size: 10
    });
      
      if (title.trim()) {
        params.append('title', title.trim());
      }
      if (loc.trim()) {
        params.append('location', loc.trim());
      }
      
      // Limit to keep it fast
      const response = await fetch(`http://localhost:8000/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }
      const data = await response.json();
      
      setJobs(data.jobs || []);
      setTotalJobs(data.count || 0);
      setSearched(true);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setJobs([]);
      setSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    fetchJobs(jobTitle, location, 1);
  };

  const getMockSalary = (job) => {
    const exp = job.experience ? job.experience.toLowerCase() : '';
    if (exp.includes('0-2') || exp.includes('0-3') || exp.includes('1-3') || exp.includes('0-1')) {
      return '₹4–8 LPA';
    } else if (exp.includes('2-4') || exp.includes('2-5') || exp.includes('3-5') || exp.includes('3-6')) {
      return '₹8–12 LPA';
    } else if (exp.includes('5-10') || exp.includes('8-12') || exp.includes('5+')) {
      return '₹15–25 LPA';
    }
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
    fetchJobs(jobTitle, location, page); // Refetch jobs for the new page
    resultsTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      
      {/* Title block */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          Find Jobs
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </h2>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Explore resilient career opportunities across Indian growth hubs matching your technical index
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          <div className="md:col-span-5 relative">
            <label htmlFor="jobTitleInput" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Job Title
            </label>
            <div className="relative">
              <input
                id="jobTitleInput"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer, Data Analyst"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-650/10"
              />
              <Briefcase className="absolute left-4 top-4.5 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>

          <div className="md:col-span-5 relative">
            <label htmlFor="locationInput" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              Location
            </label>
            <div className="relative">
              <input
                id="locationInput"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Pune, Indore, Bangalore"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3.5 text-sm sm:text-base font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-650/10"
              />
              <MapPin className="absolute left-4 top-4.5 w-4.5 h-4.5 text-slate-400" />
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isLoading
                  ? 'bg-slate-200 text-slate-400 border border-slate-350 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-550 text-white shadow-lg shadow-indigo-600/15 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Jobs
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div ref={resultsTopRef} className="space-y-4">
        {isLoading ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600">Searching jobs...</p>
            <p className="text-xs text-slate-400 mt-1">Fetching records from India's workforce crawler index</p>
          </div>
        ) : jobs.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm font-bold text-slate-500 px-1">
              <span>{jobs.length} Matching Jobs Found</span>
              <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">Active Listings</span>
            </div>
            
            {jobs.map((job) => (
              <div 
                key={job.id} 
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
              >
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-slate-900">{job.jobtitle}</h4>
                    <p className="text-sm font-semibold text-slate-500 mt-1">{job.company}</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-indigo-650" />
                      {job.location}
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-4 h-4 text-slate-400" />
                      Experience: {job.experience || '0-2 Yrs'}
                    </span>
                    <span className="hidden sm:inline text-slate-300">•</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <DollarSign className="w-4 h-4" />
                      Salary: {getMockSalary(job)}
                    </span>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Skills</span>
                      <span className="text-slate-800 text-sm font-bold block truncate" title={formatSkills(job.skills).join(' • ')}>
                        {formatSkills(job.skills).slice(0, 4).join(' • ') || 'General Skills'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Employment Type</span>
                      <span className="text-slate-800 text-sm font-bold block">{getMockEmploymentType(job)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Posted</span>
                      <span className="text-slate-500 text-sm flex items-center gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {getMockPosted(job)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-auto self-end md:self-center shrink-0">
                  <button 
                    onClick={() => setSelectedJob(job)}
                    className="w-full md:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm tracking-wider uppercase transition-all shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 cursor-pointer text-center"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-8 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border flex items-center gap-1 cursor-pointer ${
                    currentPage === 1
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-250 shadow-sm active:scale-95'
                  }`}
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-white text-slate-650 hover:bg-slate-50 border border-slate-200 shadow-sm hover:border-slate-355'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all border flex items-center gap-1 cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-250 shadow-sm active:scale-95'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        ) : searched ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm max-w-xl mx-auto">
            <div className="w-14 h-14 bg-orange-50 border border-orange-200 text-orange-500 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No matching jobs found.</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md">
              Try changing the job title or location in the search inputs above to broaden your search results.
            </p>
          </div>
        ) : null}
      </div>

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl flex flex-col">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-5 flex justify-between items-start z-10">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedJob.jobtitle}</h3>
                <p className="text-sm font-semibold text-slate-500 mt-1">{selectedJob.company}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* Quick Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Location</span>
                  <span className="text-slate-800 flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-indigo-650" />
                    {selectedJob.location}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Experience</span>
                  <span className="text-slate-800 flex items-center gap-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {selectedJob.experience || '0-2 Yrs'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Salary Range</span>
                  <span className="text-emerald-600 flex items-center gap-1 font-bold">
                    <DollarSign className="w-4 h-4" />
                    {getMockSalary(selectedJob)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-1">Employment Type</span>
                  <span className="text-slate-800 block">{getMockEmploymentType(selectedJob)}</span>
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {formatSkills(selectedJob.skills).map((skill, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold"
                    >
                      {skill}
                    </span>
                  ))}
                  {formatSkills(selectedJob.skills).length === 0 && (
                    <span className="text-xs text-slate-500 italic">No skills listed</span>
                  )}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Job Description & Details</h4>
                <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line font-medium">
                  {selectedJob.page_content ? (
                    selectedJob.page_content
                  ) : (
                    `No detailed description available for this role. Key skills include: ${selectedJob.skills}. Required experience: ${selectedJob.experience}.`
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 z-10">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Window
              </button>
              <a
                href={selectedJob.job_link || `https://www.google.com/search?q=${encodeURIComponent(selectedJob.jobtitle + ' ' + selectedJob.company + ' job')}`}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-md shadow-indigo-600/10 cursor-pointer text-center flex items-center justify-center"
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
