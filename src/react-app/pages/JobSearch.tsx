import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/react-app/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router";
import { Button } from "@/react-app/components/ui/button";
import { Input } from "@/react-app/components/ui/input";
import { Checkbox } from "@/react-app/components/ui/checkbox";
import { Label } from "@/react-app/components/ui/label";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import SidebarLayout from "@/react-app/components/SidebarLayout";
import {
  Search,
  MapPin,
  ExternalLink,
  Loader2,
  Building2,
  ClipboardPaste,
  Globe,
  Sparkles,
  FileText,
  Mic,
  DollarSign,
  Target,
  X,
  ArrowRight,
  Users,
  Info,
  Check,
  ChevronDown,
} from "lucide-react";
import { useMyProfiles } from "@/react-app/hooks/useProfile";
import { getRoleFitDisplay, getRoleFitScoreBgClass, getRoleFitScorePanelClass } from "@/react-app/utils/roleFit";

// Source colors for job board badges
const sourceColors: Record<string, string> = {
  LinkedIn: "bg-blue-600",
  Indeed: "bg-purple-600",
  Naukri: "bg-red-600",
  Foundit: "bg-orange-600",
  Glassdoor: "bg-green-600",
  JSearch: "bg-emerald-600",
};

// Platform chips for search
const platforms = [
  { id: "linkedin", name: "LinkedIn", color: "bg-blue-600" },
  { id: "naukri", name: "Naukri", color: "bg-red-600" },
  { id: "indeed", name: "Indeed", color: "bg-purple-600" },
  { id: "glassdoor", name: "Glassdoor", color: "bg-green-600" },
  { id: "foundit", name: "Foundit", color: "bg-orange-600" },
];

// Generate dynamic job board search URLs
const getPlatformSearchUrl = (platformId: string, query: string, location: string) => {
  const q = encodeURIComponent(query);
  const loc = encodeURIComponent(location);
  switch (platformId) {
    case "linkedin":
      return `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`;
    case "naukri":
      return `https://www.naukri.com/jobs?q=${q}&l=${loc}`;
    case "indeed":
      return `https://www.indeed.com/jobs?q=${q}&l=${loc}`;
    case "glassdoor":
      return `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${q}&locKeyword=${loc}`;
    case "foundit":
      return `https://www.foundit.in/search?query=${q}&locations=${loc}`;
    default:
      return "#";
  }
};

// Source dropdown options
const sourceOptions = [
  "LinkedIn",
  "Naukri",
  "Indeed",
  "Glassdoor",
  "Foundit",
  "Company Website",
  "Referral",
  "Other",
];

// Popular companies for autocomplete
const popularCompanies = [
  { name: "Amazon", industry: "E-commerce & Cloud", logo: "🛒", careersUrl: "https://www.amazon.jobs" },
  { name: "Google", industry: "Technology", logo: "🔍", careersUrl: "https://careers.google.com" },
  { name: "Microsoft", industry: "Technology", logo: "💻", careersUrl: "https://careers.microsoft.com" },
  { name: "Infosys", industry: "IT Services", logo: "🏢", careersUrl: "https://www.infosys.com/careers" },
  { name: "TCS", industry: "IT Services", logo: "🏢", careersUrl: "https://www.tcs.com/careers" },
  { name: "Wipro", industry: "IT Services", logo: "🏢", careersUrl: "https://careers.wipro.com" },
  { name: "HDFC Bank", industry: "Banking", logo: "🏦", careersUrl: "https://www.hdfcbank.com/careers" },
  { name: "Reliance", industry: "Conglomerate", logo: "🏭", careersUrl: "https://careers.ril.com" },
  { name: "Flipkart", industry: "E-commerce", logo: "🛍️", careersUrl: "https://www.flipkartcareers.com" },
  { name: "Swiggy", industry: "Food Tech", logo: "🍔", careersUrl: "https://careers.swiggy.com" },
  { name: "Zomato", industry: "Food Tech", logo: "🍕", careersUrl: "https://www.zomato.com/careers" },
  { name: "Razorpay", industry: "Fintech", logo: "💳", careersUrl: "https://razorpay.com/jobs" },
  { name: "Paytm", industry: "Fintech", logo: "📱", careersUrl: "https://paytm.com/careers" },
  { name: "PhonePe", industry: "Fintech", logo: "📲", careersUrl: "https://www.phonepe.com/careers" },
  { name: "Ola", industry: "Mobility", logo: "🚗", careersUrl: "https://www.olacabs.com/careers" },
  { name: "Uber", industry: "Mobility", logo: "🚘", careersUrl: "https://www.uber.com/careers" },
  { name: "Meesho", industry: "E-commerce", logo: "🛒", careersUrl: "https://www.meesho.io/careers" },
  { name: "BYJU'S", industry: "EdTech", logo: "📚", careersUrl: "https://byjus.com/careers" },
  { name: "Dream11", industry: "Gaming", logo: "🎮", careersUrl: "https://www.dreamsports.group/careers" },
  { name: "Zerodha", industry: "Fintech", logo: "📈", careersUrl: "https://zerodha.com/careers" },
];

// Job interface for search results
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  postedDate: string;
  source: string; // Raw source (e.g. "JSearch")
  publisher: string; // Mapped to dropdown option (e.g. "LinkedIn", "Indeed")
  url: string;
  description: string; // Truncated preview for card display
  fullDescription: string; // Full JD for form handoff
  matchScore?: number;
  employmentType?: string;
}

// JSearch API response type
interface JSearchJob {
  job_id: string;
  job_title: string;
  employer_name: string;
  job_city: string;
  job_country: string;
  job_employment_type: string;
  job_posted_at_datetime_utc: string;
  job_apply_link: string;
  job_description?: string;
  job_min_salary?: number;
  job_max_salary?: number;
  job_salary_currency?: string;
  job_publisher?: string;
}

// Map JSearch publisher names to our dropdown source options
const mapPublisherToSource = (publisher: string | undefined): string => {
  if (!publisher) return "Other";
  const p = publisher.toLowerCase();
  
  if (p.includes("linkedin")) return "LinkedIn";
  if (p.includes("indeed")) return "Indeed";
  if (p.includes("glassdoor")) return "Glassdoor";
  if (p.includes("naukri")) return "Naukri";
  if (p.includes("foundit")) return "Foundit";
  
  // Fallback for other aggregators
  return "Other";
};

// Format relative time from UTC datetime
const formatRelativeTime = (utcDate: string): string => {
  if (!utcDate) return "Recently";
  const date = new Date(utcDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return diffMins <= 1 ? "Just now" : `${diffMins} minutes ago`;
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  if (diffDays < 7) return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return date.toLocaleDateString();
};

const formatSalary = (amount: number): string => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString()}`;
};

type TabType = "paste" | "search" | "company";

export default function JobSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isPending: authPending } = useAuth();
  const { profiles } = useMyProfiles();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Track if we've already handled URL params to prevent re-triggering
  const urlParamsHandled = useRef(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("paste");

  // Tab 1: Paste JD state
  const [jdText, setJdText] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobSource, setJobSource] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [tailorResume, setTailorResume] = useState(true);
  const [optimizeProfile, setOptimizeProfile] = useState(true);
  const [generateInterviewPrep, setGenerateInterviewPrep] = useState(true);
  const [showSalaryBenchmarks, setShowSalaryBenchmarks] = useState(true);
  const [trackApplication, setTrackApplication] = useState(true);
  const [generatingPackage, setGeneratingPackage] = useState(false);

  // Tab 2: Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchResults, setSearchResults] = useState<Job[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [matchScores, setMatchScores] = useState<Record<string, number | null>>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalResultsFromApi, setTotalResultsFromApi] = useState<number | null>(null);
  
  // Cache for search results (key: "query|location|page|perPage")
  const searchCacheRef = useRef<Map<string, { jobs: Job[]; hasMore: boolean }>>(new Map());
  const scrollPositionRef = useRef<number>(0);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  
  // Track completed packages (persisted in sessionStorage)
  const [completedPackages, setCompletedPackages] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem("ascend_packages_built");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  
  // Inline expansion panel state for job cards
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [packageOptions, setPackageOptions] = useState({
    tailorResume: true,
    optimizeProfile: true,
    interviewPrep: true,
    trackApplication: true,
  });
  const [generatingPackageForJob, setGeneratingPackageForJob] = useState<string | null>(null);
  const [loadingScores, setLoadingScores] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Tab 3: Company search state
  const [companyQuery, setCompanyQuery] = useState("");
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<typeof popularCompanies[0] | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [modalJdText, setModalJdText] = useState("");

  const defaultProfileId = profiles.length > 0 ? profiles[0].id : null;
  const defaultProfile = profiles.length > 0 ? profiles[0] : null;

  // Set page title
  useEffect(() => {
    document.title = "Ascend | Find & Apply";
    return () => {
      document.title = "Ascend";
    };
  }, []);
  
  // Handle URL params for returning from tailor page (pre-fill and auto-search)
  const [shouldAutoSearch, setShouldAutoSearch] = useState(false);
  useEffect(() => {
    if (urlParamsHandled.current) return;
    const qParam = searchParams.get("q");
    const lParam = searchParams.get("l");
    if (qParam) {
      urlParamsHandled.current = true;
      setSearchQuery(qParam);
      if (lParam) setSearchLocation(lParam);
      setActiveTab("search");
      setShouldAutoSearch(true);
    }
  }, [searchParams]); // urlParamsHandled is a ref (stable); setters are stable

  // Filter companies based on query
  const filteredCompanies = popularCompanies.filter((c) =>
    c.name.toLowerCase().includes(companyQuery.toLowerCase())
  );

  // Track platform referral click
  const trackPlatformReferral = async (platform: string, jobTitle?: string, jobUrl?: string) => {
    try {
      await fetch("/api/tracking/platform-referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ platform, jobTitle, jobUrl }),
      });
    } catch (e) {
      console.error("Failed to track platform referral:", e);
    }
  };

  // Track company search
  const trackCompanySearch = async (companyName: string, companyUrl?: string) => {
    try {
      await fetch("/api/tracking/company-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ companyName, companyUrl }),
      });
    } catch (e) {
      console.error("Failed to track company search:", e);
    }
  };

  // Handle generate application package
  const handleGeneratePackage = async () => {
    if (!jdText.trim()) {
      alert("Please paste a job description first");
      return;
    }
    if (!defaultProfileId) {
      alert("Please create a profile first");
      return;
    }

    setGeneratingPackage(true);

    // Track the application
    if (trackApplication) {
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            profile_id: defaultProfileId,
            job_title: jobTitle || "Untitled Position",
            company: company || "Unknown Company",
            job_url: jobUrl || null,
            source: jobSource || "Other",
            status: "wishlist",
            job_description: jdText,
          }),
        });
        localStorage.setItem("ascend_has_tracked", "true");
      } catch (e) {
        console.error("Failed to track application:", e);
      }
    }

    // Navigate to tailor page with JD context
    setTimeout(() => {
      setGeneratingPackage(false);
      navigate(`/tailor`, {
        state: {
          jobDescription: jdText,
          jobTitle: jobTitle,
          company: company,
          generateInterviewPrep,
          showSalaryBenchmarks,
        },
      });
    }, 1000);
  };

  // Generate cache key for search results
  const getCacheKey = (query: string, location: string, page: number, perPage: number) =>
    `${query}|${location}|${page}|${perPage}`;

  // Handle job board search via JSearch API
  const handleSearch = useCallback(async (loadMore = false) => {
    if (!searchQuery.trim()) return;

    const pageToFetch = loadMore ? currentPage + 1 : 1;
    const cacheKey = getCacheKey(searchQuery.trim(), searchLocation.trim(), pageToFetch, resultsPerPage);
    
    // Check cache first
    const cached = searchCacheRef.current.get(cacheKey);
    if (cached && !loadMore) {
      setSearchResults(cached.jobs);
      setHasMoreResults(cached.hasMore);
      setCurrentPage(1);
      setHasSearched(true);
      return;
    }

    if (loadMore) {
      setLoadingMore(true);
    } else {
      setSearching(true);
      setSearchResults([]);
      setCurrentPage(1);
      setTotalResultsFromApi(null);
    }
    
    setHasSearched(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        query: searchQuery.trim(),
        location: searchLocation.trim(),
        country: "in",
        page: pageToFetch.toString(),
        num_results: resultsPerPage.toString(),
      });

      const response = await fetch(`/api/jsearch?${params.toString()}`);

      if (!response.ok) {
        if (loadMore) setLoadingMore(false);
        // Handle specific error types with user-friendly messages
        if (response.status >= 500) {
          setSearchError("Job search is temporarily unavailable. Try searching directly on the job boards below.");
          setSearching(false);
          return;
        }
        const data = await response.json().catch(() => ({} as { error?: string }));
        if (response.status === 401 || response.status === 403) {
          console.error("[JSearch] API authentication failed:", data.error);
          setSearchError("Job search is temporarily unavailable. Use the links below to search directly.");
        } else if (response.status === 429) {
          setSearchError("Too many searches. Please wait a moment and try again.");
        } else {
          console.error("[JSearch] Search failed:", response.status, data.error);
          setSearchError("Search unavailable right now. Try searching directly on the job boards below.");
        }
        setSearching(false);
        return;
      }

      const data = await response.json();
      const totalFromApi = typeof data.totalResults === "number" ? data.totalResults : null;
      if (totalFromApi !== null) setTotalResultsFromApi(totalFromApi);

      // Map JSearch API response to our Job interface (RapidAPI returns data in 'data' field)
      const jobs: Job[] = (data.data || []).map((job: JSearchJob, index: number) => {
        const fullDesc = job.job_description || "";
        return {
          id: job.job_id || `job-${pageToFetch}-${index}`,
          title: job.job_title || "Untitled Position",
          company: job.employer_name || "Unknown Company",
          location: [job.job_city, job.job_country].filter(Boolean).join(", ") || "Not specified",
          postedDate: formatRelativeTime(job.job_posted_at_datetime_utc),
          source: "JSearch",
          publisher: mapPublisherToSource(job.job_publisher),
          url: job.job_apply_link || "#",
          description: fullDesc.length > 300 ? fullDesc.substring(0, 300) + "..." : fullDesc,
          fullDescription: fullDesc,
          employmentType: job.job_employment_type,
          salaryMin: job.job_min_salary,
          salaryMax: job.job_max_salary,
        };
      });

      // Determine if there are more results: full page suggests more, or we're under total when API provides it
      const totalLoadedAfter = loadMore ? searchResults.length + jobs.length : jobs.length;
      const hasMoreByPage = jobs.length >= resultsPerPage;
      const hasMore = totalFromApi != null
        ? totalLoadedAfter < totalFromApi
        : hasMoreByPage;
      
      // Cache the results
      searchCacheRef.current.set(cacheKey, { jobs, hasMore });
      
      if (loadMore) {
        setSearchResults((prev) => [...prev, ...jobs]);
        setCurrentPage(pageToFetch);
        setLoadingMore(false);
      } else {
        setSearchResults(jobs);
        setCurrentPage(1);
        setSearching(false);
      }
      
      setHasMoreResults(hasMore);

      // Fetch stored role fit assessments (consistent with full analysis page)
      if (defaultProfileId && jobs.length > 0) {
        setLoadingScores(true);
        try {
          const scoreResponse = await fetch("/api/jobs/stored-fit-scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              jobs: jobs.map(j => ({
                id: j.id,
                title: j.title,
                company: j.company,
                fullDescription: j.fullDescription || j.description,
                description: j.fullDescription || j.description,
              })),
            }),
          });
          
          if (scoreResponse.ok) {
            const scoreData = await scoreResponse.json();
            setMatchScores((prev) => ({ ...prev, ...(scoreData.scores || {}) }));
          }
        } catch (e) {
          console.error("Failed to get stored fit scores:", e);
        }
        setLoadingScores(false);
      }
    } catch (error) {
      console.error("[JSearch] Network error:", error);
      setSearchError("Search unavailable right now. Try searching directly on the job boards below.");
      setSearching(false);
      setLoadingMore(false);
    }
  }, [searchQuery, searchLocation, currentPage, resultsPerPage, defaultProfileId, searchResults.length]);

  // Handle results per page change (preserves query & location)
  const handleResultsPerPageChange = (newPerPage: number) => {
    setResultsPerPage(newPerPage);
    searchCacheRef.current.clear();
    if (hasSearched && searchQuery.trim()) {
      setTimeout(() => handleSearch(), 0);
    }
  };

  // Save scroll position before navigating away
  const saveScrollPosition = () => {
    if (resultsContainerRef.current) {
      scrollPositionRef.current = resultsContainerRef.current.scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY;
    }
  };
  
  // Restore scroll position when returning (scrollPositionRef is stable)
  useEffect(() => {
    if (searchResults.length > 0 && scrollPositionRef.current > 0) {
      setTimeout(() => {
        window.scrollTo(0, scrollPositionRef.current);
      }, 100);
    }
  }, [searchResults.length]);
  
  // Auto-search when returning from tailor page with URL params
  useEffect(() => {
    if (shouldAutoSearch && searchQuery.trim()) {
      setShouldAutoSearch(false);
      handleSearch();
    }
  }, [shouldAutoSearch, searchQuery, handleSearch]);

  // Toggle expansion panel for job card
  const handleToggleExpansion = (jobId: string) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
    // Reset options when opening a new panel
    if (expandedJobId !== jobId) {
      setPackageOptions({
        tailorResume: true,
        optimizeProfile: true,
        interviewPrep: true,
        trackApplication: true,
      });
    }
  };

  // Handle "Generate Package" from expansion panel on job card
  // Mark a job as having a completed package
  const markPackageComplete = (jobId: string) => {
    setCompletedPackages(prev => {
      const updated = new Set(prev);
      updated.add(jobId);
      try {
        sessionStorage.setItem("ascend_packages_built", JSON.stringify([...updated]));
      } catch (e) {
        console.error("Failed to persist package completion:", e);
      }
      return updated;
    });
  };

  const handleGeneratePackageFromCard = async (job: Job) => {
    // Save scroll position before navigating away
    saveScrollPosition();
    
    if (!defaultProfileId) {
      alert("Please create a profile first");
      return;
    }
    
    // Mark this job as having a package built
    markPackageComplete(job.id);
    
    setGeneratingPackageForJob(job.id);
    
    // Track application if option is selected
    if (packageOptions.trackApplication) {
      try {
        await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            profile_id: defaultProfileId,
            job_title: job.title,
            company: job.company,
            job_url: job.url,
            source: job.publisher || "Other",
            status: "wishlist",
            job_description: job.fullDescription,
          }),
        });
        localStorage.setItem("ascend_has_tracked", "true");
      } catch (e) {
        console.error("Failed to track application:", e);
      }
    }
    
    // Navigate to tailor page with complete job data and return info
    setTimeout(() => {
      setGeneratingPackageForJob(null);
      setExpandedJobId(null);
      navigate(`/tailor`, {
        state: {
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.fullDescription,
          jobUrl: job.url,
          publisher: job.publisher,
          location: job.location,
          generateInterviewPrep: packageOptions.interviewPrep,
          returnTo: "/jobs",
          returnSearch: {
            query: searchQuery,
            location: searchLocation,
          },
        },
      });
    }, 500);
  };

  // Handle view original (opens in new tab and tracks)
  const handleViewOriginal = (job: Job) => {
    trackPlatformReferral(job.source, job.title, job.url);
    window.open(job.url, "_blank");
  };

  // Handle company selection
  const handleSelectCompany = (company: typeof popularCompanies[0]) => {
    setSelectedCompany(company);
    setCompanyQuery(company.name);
    setShowCompanyDropdown(false);
    trackCompanySearch(company.name, company.careersUrl);
  };

  // Handle paste from company page modal
  const handlePasteFromCompany = () => {
    if (!modalJdText.trim()) return;
    setJdText(modalJdText);
    setCompany(selectedCompany?.name || "");
    setJobSource("Company Website");
    setShowPasteModal(false);
    setModalJdText("");
    setActiveTab("paste");
  };



  if (authPending) {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Find & Apply</h1>
            <p className="text-muted-foreground">
              Your command centre for job discovery and applications
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-xl mb-8">
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "paste"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste a JD
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "search"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Search className="w-4 h-4" />
              Search Job Boards
            </button>
            <button
              onClick={() => setActiveTab("company")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === "company"
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Search Company Pages
            </button>
          </div>

          {/* TAB 1: Paste a JD */}
          {activeTab === "paste" && (
            <div className="space-y-6">
              {/* Hero JD Textarea */}
              <div className="bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent border border-primary/10 rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center">
                    <ClipboardPaste className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      Found a role? Paste the description and let Ascend do the rest.
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      We'll tailor your resume, optimize your profile, and prep you for interviews
                    </p>
                  </div>
                </div>
                <Textarea
                  placeholder="Paste the full job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="min-h-[200px] text-base resize-none bg-background"
                />
              </div>

              {/* Job Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Job Title</Label>
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">Company</Label>
                  <Input
                    placeholder="e.g. Google"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Where you found it
                  </Label>
                  <Select value={jobSource} onValueChange={setJobSource}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceOptions.map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Job URL <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    placeholder="https://..."
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Action Toggles */}
              <div className="bg-muted/50 rounded-xl p-6">
                <h3 className="font-medium mb-4">What should Ascend do?</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={tailorResume}
                      onCheckedChange={(c) => setTailorResume(c as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">Tailor Resume</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={optimizeProfile}
                      onCheckedChange={(c) => setOptimizeProfile(c as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm">Optimize Profile</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={generateInterviewPrep}
                      onCheckedChange={(c) => setGenerateInterviewPrep(c as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-primary" />
                      <span className="text-sm">Generate Interview Prep</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={showSalaryBenchmarks}
                      onCheckedChange={(c) => setShowSalaryBenchmarks(c as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <span className="text-sm">Show Salary Benchmarks</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={trackApplication}
                      onCheckedChange={(c) => setTrackApplication(c as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm">Track Application</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Generate CTA */}
              <Button
                size="lg"
                className="w-full py-6 text-lg gap-3"
                onClick={handleGeneratePackage}
                disabled={!jdText.trim() || generatingPackage}
              >
                {generatingPackage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Your Application Package...
                  </>
                ) : (
                  <>
                    Generate My Application Package
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* TAB 2: Search Job Boards */}
          {activeTab === "search" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent border border-primary/10 rounded-2xl p-6">
                <Label className="text-sm font-medium mb-2 block">
                  Search across top job boards
                </Label>
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Job title, skills, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-12"
                    />
                  </div>
                  <div className="w-64 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      className="pl-10 h-12"
                    />
                  </div>
                  <Button
                    size="lg"
                    className="h-12 px-8"
                    onClick={() => handleSearch()}
                    disabled={searching}
                  >
                    {searching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Search"
                    )}
                  </Button>
                </div>

                {/* Platform Chips */}
                <div className="flex gap-2 mt-4 flex-wrap">
                  {platforms.map((platform) => (
                    <a
                      key={platform.id}
                      href={getPlatformSearchUrl(platform.id, searchQuery, searchLocation)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => trackPlatformReferral(platform.name)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${platform.color} text-white hover:opacity-90`}
                    >
                      {platform.name}
                    </a>
                  ))}
                </div>
              </div>

              {/* Search Results */}
              {searching && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              {/* Error State */}
              {!searching && hasSearched && searchError && (
                <div className="text-center py-12 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl">
                  <Search className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                  <p className="text-foreground mb-4 max-w-md mx-auto">
                    {searchError}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Search directly on these job boards:
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {platforms.map((p) => (
                      <a
                        key={p.id}
                        href={getPlatformSearchUrl(p.id, searchQuery, searchLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackPlatformReferral(p.name)}
                        className={`px-3 py-1.5 rounded-full text-sm text-white ${p.color} hover:opacity-90 transition-opacity`}
                      >
                        Search on {p.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results State */}
              {!searching && hasSearched && !searchError && searchResults.length === 0 && (
                <div className="text-center py-12 bg-muted/30 rounded-xl">
                  <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or search directly on job boards
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {platforms.map((p) => (
                      <a
                        key={p.id}
                        href={getPlatformSearchUrl(p.id, searchQuery, searchLocation)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackPlatformReferral(p.name)}
                        className={`px-3 py-1.5 rounded-full text-sm text-white ${p.color} hover:opacity-90 transition-opacity`}
                      >
                        Search on {p.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!searching && searchResults.length > 0 && (
                <div className="space-y-4" ref={resultsContainerRef}>
                  {/* Result count: "Showing X of Y results" */}
                  <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border">
                    <div className="text-sm text-muted-foreground">
                      Showing{" "}
                      <span className="font-medium text-foreground">{searchResults.length.toLocaleString()}</span>
                      {totalResultsFromApi != null
                        ? ` of ${totalResultsFromApi.toLocaleString()}`
                        : hasMoreResults
                          ? "+"
                          : ""}{" "}
                      results
                      {searchQuery && (
                        <> for &quot;{searchQuery}&quot;{searchLocation ? ` in ${searchLocation}` : ""}</>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">Results per page:</span>
                      <select
                        value={resultsPerPage}
                        onChange={(e) => handleResultsPerPageChange(Number(e.target.value))}
                        className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>
                  
                  {loadingScores && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Calculating match scores against your profile...
                    </div>
                  )}

                  {searchResults.map((job) => (
                    <div
                      key={job.id}
                      className={`bg-background border border-border rounded-xl p-6 hover:border-primary/30 transition-colors ${
                        expandedJobId === job.id ? "max-h-[80vh] overflow-y-auto" : ""
                      }`}
                    >
                      {/* Card Header - Sticky when panel is expanded */}
                      <div
                        className={`${
                          expandedJobId === job.id
                            ? "sticky top-0 z-10 bg-background pb-4 -mx-6 px-6 -mt-6 pt-6 border-b border-border shadow-sm"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs text-white ${
                                  sourceColors[job.source] || "bg-gray-500"
                                }`}
                              >
                                {job.source}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {job.postedDate}
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold mb-1">{job.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-4 h-4" />
                                {job.company}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </span>
                              {job.employmentType && (
                                <span className="px-2 py-0.5 bg-muted rounded text-xs">
                                  {job.employmentType}
                                </span>
                              )}
                              {job.salaryMin && job.salaryMax && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {job.description}
                            </p>
                          </div>

                          {/* Match Score or Package Ready Badge — uses stored Role Fit only, no quick-estimate */}
                          {completedPackages.has(job.id) ? (
                            <div className="flex-shrink-0 px-4 py-2 bg-emerald-500 text-white font-semibold text-sm rounded-full flex items-center gap-1.5">
                              <Check className="w-4 h-4" />
                              Package Ready
                            </div>
                          ) : (() => {
                            const fit = getRoleFitDisplay(matchScores[job.id], loadingScores);
                            if (fit.status === "score") {
                              return (
                                <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${getRoleFitScoreBgClass(fit.value)}`}>
                                  {fit.value}%
                                </div>
                              );
                            }
                            if (fit.status === "loading") {
                              return (
                                <div className="flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center bg-muted border border-border">
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                              );
                            }
                            return (
                              <div className="flex-shrink-0 px-3 py-2 bg-muted text-muted-foreground text-xs rounded-full">
                                Not analysed
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                        <Button
                          onClick={() => handleToggleExpansion(job.id)}
                          className="gap-2"
                          variant={expandedJobId === job.id ? "secondary" : "default"}
                        >
                          <Sparkles className="w-4 h-4" />
                          {expandedJobId === job.id 
                            ? "Close" 
                            : completedPackages.has(job.id) 
                              ? "Rebuild Package" 
                              : "Build Application Package"}
                        </Button>
                        <Button
                          variant={completedPackages.has(job.id) ? "default" : "outline"}
                          onClick={() => handleViewOriginal(job)}
                          className={`gap-2 ${
                            completedPackages.has(job.id) 
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" 
                              : ""
                          }`}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Original
                        </Button>
                      </div>

                      {/* Inline Expansion Panel */}
                      {expandedJobId === job.id && (
                        <div className="mt-4 pt-4 border-t border-border animate-in slide-in-from-top-2 duration-200">
                          <h4 className="text-sm font-semibold text-foreground mb-4">
                            Build your application package for this role
                          </h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Role Summary */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Role Summary
                              </h5>
                              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                                {/* Match Score Row - Prominent first row */}
                                <div
                                  className={`flex items-center justify-between p-3 -mx-1 -mt-1 mb-3 rounded-lg ${
                                    (() => {
                                      const fit = getRoleFitDisplay(matchScores[job.id], loadingScores);
                                      return fit.status === "score" ? getRoleFitScorePanelClass(fit.value) : "bg-muted border border-border";
                                    })()
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span className="font-medium">Role Fit</span>
                                  </div>
                                  {(() => {
                                    const fit = getRoleFitDisplay(matchScores[job.id], loadingScores);
                                    if (fit.status === "score") {
                                      return (
                                        <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${getRoleFitScoreBgClass(fit.value)}`}>
                                          {fit.value}%
                                        </span>
                                      );
                                    }
                                    if (fit.status === "loading") {
                                      return (
                                        <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                          Loading...
                                        </span>
                                      );
                                    }
                                    return (
                                      <span className="text-xs text-muted-foreground italic">
                                        Not analysed
                                      </span>
                                    );
                                  })()}
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Job Title:</span>
                                  <span className="font-medium text-foreground">{job.title}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Company:</span>
                                  <span className="font-medium text-foreground">{job.company}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Location:</span>
                                  <span className="font-medium text-foreground">{job.location}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Posted:</span>
                                  <span className="font-medium text-foreground">{job.postedDate}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Source:</span>
                                  <span className="font-medium text-foreground">{job.publisher || job.source}</span>
                                </div>
                                <div className="pt-2 border-t border-border">
                                  <a
                                    href={job.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline flex items-center gap-1 text-xs"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    View Original Posting
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Right Column: What Ascend Will Generate */}
                            <div className="space-y-3">
                              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                What Ascend Will Generate
                              </h5>
                              <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <Checkbox
                                    checked={packageOptions.tailorResume}
                                    onCheckedChange={(checked) =>
                                      setPackageOptions((prev) => ({ ...prev, tailorResume: !!checked }))
                                    }
                                  />
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm">Tailored Resume</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <Checkbox
                                    checked={packageOptions.optimizeProfile}
                                    onCheckedChange={(checked) =>
                                      setPackageOptions((prev) => ({ ...prev, optimizeProfile: !!checked }))
                                    }
                                  />
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">Optimised Profile (LinkedIn/Indeed)</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <Checkbox
                                    checked={packageOptions.interviewPrep}
                                    onCheckedChange={(checked) =>
                                      setPackageOptions((prev) => ({ ...prev, interviewPrep: !!checked }))
                                    }
                                  />
                                  <div className="flex items-center gap-2">
                                    <Mic className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm">Interview Prep Questions</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <Checkbox
                                    checked={packageOptions.trackApplication}
                                    onCheckedChange={(checked) =>
                                      setPackageOptions((prev) => ({ ...prev, trackApplication: !!checked }))
                                    }
                                  />
                                  <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm">Application tracked to your board</span>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-6 space-y-2">
                            <Button
                              onClick={() => handleGeneratePackageFromCard(job)}
                              disabled={generatingPackageForJob === job.id}
                              className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                            >
                              {generatingPackageForJob === job.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  Generate Package
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </Button>
                            <button
                              onClick={() => setExpandedJobId(null)}
                              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Load More: hide when all results loaded or no more from API */}
                  <div className="flex flex-col items-center gap-4 pt-4">
                    {hasMoreResults &&
                     (totalResultsFromApi == null || searchResults.length < totalResultsFromApi) && (
                      <Button
                        variant="outline"
                        onClick={() => handleSearch(true)}
                        disabled={loadingMore}
                        className="px-8 gap-2"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading more...
                          </>
                        ) : (
                          <>
                            Load More
                            <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Footer Note */}
                  <p className="text-xs text-muted-foreground text-center py-4 border-t border-border">
                    Ascend searches across platforms so you don't have to. Results open on their original platforms.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Search Company Pages */}
          {activeTab === "company" && (
            <div className="space-y-6">
              {/* Company Search */}
              <div className="bg-gradient-to-br from-primary/5 via-emerald-500/5 to-transparent border border-primary/10 rounded-2xl p-6">
                <Label className="text-sm font-medium mb-2 block">
                  Search a company's careers page directly
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Type a company name — e.g. Amazon, Infosys, HDFC Bank..."
                    value={companyQuery}
                    onChange={(e) => {
                      setCompanyQuery(e.target.value);
                      setShowCompanyDropdown(true);
                      if (!e.target.value) setSelectedCompany(null);
                    }}
                    onFocus={() => setShowCompanyDropdown(true)}
                    className="pl-10 h-12"
                  />

                  {/* Autocomplete Dropdown */}
                  {showCompanyDropdown && companyQuery && filteredCompanies.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto">
                      {filteredCompanies.map((company) => (
                        <button
                          key={company.name}
                          onClick={() => handleSelectCompany(company)}
                          className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">
                            {company.logo}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{company.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {company.industry}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-primary text-sm">
                            <Globe className="w-4 h-4" />
                            Go to Careers Page
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Company Selected View */}
              {selectedCompany && (
                <div className="flex gap-6 h-[600px]">
                  {/* Left Panel - Profile Summary */}
                  <div className="w-[40%] flex flex-col">
                    {/* Context Bar */}
                    <div className="bg-muted rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-xl">
                            {selectedCompany.logo}
                          </div>
                          <div>
                            <div className="font-semibold">{selectedCompany.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {selectedCompany.industry}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCompany(null)}
                          className="gap-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-background rounded-lg px-3 py-2">
                        <Info className="w-4 h-4" />
                        <span>
                          Tip: Copy any job description from their page and paste it into the 'Paste a JD' tab for AI tailoring.
                        </span>
                      </div>
                      <Button
                        className="w-full mt-3 gap-2"
                        variant="outline"
                        onClick={() => setShowPasteModal(true)}
                      >
                        <ClipboardPaste className="w-4 h-4" />
                        Paste JD from this page
                      </Button>
                    </div>

                    {/* Profile Summary */}
                    {defaultProfile ? (
                      <div className="flex-1 bg-muted/50 rounded-xl p-6 overflow-y-auto">
                        <h3 className="font-semibold mb-4">Your Ascend Profile</h3>
                        <div className="space-y-4">
                          <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                              Name
                            </div>
                            <div>{defaultProfile.full_name}</div>
                          </div>
                          {defaultProfile.headline && (
                            <div>
                              <div className="text-sm font-medium text-muted-foreground mb-1">
                                Headline
                              </div>
                              <div>{defaultProfile.headline}</div>
                            </div>
                          )}
                          
                        </div>
                        <Button
                          className="w-full mt-6 gap-2"
                          onClick={() =>
                            navigate(`/tailor`, {
                              state: { company: selectedCompany.name },
                            })
                          }
                        >
                          <FileText className="w-4 h-4" />
                          Tailor Resume for {selectedCompany.name}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 bg-muted/50 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <Users className="w-12 h-12 text-muted-foreground mb-4" />
                        <h3 className="font-medium mb-2">No Profile Yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create a profile to get personalized application packages
                        </p>
                        <Button onClick={() => navigate("/profiles")}>
                          Create Profile
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right Panel - iFrame */}
                  <div className="w-[60%] flex flex-col">
                    <div className="bg-muted rounded-t-xl px-4 py-2 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">
                        {selectedCompany.careersUrl}
                      </span>
                      <a
                        href={selectedCompany.careersUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm flex items-center gap-1"
                      >
                        Open in new tab
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex-1 border border-border rounded-b-xl overflow-hidden bg-white">
                      <iframe
                        ref={iframeRef}
                        src={selectedCompany.careersUrl}
                        className="w-full h-full"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        title={`${selectedCompany.name} Careers`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!selectedCompany && (
                <div className="text-center py-16 bg-muted/30 rounded-xl">
                  <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">
                    Search any company's careers page
                  </h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Type a company name above to browse their careers page directly, then paste any job description for AI-powered tailoring.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Paste JD Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-2xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Paste Job Description from {selectedCompany?.name}
              </h3>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Textarea
              placeholder="Paste the job description here..."
              value={modalJdText}
              onChange={(e) => setModalJdText(e.target.value)}
              className="min-h-[200px] mb-4"
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPasteModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePasteFromCompany}
                disabled={!modalJdText.trim()}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Continue to Paste a JD
              </Button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
}
