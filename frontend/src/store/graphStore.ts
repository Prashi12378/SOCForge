import { create } from 'zustand';
import * as idb from 'idb-keyval';

export type ChartType = 'bar' | 'horizontal-bar' | 'pie' | 'donut';

export interface DataPoint {
  id: string;
  label: string;
  value: number;
  drilldownText: string;
}

interface GraphState {
  title: string;
  chartType: ChartType;
  xAxisName: string;
  yAxisName: string;
  dataPoints: DataPoint[];
  
  // Actions
  setTitle: (title: string) => void;
  setChartType: (type: ChartType) => void;
  setAxisNames: (x: string, y: string) => void;
  addDataPoint: () => void;
  updateDataPoint: (id: string, updates: Partial<DataPoint>) => void;
  removeDataPoint: (id: string) => void;
  loadTemplate: (templateName: string) => void;
  saveToDb: () => Promise<void>;
  loadFromDb: () => Promise<void>;
}

const templates: Record<string, Partial<GraphState>> = {
  'monday': {
    title: 'Industry 7 days PSI Global (excl. USA)',
    chartType: 'bar',
    xAxisName: 'Industry Sector',
    yAxisName: 'Number of Victims',
    dataPoints: [
      { id: '1', label: 'Manufacturing', value: 12, drilldownText: 'LockBit: 5\nBlackCat: 3\nOther: 4\nImpact: Heavy disruption to EU supply chains.' },
      { id: '2', label: 'Finance', value: 8, drilldownText: 'Targeting SWIFT interfaces.\nActors: Cl0p, ALPHV' },
      { id: '3', label: 'Healthcare', value: 5, drilldownText: 'Mostly targeting APAC region.' }
    ]
  },
  'tuesday': {
    title: 'Region 7 days PSI USA',
    chartType: 'pie',
    xAxisName: '',
    yAxisName: '',
    dataPoints: [
      { id: '1', label: 'North America', value: 25, drilldownText: 'USA represents 80% of regional targeting.' },
      { id: '2', label: 'EMEA', value: 15, drilldownText: 'Focus on UK and Germany.' },
      { id: '3', label: 'APAC', value: 10, drilldownText: 'Rising threats in Australia.' }
    ]
  },
  'wednesday': {
    title: 'Ransomware groups 24h & Region 24h',
    chartType: 'donut',
    xAxisName: '',
    yAxisName: '',
    dataPoints: [
      { id: '1', label: 'LockBit 3.0', value: 18, drilldownText: 'Active primarily in North America.' },
      { id: '2', label: 'BlackBasta', value: 12, drilldownText: 'Targeting manufacturing globally.' },
      { id: '3', label: 'Play', value: 7, drilldownText: 'Focusing on mid-size enterprises.' }
    ]
  },
  'thursday': {
    title: 'Industry 24h PSI Global (excl. USA)',
    chartType: 'horizontal-bar',
    xAxisName: 'Incidents (24h)',
    yAxisName: 'Industry',
    dataPoints: [
      { id: '1', label: 'Education', value: 9, drilldownText: 'Higher-ed targeting in UK/EU.' },
      { id: '2', label: 'Government', value: 6, drilldownText: 'Phishing campaigns identified.' },
      { id: '3', label: 'Retail', value: 4, drilldownText: 'POS malware infections.' }
    ]
  },
  'friday': {
    title: 'Ransomware groups 24h vs Industry 24h',
    chartType: 'bar',
    xAxisName: 'Ransomware Group / Industry',
    yAxisName: 'Attack Volume',
    dataPoints: [
      { id: '1', label: 'LockBit - Mfg', value: 14, drilldownText: 'Extortion tactics escalating.' },
      { id: '2', label: 'ALPHV - Finance', value: 8, drilldownText: 'Data exfiltration confirmed.' },
      { id: '3', label: 'Cl0p - Healthcare', value: 5, drilldownText: 'Exploiting known zero-days.' }
    ]
  }
};

export const useGraphStore = create<GraphState>((set, get) => ({
  title: 'Custom Intelligence Graph',
  chartType: 'bar',
  xAxisName: 'Category',
  yAxisName: 'Value',
  dataPoints: [
    { id: Date.now().toString(), label: 'Sample Category', value: 10, drilldownText: 'Drilldown details here...' }
  ],

  setTitle: (title) => set({ title }),
  setChartType: (chartType) => set({ chartType }),
  setAxisNames: (xAxisName, yAxisName) => set({ xAxisName, yAxisName }),
  
  addDataPoint: () => {
    set((state) => ({
      dataPoints: [
        ...state.dataPoints, 
        { id: Date.now().toString(), label: 'New Data', value: 0, drilldownText: '' }
      ]
    }));
  },
  
  updateDataPoint: (id, updates) => {
    set((state) => ({
      dataPoints: state.dataPoints.map(dp => 
        dp.id === id ? { ...dp, ...updates } : dp
      )
    }));
  },
  
  removeDataPoint: (id) => {
    set((state) => ({
      dataPoints: state.dataPoints.filter(dp => dp.id !== id)
    }));
  },

  loadTemplate: (templateName) => {
    const template = templates[templateName.toLowerCase()];
    if (template) {
      set({ ...template });
    }
  },

  saveToDb: async () => {
    const state = get();
    await idb.set('socforge_custom_graph', {
      title: state.title,
      chartType: state.chartType,
      xAxisName: state.xAxisName,
      yAxisName: state.yAxisName,
      dataPoints: state.dataPoints
    });
  },

  loadFromDb: async () => {
    const saved = await idb.get('socforge_custom_graph');
    if (saved) {
      set({ ...saved });
    }
  }
}));
