import React, { useState } from 'react';
import { CITIES } from '../utils/mockData';
import WorkerIntake from './WorkerIntake';
import LiveAnalysis from './LiveAnalysis';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function PersonalCareer() {
  const [profileData, setProfileData] = useState({
    jobTitle: '',
    city: '',       // CITIES id, resolved to a name before the API call
    experience: 0,
    writeUp: '',
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    const cityName = CITIES.find((c) => c.id === profileData.city)?.name || null;

    try {
      const res = await fetch(`${API_BASE_URL}/api/skills-gap-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: profileData.jobTitle,
          city: cityName,
          years_experience: profileData.experience,
          write_up: profileData.writeUp,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || `Request failed with status ${res.status}`);
      }
      const json = await res.json();
      setAnalysisResult(json);
    } catch (err) {
      setError(err.message || 'Could not compute your analysis right now.');
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start w-full">
      <div className="flex flex-col gap-4">
        <div className="card p-5 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-indigo-600 font-heading">Worker Intelligence Parser</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Input your professional experience to see real skill gaps against current hiring data and get a reskilling roadmap.
          </p>
        </div>

        {error && (
          <div className="card p-4 border border-orange-200 bg-orange-50 text-orange-700 text-sm dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400">
            {error}
          </div>
        )}

        <WorkerIntake
          onSubmit={handleSubmit}
          isLoading={isLoading}
          profileData={profileData}
          setProfileData={setProfileData}
        />
      </div>

      <LiveAnalysis analysisResult={analysisResult} />
    </div>
  );
}