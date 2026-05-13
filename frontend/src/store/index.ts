import { create } from 'zustand';
import Papa from 'papaparse';
import * as idb from 'idb-keyval';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || '';

interface AppState {
  kpis: {
    total_incidents: number;
    critical_alerts: number;
  };
  severityDistribution: { name: string; value: number }[];
  recentAlerts: any[];
  incidentTimeline: { time: string; count: number }[];
  topTargeted: { name: string; value: number }[];
  categoryName: string;
  dateRange: { start: string; end: string } | null;
  topSourceIps: { ip: string; count: number }[];
  criticalHighlights: any[];
  
  // OSINT State
  osintSources: string[];
  osintApproved: Record<string, { title: string; link: string }[]>;
  
  isLoading: boolean;
  error: string | null;
  fetchAnalytics: () => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  clearData: () => Promise<void>;
  
  // OSINT Actions
  fetchOsintState: () => Promise<void>;
  updateOsintSources: (sources: string[]) => Promise<void>;
  approveOsintArticle: (category: string, article: { title: string; link: string }) => Promise<void>;
  removeOsintArticle: (category: string, index: number) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  kpis: {
    total_incidents: 0,
    critical_alerts: 0,
  },
  severityDistribution: [],
  recentAlerts: [],
  incidentTimeline: [],
  topTargeted: [],
  categoryName: 'event types',
  dateRange: null,
  topSourceIps: [],
  criticalHighlights: [],
  
  osintSources: [],
  osintApproved: {
    "Global Highlights": [], "Customer Mentions": [], "Cyber Development": [],
    "Geo-Political": [], "Competitive Intel": [], "Other OSINT": []
  },
  
  isLoading: false,
  error: null,

  fetchOsintState: async () => {
    try {
      const sources = (await idb.get('socforge_osint_sources')) || [
        "https://www.bleepingcomputer.com/feed/",
        "https://feeds.feedburner.com/TheHackersNews",
        "https://krebsonsecurity.com/feed/"
      ];
      const approved = (await idb.get('socforge_osint_approved')) || {
        "Global Highlights": [], "Customer Mentions": [], "Cyber Development": [],
        "Geo-Political": [], "Competitive Intel": [], "Other OSINT": []
      };
      set({ osintSources: sources, osintApproved: approved });
    } catch (error) {
      console.error("Failed to load OSINT state", error);
    }
  },

  updateOsintSources: async (sources: string[]) => {
    await idb.set('socforge_osint_sources', sources);
    set({ osintSources: sources });
  },

  approveOsintArticle: async (category: string, article: { title: string; link: string }) => {
    const { osintApproved } = get();
    const updated = { ...osintApproved };
    if (!updated[category]) updated[category] = [];
    updated[category] = [...updated[category], article];
    
    await idb.set('socforge_osint_approved', updated);
    set({ osintApproved: updated });
  },

  removeOsintArticle: async (category: string, index: number) => {
    const { osintApproved } = get();
    const updated = { ...osintApproved };
    if (updated[category]) {
      updated[category] = updated[category].filter((_, i) => i !== index);
    }
    
    await idb.set('socforge_osint_approved', updated);
    set({ osintApproved: updated });
  },

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/api/v1/analytics/summary`);
      const { kpis, severity_distribution, recent_alerts } = response.data;
      
      set({
        kpis,
        severityDistribution: severity_distribution,
        recentAlerts: recent_alerts,
        isLoading: false
      });
      return;
    } catch (error: any) {
      console.error("API Fetch failed, falling back to local analytics", error);
    }

    try {
      const incidents = (await idb.get('socforge_incidents')) || [];
      const total_incidents = incidents.length;
      let critical_alerts = 0;
      const severityMap: Record<string, number> = {};
      const timelineMap: Record<string, number> = {};

      const hasIndustry = incidents.length > 0 && (!!incidents[0].industry || !!incidents[0].sector);
      const categoryField = incidents.length > 0 && incidents[0].industry ? 'industry' : (incidents.length > 0 && incidents[0].sector ? 'sector' : 'event_type');
      const categoryName = hasIndustry ? 'industries' : 'event types';
      const topTargetedMap: Record<string, number> = {};
      const sourceIpMap: Record<string, number> = {};
      
      let minDate = Infinity;
      let maxDate = -Infinity;

      for (const inc of incidents) {
        // Normalize severity case
        const sevRaw = inc.severity || 'Unknown';
        const sev = sevRaw.charAt(0).toUpperCase() + sevRaw.slice(1).toLowerCase();
        
        if (sev === 'Critical') critical_alerts++;
        severityMap[sev] = (severityMap[sev] || 0) + 1;
        
        // Calculate top targeted
        const targetVal = inc[categoryField] || 'Unknown';
        topTargetedMap[targetVal] = (topTargetedMap[targetVal] || 0) + 1;

        // Calculate top source IPs
        const ip = inc.source_ip || '';
        if (ip && ip.trim() !== '' && ip.trim().toLowerCase() !== 'unknown') {
          sourceIpMap[ip] = (sourceIpMap[ip] || 0) + 1;
        }

        // Calculate timeline and date range
        try {
          const date = new Date(inc.timestamp);
          const t = date.getTime();
          if (!isNaN(t)) {
            if (t < minDate) minDate = t;
            if (t > maxDate) maxDate = t;
            
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            const hour = date.getHours().toString().padStart(2, '0') + ':00';
            const timeKey = `${month}-${day} ${hour}`;
            timelineMap[timeKey] = (timelineMap[timeKey] || 0) + 1;
          }
        } catch(e) {}
      }

      const severityDistribution = Object.entries(severityMap).map(([name, value]) => ({ name, value }));
      
      const timelineKeys = Object.keys(timelineMap).sort();
      let incidentTimeline = timelineKeys.map(time => ({ time, count: timelineMap[time] }));
      if (incidentTimeline.length === 0) {
        incidentTimeline = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'].map(t => ({ time: t, count: 0 }));
      }
      
      const topTargeted = Object.entries(topTargetedMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

      const topSourceIps = Object.entries(sourceIpMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([ip, count]) => ({ ip, count }));

      const dateRange = minDate !== Infinity ? {
        start: new Date(minDate).toLocaleDateString(),
        end: new Date(maxDate).toLocaleDateString()
      } : null;

      const sorted = [...incidents].sort((a, b) => {
         const tA = new Date(a.timestamp || 0).getTime();
         const tB = new Date(b.timestamp || 0).getTime();
         return tB - tA;
      });

      const recentAlerts = sorted.slice(0, 15);

      const criticalHighlights = sorted.filter(inc => {
         const sev = (inc.severity || '').toLowerCase();
         return sev === 'critical' || sev === 'high';
      }).slice(0, 4);

      const data = {
        kpis: { total_incidents, critical_alerts },
        severityDistribution,
        recentAlerts,
        incidentTimeline,
        topTargeted,
        categoryName,
        dateRange,
        topSourceIps,
        criticalHighlights
      };

      localStorage.setItem('socforge_analytics', JSON.stringify(data));

      set({
        ...data,
        isLoading: false,
      });
    } catch (error: any) {
      const cachedData = localStorage.getItem('socforge_analytics');
      if (cachedData) {
        const data = JSON.parse(cachedData);
        set({ ...data, isLoading: false, error: "IndexedDB error. Displaying cached summary." });
      } else {
        set({ error: error.message || 'Failed to calculate local analytics.', isLoading: false });
      }
    }
  },

  uploadFile: async (file: File) => {
    set({ isLoading: true, error: null });
    
    // 1. Upload to Backend
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API_BASE}/api/v1/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("Successfully uploaded to backend");
    } catch (apiError: any) {
      console.warn("Backend upload failed, proceeding with local-only storage", apiError);
    }

    // 2. Local Fallback/Processing (Original logic)
    return new Promise(async (resolve, reject) => {
      try {
        if (file.name.toLowerCase().endsWith('.csv')) {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              try {
                if (!results.data || results.data.length === 0) {
                  throw new Error("The uploaded CSV file is empty.");
                }

                // Strict validation to prevent users from uploading non-cybersecurity datasets (like E-commerce)
                const firstRow = results.data[0] as Record<string, any>;
                const keys = Object.keys(firstRow).map(k => k.toLowerCase());
                const validSiemColumns = ['timestamp', 'event_type', 'severity', 'source_ip', 'destination_ip', 'industry', 'sector', 'status', 'description', 'threat_type'];
                const hasValidColumn = validSiemColumns.some(col => keys.includes(col));

                if (!hasValidColumn) {
                  throw new Error("Invalid Dataset Format. This file does not contain recognized SIEM log headers. Please ensure your CSV contains standard cybersecurity columns (e.g., 'timestamp', 'severity', 'source_ip', 'event_type').");
                }

                const newIncidents = results.data.map((row: any) => {
                  // Helper to do case-insensitive key lookup
                  const getVal = (key: string) => {
                    const foundKey = Object.keys(row).find(k => k.toLowerCase() === key);
                    return foundKey ? row[foundKey] : undefined;
                  };

                  return {
                    ...row,
                    timestamp: getVal('timestamp') || new Date().toISOString(),
                    severity: getVal('severity') || 'Low',
                    source_ip: getVal('source_ip') || '',
                    destination_ip: getVal('destination_ip') || '',
                    event_type: getVal('event_type') || getVal('threat_type') || 'Unknown',
                    status: getVal('status') || 'Open',
                    description: getVal('description') || '',
                    industry: getVal('industry') || undefined,
                    sector: getVal('sector') || undefined
                  };
                });

                const existing = (await idb.get('socforge_incidents')) || [];
                const combined = [...existing, ...newIncidents];
                await idb.set('socforge_incidents', combined);
                
                await get().fetchAnalytics();
                resolve(undefined);
              } catch (err) {
                set({ error: err instanceof Error ? err.message : 'Failed to save incidents.', isLoading: false });
                reject(err);
              }
            },
            error: (error: any) => {
               set({ error: error.message, isLoading: false });
               reject(error);
            }
          });
        } else if (file.name.endsWith('.json')) {
          const text = await file.text();
          const parsed = JSON.parse(text);
          const dataArray = Array.isArray(parsed) ? parsed : [parsed];
          
          const newIncidents = dataArray.map((row: any) => ({
            ...row,
            timestamp: row.timestamp || new Date().toISOString(),
            severity: row.severity || 'Low',
            source_ip: row.source_ip || '',
            destination_ip: row.destination_ip || '',
            event_type: row.event_type || 'Unknown',
            status: row.status || 'Open',
            description: row.description || '',
          }));

          const existing = (await idb.get('socforge_incidents')) || [];
          const combined = [...existing, ...newIncidents];
          await idb.set('socforge_incidents', combined);
          
          await get().fetchAnalytics();
          resolve(undefined);
        } else if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const existingEvidence = (await idb.get('socforge_evidence')) || [];
              existingEvidence.push({
                name: file.name,
                dataUrl: reader.result,
                timestamp: new Date().toISOString()
              });
              await idb.set('socforge_evidence', existingEvidence);
              
              set({ isLoading: false });
              resolve(undefined);
            } catch (err) {
              set({ error: 'Failed to save evidence.', isLoading: false });
              reject(err);
            }
          };
          reader.onerror = () => {
            set({ error: 'Failed to read image file.', isLoading: false });
            reject(new Error('Failed to read image file.'));
          };
          reader.readAsDataURL(file);
        } else {
           const err = new Error("Unsupported file format. Please upload CSV, JSON, or images.");
           set({ error: err.message, isLoading: false });
           reject(err);
        }
      } catch (err: any) {
         set({ error: err.message || 'Failed to process file.', isLoading: false });
         reject(err);
      }
    });
  },

  clearData: async () => {
    try {
      await idb.clear();
      set({
        kpis: { total_incidents: 0, critical_alerts: 0 },
        severityDistribution: [],
        recentAlerts: [],
        incidentTimeline: [],
        topTargeted: [],
        dateRange: null,
        topSourceIps: [],
        criticalHighlights: [],
        osintSources: [
          "https://www.bleepingcomputer.com/feed/",
          "https://feeds.feedburner.com/TheHackersNews",
          "https://krebsonsecurity.com/feed/"
        ],
        osintApproved: {
          "Global Highlights": [], "Customer Mentions": [], "Cyber Development": [],
          "Geo-Political": [], "Competitive Intel": [], "Other OSINT": []
        },
        error: null
      });
      localStorage.removeItem('socforge_analytics');
    } catch (error) {
      console.error('Failed to clear database', error);
    }
  },
}));
