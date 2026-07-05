// Skills Mirage - Mock Data and Simulation Engine

export const CITIES = [
  { id: 'pune', name: 'Pune', state: 'Maharashtra', tier: 'Tier-2' },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', tier: 'Tier-2' },
  { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', tier: 'Tier-2' },
  { id: 'nagpur', name: 'Nagpur', state: 'Maharashtra', tier: 'Tier-2' },
  { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', tier: 'Tier-2' },
  { id: 'coimbatore', name: 'Coimbatore', state: 'Tamil Nadu', tier: 'Tier-2' },
  { id: 'vizag', name: 'Visakhapatnam', state: 'Andhra Pradesh', tier: 'Tier-2' },
  { id: 'surat', name: 'Surat', state: 'Gujarat', tier: 'Tier-2' },
  { id: 'vadodara', name: 'Vadodara', state: 'Gujarat', tier: 'Tier-2' },
  { id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh', tier: 'Tier-2' },
  { id: 'ludhiana', name: 'Ludhiana', state: 'Punjab', tier: 'Tier-2' },
  { id: 'agra', name: 'Agra', state: 'Uttar Pradesh', tier: 'Tier-3' },
  { id: 'nashik', name: 'Nashik', state: 'Maharashtra', tier: 'Tier-2' },
  { id: 'patna', name: 'Patna', state: 'Bihar', tier: 'Tier-2' },
  { id: 'rajkot', name: 'Rajkot', state: 'Gujarat', tier: 'Tier-3' },
  { id: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', tier: 'Tier-3' },
  { id: 'srinagar', name: 'Srinagar', state: 'Jammu & Kashmir', tier: 'Tier-3' },
  { id: 'madurai', name: 'Madurai', state: 'Tamil Nadu', tier: 'Tier-3' },
  { id: 'jodhpur', name: 'Jodhpur', state: 'Rajasthan', tier: 'Tier-3' },
  { id: 'raipur', name: 'Raipur', state: 'Chhattisgarh', tier: 'Tier-3' }
];

export const SECTORS = [
  { id: 'all', name: 'All Sectors' },
  { id: 'it', name: 'Information Technology' },
  { id: 'bpo', name: 'BPO & Customer Operations' },
  { id: 'bfsi', name: 'BFSI (Banking & Finance)' },
  { id: 'healthcare', name: 'Healthcare & Pharma' },
  { id: 'manufacturing', name: 'Manufacturing & Auto' },
  { id: 'retail', name: 'Retail & E-commerce' }
];

// Generates time-series data for the hiring chart
export const generateHiringTrend = (timeframe, city, sector) => {
  let points = 12;
  if (timeframe === '7d') points = 7;
  else if (timeframe === '30d') points = 30;
  else if (timeframe === '90d') points = 12; // weekly/monthly
  else if (timeframe === '1yr') points = 12; // monthly

  const labels = [];
  const baseDate = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const d = new Date();
    if (timeframe === '7d') {
      d.setDate(baseDate.getDate() - i);
      labels.push(d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }));
    } else if (timeframe === '30d') {
      d.setDate(baseDate.getDate() - i);
      labels.push(d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
    } else {
      d.setMonth(baseDate.getMonth() - i);
      labels.push(d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));
    }
  }

  // Generate deterministic-looking values based on city/sector hash
  const seed = (city ? city.length : 5) + (sector ? sector.length : 3);
  let baseVolume = 12000;
  let multiplier = 1.0;

  if (city) {
    const cityObj = CITIES.find(c => c.id === city);
    if (cityObj?.tier === 'Tier-3') {
      baseVolume = 2500;
    } else {
      baseVolume = 7500;
    }
  }

  if (sector && sector !== 'all') {
    if (sector === 'it') multiplier = 0.4;
    else if (sector === 'bpo') multiplier = 0.25;
    else if (sector === 'bfsi') multiplier = 0.15;
    else multiplier = 0.1;
  }

  let trendData = [];
  let currentVolume = baseVolume * multiplier;

  for (let i = 0; i < points; i++) {
    // Add some noise and a general trend
    // IT has been fluctuating, BPO is dropping due to LLMs, Healthcare is rising
    let trendFactor = 0;
    if (sector === 'bpo') trendFactor = -0.015; // downward
    else if (sector === 'healthcare') trendFactor = 0.008; // upward
    else if (sector === 'it') trendFactor = -0.004; // slight consolidation
    else trendFactor = 0.002; // slight upward overall

    const noise = Math.sin(i + seed) * 0.05 + (Math.cos(i * 1.5) * 0.03);
    currentVolume = currentVolume * (1 + trendFactor + noise);
    trendData.push({
      name: labels[i],
      Listings: Math.round(currentVolume),
      Applications: Math.round(currentVolume * (1.2 + Math.sin(i) * 0.2))
    });
  }

  return trendData;
};

// Skills Data
export const RISING_SKILLS = [
  { name: 'Generative AI Prompting', category: 'Tech', change: '+142%', rank: 1, source: 'LLM Integration' },
  { name: 'Local Language NLP', category: 'Tech', change: '+88%', rank: 2, source: 'Indic AI Models' },
  { name: 'Predictive Maintenance IoT', category: 'Core', change: '+74%', rank: 3, source: 'Industry 4.0' },
  { name: 'Clinical Data Analytics', category: 'Healthcare', change: '+67%', rank: 4, source: 'Pharma Digitization' },
  { name: 'EV Powertrain Design', category: 'Core', change: '+61%', rank: 5, source: 'Automotive Shift' },
  { name: 'AWS Cloud Security', category: 'Tech', change: '+55%', rank: 6, source: 'Infrastructure' },
  { name: 'Bilingual Customer Relations', category: 'Service', change: '+48%', rank: 7, source: 'Tier-2/3 Retail' },
  { name: 'Financial Risk Modeling', category: 'BFSI', change: '+43%', rank: 8, source: 'Fintech Credit' },
  { name: 'Agile Product Delivery', category: 'Management', change: '+39%', rank: 9, source: 'Hybrid Workforce' },
  { name: 'Robot Programming & PLC', category: 'Core', change: '+36%', rank: 10, source: 'Smart Factories' },
  { name: 'PostgreSQL Management', category: 'Tech', change: '+33%', rank: 11, source: 'DB Modernization' },
  { name: 'Supply Chain Analytics', category: 'Logistics', change: '+31%', rank: 12, source: 'D2C E-commerce' },
  { name: 'Python Automation Scripts', category: 'Tech', change: '+29%', rank: 13, source: 'Low-code Mitigation' },
  { name: 'Cybersecurity Compliance', category: 'Tech', change: '+27%', rank: 14, source: 'DPDP Act 2023' },
  { name: 'SEO & Content Growth Hack', category: 'Marketing', change: '+25%', rank: 15, source: 'Digital Brand Hubs' },
  { name: 'Microservices Architecture', category: 'Tech', change: '+22%', rank: 16, source: 'SaaS Expansion' },
  { name: 'RPA (UiPath) Integration', category: 'Tech', change: '+19%', rank: 17, source: 'Backoffice Automation' },
  { name: 'Omnichannel CRM Operations', category: 'Service', change: '+17%', rank: 18, source: 'Modern BPO' },
  { name: 'Precision Agriculture IoT', category: 'Core', change: '+15%', rank: 19, source: 'AgriTech Startups' },
  { name: 'UI/UX Interactive Prototyping', category: 'Design', change: '+12%', rank: 20, source: 'Product Led Growth' }
];

export const DECLINING_SKILLS = [
  { name: 'Manual Data Entry / Typing', category: 'Tech', change: '-78%', rank: 1, reason: 'AI OCR & Auto-extraction' },
  { name: 'English-Only Telecalling', category: 'Service', change: '-64%', rank: 2, reason: 'Conversational Voice Bots' },
  { name: 'Basic QA Manual Testing', category: 'Tech', change: '-58%', rank: 3, reason: 'AI Code Agents & Autotests' },
  { name: 'Standard Excel Formatting', category: 'Office', change: '-52%', rank: 4, reason: 'Copilot/AI Spreadsheet plugins' },
  { name: 'First-Line Tech Support (L1)', category: 'Service', change: '-49%', rank: 5, reason: 'Self-service AI Chatbots' },
  { name: 'Copywriting & Content Drafting', category: 'Marketing', change: '-47%', rank: 6, reason: 'Large Language Models (LLMs)' },
  { name: 'Basic HTML/CSS Slicing', category: 'Tech', change: '-42%', rank: 7, reason: 'No-code Site Builders & v0' },
  { name: 'Traditional Billing Systems', category: 'Retail', change: '-38%', rank: 8, reason: 'Auto-UPI & Smart POS' },
  { name: 'Medical Transcription', category: 'Healthcare', change: '-35%', rank: 9, reason: 'Real-time Speech-to-Text APIs' },
  { name: 'Stock Inventory Recording', category: 'Logistics', change: '-31%', rank: 10, reason: 'RFID & Automated ERPs' },
  { name: 'Basic CAD Drafting', category: 'Core', change: '-28%', rank: 11, reason: 'Generative Design Software' },
  { name: 'Document Translation', category: 'Office', change: '-26%', rank: 12, reason: 'Neural Machine Translation' },
  { name: 'Standard IT Desktop Admin', category: 'Tech', change: '-23%', rank: 13, reason: 'Cloud-managed Workspace tools' },
  { name: 'Outbound Cold Emailing', category: 'Marketing', change: '-21%', rank: 14, reason: 'Automated CRM Sequences' },
  { name: 'Video Subtitling & Sync', category: 'Media', change: '-19%', rank: 15, reason: 'Auto-captions (Whisper AI)' },
  { name: 'Simple Bookkeeping (Manual)', category: 'BFSI', change: '-17%', rank: 16, reason: 'Automated Ledger Tools' },
  { name: 'HR Resume Screening', category: 'Management', change: '-15%', rank: 17, reason: 'AI ATS Parsing Engines' },
  { name: 'Customer Chat Answering', category: 'Service', change: '-14%', rank: 18, reason: 'AI Agent Workflows' },
  { name: 'Retail Cashiering', category: 'Retail', change: '-12%', rank: 19, reason: 'Self-checkout & QR Billing' },
  { name: 'Basic Graphic Cropping', category: 'Design', change: '-10%', rank: 20, reason: 'AI Background Removers' }
];

// Skill Gap Map data comparing Employer Demand vs Curriculum (SWAYAM/NPTEL/PMKVY)
export const SKILL_GAP_MAP = [
  {
    skillName: 'Generative AI Integration & Prompt Engineering',
    employerDemand: 'Very High',
    status: 'gap',
    curriculums: [
      { portal: 'NPTEL', status: 'missing', comment: 'Lacks hands-on API projects' },
      { portal: 'SWAYAM', status: 'missing', comment: 'Theoretical AI models only' },
      { portal: 'PMKVY', status: 'missing', comment: 'No AI course framework active' }
    ]
  },
  {
    skillName: 'SQL Database & Data Pipeline Engineering',
    employerDemand: 'High',
    status: 'match',
    curriculums: [
      { portal: 'NPTEL', status: 'matched', comment: 'IIT Madras Database System course' },
      { portal: 'SWAYAM', status: 'matched', comment: 'Full SQL & RDBMS module' },
      { portal: 'PMKVY', status: 'missing', comment: 'Only Basic Computer Operator course' }
    ]
  },
  {
    skillName: 'EV Battery Management & Powertrain Design',
    employerDemand: 'High',
    status: 'gap',
    curriculums: [
      { portal: 'NPTEL', status: 'matched', comment: 'IIT KGP EV Technology course' },
      { portal: 'SWAYAM', status: 'missing', comment: 'No specialized EV curriculum' },
      { portal: 'PMKVY', status: 'missing', comment: 'Traditional motor repair only' }
    ]
  },
  {
    skillName: 'Indic Language Natural Language Processing (NLP)',
    employerDemand: 'Medium-High',
    status: 'gap',
    curriculums: [
      { portal: 'NPTEL', status: 'missing', comment: 'General NLP only (English corpus)' },
      { portal: 'SWAYAM', status: 'missing', comment: 'No active Indic NLP course' },
      { portal: 'PMKVY', status: 'missing', comment: 'No technical courses' }
    ]
  },
  {
    skillName: 'Cloud Security Architecture (AWS/Azure)',
    employerDemand: 'Very High',
    status: 'match',
    curriculums: [
      { portal: 'NPTEL', status: 'matched', comment: 'IIT Kharagpur Cloud Computing' },
      { portal: 'SWAYAM', status: 'matched', comment: 'Standard Information Security' },
      { portal: 'PMKVY', status: 'missing', comment: 'No Advanced IT syllabus' }
    ]
  },
  {
    skillName: 'IoT Industrial Robot Programming',
    employerDemand: 'Medium',
    status: 'gap',
    curriculums: [
      { portal: 'NPTEL', status: 'missing', comment: 'Robotics is purely mathematical' },
      { portal: 'SWAYAM', status: 'missing', comment: 'No industry PLC standard lab' },
      { portal: 'PMKVY', status: 'matched', comment: 'Industrial Automation Technician' }
    ]
  },
  {
    skillName: 'Clinical Trial Data Management',
    employerDemand: 'Medium-High',
    status: 'match',
    curriculums: [
      { portal: 'NPTEL', status: 'matched', comment: 'IIT Madras Biostatistics' },
      { portal: 'SWAYAM', status: 'matched', comment: 'Standard Pharmacovigilance' },
      { portal: 'PMKVY', status: 'missing', comment: 'Limited to hospital frontdesk' }
    ]
  }
];

// AI Vulnerability Index dataset (0-100)
export const VULNERABILITY_DATA = [
  { category: 'BPO Voice Agent / Telecaller', city: 'Pune', score: 87, activeListings: 1450, change: '-18%', level: 'Critical' },
  { category: 'Customer Care Executive', city: 'Indore', score: 84, activeListings: 720, change: '-14%', level: 'Critical' },
  { category: 'Data Entry Operator', city: 'Jaipur', score: 78, activeListings: 510, change: '-22%', level: 'Critical' },
  { category: 'Technical L1 Support Specialist', city: 'Coimbatore', score: 74, activeListings: 630, change: '-12%', level: 'High' },
  { category: 'Medical Transcriptionist', city: 'Nagpur', score: 82, activeListings: 290, change: '-25%', level: 'Critical' },
  { category: 'Retail Billing Clerk', city: 'Lucknow', score: 65, activeListings: 980, change: '-8%', level: 'High' },
  { category: 'Junior Accountant', city: 'Vizag', score: 58, activeListings: 810, change: '-4%', level: 'Medium' },
  { category: 'Graphic Asset Cropper', city: 'Surat', score: 71, activeListings: 430, change: '-16%', level: 'High' },
  { category: 'Manual QA Software Tester', city: 'Vadodara', score: 79, activeListings: 540, change: '-19%', level: 'Critical' },
  { category: 'Content Writer (General)', city: 'Bhopal', score: 76, activeListings: 320, change: '-28%', level: 'Critical' },
  { category: 'warehouse Inventory Recorder', city: 'Ludhiana', score: 62, activeListings: 480, change: '-5%', level: 'High' },
  { category: 'Office Receptionist', city: 'Agra', score: 55, activeListings: 340, change: '-7%', level: 'Medium' },
  { category: 'Bank Clerk / Teller', city: 'Varanasi', score: 68, activeListings: 610, change: '-11%', level: 'High' },
  { category: 'Industrial Quality Checker', city: 'Nashik', score: 45, activeListings: 790, change: '+3%', level: 'Medium' },
  { category: 'Frontline Logistics Dispatcher', city: 'Patna', score: 52, activeListings: 670, change: '-2%', level: 'Medium' },
  { category: 'SQL Database Developer', city: 'Pune', score: 28, activeListings: 2450, change: '+14%', level: 'Low' },
  { category: 'Cloud Security Analyst', city: 'Coimbatore', score: 14, activeListings: 890, change: '+38%', level: 'Low' },
  { category: 'IoT Firmware Developer', city: 'Indore', score: 21, activeListings: 410, change: '+22%', level: 'Low' },
  { category: 'EV Powertrain Engineer', city: 'Nagpur', score: 12, activeListings: 310, change: '+45%', level: 'Low' },
  { category: 'Healthcare Data Scientist', city: 'Lucknow', score: 8, activeListings: 180, change: '+52%', level: 'Low' }
];

// Profile Analyzer Engine simulating FastAPI backend output
export const analyzeWorkerProfile = async (profile) => {
  // Simulate network latency (800ms)
  await new Promise(resolve => setTimeout(resolve, 800));

  const { jobTitle, city, experience, writeUp } = profile;
  
  // NLP analysis simulation
  const normalizedTitle = jobTitle.trim().toLowerCase();
  const writeUpText = writeUp.trim().toLowerCase();
  
  let baseScore = 45;
  let severity = 'Medium';
  let primaryDriver = 'Algorithmic Business Automation';

  // Keyword check for high risk roles
  const highRiskKeywords = ['bpo', 'voice', 'call center', 'customer care', 'telecaller', 'telemarketing', 'data entry', 'typing', 'transcription', 'billing', 'clerk', 'qa manual', 'manual testing', 'receptionist', 'support l1', 'desktop support'];
  const lowRiskKeywords = ['developer', 'engineer', 'architect', 'data scientist', 'machine learning', 'cybersecurity', 'cloud', 'devops', 'product manager', 'scrum master', 'lead', 'ev design', 'r&d'];
  
  const hasHighRisk = highRiskKeywords.some(kw => normalizedTitle.includes(kw));
  const hasLowRisk = lowRiskKeywords.some(kw => normalizedTitle.includes(kw));

  if (hasHighRisk) {
    baseScore = 72 + Math.floor(Math.random() * 16); // 72-88
  } else if (hasLowRisk) {
    baseScore = 10 + Math.floor(Math.random() * 18); // 10-28
  } else {
    // Check writeup for tools/methods
    if (writeUpText.includes('excel') || writeUpText.includes('word') || writeUpText.includes('typing') || writeUpText.includes('emails')) {
      baseScore += 12;
    }
    if (writeUpText.includes('ai') || writeUpText.includes('python') || writeUpText.includes('code') || writeUpText.includes('automation')) {
      baseScore -= 10;
    }
    baseScore += Math.floor(Math.random() * 10) - 5;
  }

  // Bound score
  baseScore = Math.max(5, Math.min(98, baseScore));

  if (baseScore >= 75) severity = 'HIGH RISK';
  else if (baseScore >= 40) severity = 'MEDIUM RISK';
  else severity = 'LOW RISK';

  // Find city metrics
  const cityData = CITIES.find(c => c.id === city || c.name.toLowerCase() === city.toLowerCase()) || CITIES[0];
  
  // Simulate Live regional dynamics
  const momChange = hasHighRisk ? (-10 - Math.floor(Math.random() * 15)) : (5 + Math.floor(Math.random() * 25));
  const activeListings = hasHighRisk ? Math.max(12, Math.round(1500 / (experience + 1))) : Math.round(300 + (experience * 120));
  
  // Create personalized Roadmap based on title and score
  const roadmap = [];
  
  if (baseScore >= 60) {
    // Risk reduction path: Shift from manual to automation/AI support
    roadmap.push({
      weeks: 'Wk 1-2',
      focus: 'Generative AI Tools & Office Copilots',
      goals: 'Master Prompt Engineering, ChatGPT/Copilot for email drafting, report generation, and data summarizing.',
      source: 'SWAYAM AI Fundamentals',
      duration: 'Free, 4 hrs/wk',
      justification: `Directly replaces manual drafting tasks highlighted in your writeup, reducing BPO automation pressure in ${cityData.name}.`
    });
    roadmap.push({
      weeks: 'Wk 3-5',
      focus: 'SQL & Interactive Data Visualization',
      goals: 'Learn fundamental database querying, filtering, and building interactive Dashboards in PowerBI or Tableau.',
      source: 'NPTEL - IIT Madras',
      duration: 'Free, 6 hrs/wk',
      justification: 'Transforms your data entry capability into business intelligence reporting, elevating your market value.'
    });
    roadmap.push({
      weeks: 'Wk 6-8',
      focus: 'Automated CRM & Workflow Orchestration',
      goals: 'Understand Salesforce/HubSpot automation workflows and RPA (UiPath) fundamentals for backoffice operations.',
      source: `PMKVY Center - ${cityData.name}`,
      duration: 'State Funded, 8 hrs/wk',
      justification: `Aligns with the regional hiring surge (+17% CRM roles) tracked in Tier-2 locations like ${cityData.name}.`
    });
  } else {
    // Career expansion path: Shift from engineering to AI/MLOps/Architect
    roadmap.push({
      weeks: 'Wk 1-3',
      focus: 'LLM Orchestration & LangChain Frameworks',
      goals: 'Implement retrieval-augmented generation (RAG), agentic workflows, and local LLM fine-tuning APIs.',
      source: 'NPTEL - IIT Kharagpur',
      duration: 'Free, 8 hrs/wk',
      justification: 'Helps you build cognitive system wrappers, making your software engineering profile highly future-proof.'
    });
    roadmap.push({
      weeks: 'Wk 4-6',
      focus: 'Cloud Native MLOps & Kubernetes Deployments',
      goals: 'Set up pipelines for continuous training, model versioning, and deploying inference engines on cloud instances.',
      source: 'SWAYAM Advanced Cloud Security',
      duration: 'Free, 6 hrs/wk',
      justification: `Meets the massive AWS Cloud Security demand (+55%) which has 2,000+ unfilled vacancies near ${cityData.name}.`
    });
    roadmap.push({
      weeks: 'Wk 7-8',
      focus: 'Responsible AI & Data Privacy Laws (DPDP)',
      goals: 'Audit AI models for bias, ensure compliance with India\'s DPDP Act 2023, and setup model guardrails.',
      source: 'IIT Madras CoE',
      duration: 'Free, 4 hrs/wk',
      justification: 'Prepares you for executive compliance roles which are surging across tier-2 corporate offices.'
    });
  }

  // Pre-generate chatbot responses for this profile session
  const chatbotSessions = {
    "why is my risk score so high?": baseScore >= 60 
      ? `Your AI Risk Score is ${baseScore}/100 because your current role "${jobTitle}" has a high density of routine text and vocal operations. AI tools like LLM-powered voice agents and auto-summarizers are being deployed in ${cityData.name} at a rapid pace, driving active listings for manual agents down by ${Math.abs(momChange)}% MoM. Modernizing your skills in data analytical queries and GenAI workflow automation is critical.`
      : `Your AI Risk Score is relatively low (${baseScore}/100) because your technical background in "${jobTitle}" involves non-routine problem-solving and custom configuration, which is difficult to automate with standard LLMs. However, continuing to integrate cloud systems and MLOps remains important to maintain this safety buffer.`,
    
    "what jobs are safer for someone like me in my city?": baseScore >= 60
      ? `In ${cityData.name}, transition roles such as "Customer Success Specialist" (which requires relationship handling rather than telecalling), "Junior Data Analyst" (replaces data entry), and "AI Operations Operator" are seeing a hiring spike. Active job postings in these categories in ${cityData.name} have grown by 14% over the last 30 days.`
      : `In ${cityData.name}, roles like "Senior Cloud Architect", "AI Integration Engineer", and "Enterprise Cybersecurity consultant" are highly resilient. They exhibit less than 5% vulnerability index and enjoy average salary premiums of 45% compared to baseline developers.`,
    
    "show me paths that take less than 3 months.": `The recommended roadmap is structured for 8 weeks (approx. 2 months), which is fully achievable. 
1. **Weeks 1-3** focus on immediate low-code AI tools (SWAYAM).
2. **Weeks 4-6** focus on foundational data skills (NPTEL).
3. **Weeks 7-8** focus on local practical certificates (PMKVY Center - ${cityData.name}).
You can start immediately with the free, self-paced SWAYAM portal courses online.`,
    
    "how many active bpo jobs are in indore right now?": `According to our latest market crawl for Indore:
- **Total active BPO Listings**: 720 active roles (Down 14% compared to last month).
- **Core Skill Gaps**: Employers are rejecting 62% of applicants due to a lack of multi-channel CRM ticketing and basic automated email drafting skills.
- **Top Hirer**: Teleperformance Indore & Concentrix (Indore Campus), now prioritising candidates with basic ChatGPT prompt experience.`,
    
    "मुझे कहाँ से शुरू करना चाहिए? (hindi support)": baseScore >= 60
      ? `आपको सबसे पहले **SWAYAM** या **PMKVY** के बुनियादी कोर्सेज से शुरुआत करनी चाहिए:
1. **GenAI Tools**: यह सीखें कि कैसे ChatGPT और Microsoft Copilot का उपयोग करके आप ईमेल ड्राफ्टिंग और कस्टमर रिप्लाई को ऑटोमेट कर सकते हैं।
2. **स्थानीय PMKVY Center**: अपने शहर ${cityData.name} में स्थित PMKVY केंद्र पर जाएं और "AI & Data Entry Operator" या "CRM Specialist" कोर्स के लिए पंजीकरण कराएं। ये कोर्सेज सरकारी तौर पर मुफ्त (Free) हैं।
3. **NPTEL**: यदि आप तकनीकी बैकग्राउंड बढ़ाना चाहते हैं, तो IIT मद्रास का 'SQL Database' कोर्स चुनें।`
      : `आपको सबसे पहले **NPTEL (IIT Madras/Kharagpur)** से शुरुआत करनी चाहिए:
1. **LangChain & AI Orchestration**: यह सीखें कि कोडिंग टूल्स को कैसे AI के साथ जोड़ा जाता है।
2. **Cloud Security**: AWS / Azure सुरक्षा की जानकारी हासिल करें जो वर्तमान में सबसे अधिक मांग में है।
ये सभी कोर्सेज ऑनलाइन तथा मुफ्त उपलब्ध हैं।`
  };

  return {
    score: baseScore,
    severity,
    primaryDriver,
    momChange,
    activeListings,
    peerComparison: baseScore >= 75 ? `Top ${10 + Math.floor(baseScore/10)}% at-risk` : `Bottom ${Math.floor(baseScore/2)}% at-risk`,
    city: cityData.name,
    roadmap,
    chatbotSessions,
    submittedProfile: { jobTitle, city: cityData.name, experience, writeUp }
  };
};
