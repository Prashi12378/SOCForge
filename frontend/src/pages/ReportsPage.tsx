import React, { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Printer } from 'lucide-react';
import { useAppStore } from '../store';

const ReportsPage: React.FC = () => {
  const { kpis, topTargeted, categoryName, recentAlerts, dateRange, topSourceIps, criticalHighlights, osintApproved, fetchAnalytics } = useAppStore();
  const [isPrinting, setIsPrinting] = React.useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handlePrint = () => {
    setIsPrinting(true);
    // Wait for React to re-render ECharts with light theme, then print, then revert
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const colors = ['#b91c1c', '#ef4444', '#0f766e', '#06b6d4', '#cbd5e1'];
  const chartData = topTargeted.map((item, idx) => ({
    name: item.name,
    value: item.value,
    itemStyle: { color: colors[idx % colors.length] }
  }));

  const chartOption = {
    backgroundColor: 'transparent',
    title: {
      text: `Most targeted ${categoryName} in the past week`,
      textStyle: { color: isPrinting ? '#000000' : '#ffffff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Outfit' },
      left: 'center',
      top: 10
    },
    grid: { left: '5%', right: '5%', bottom: '10%', top: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chartData.map(d => d.name),
      axisLabel: { color: isPrinting ? '#000000' : '#e2e8f0', fontFamily: 'Outfit', margin: 15, fontWeight: isPrinting ? 'bold' : 'normal' },
      axisTick: { show: false },
      axisLine: { show: true, lineStyle: { color: isPrinting ? '#000000' : '#e2e8f0' } }
    },
    yAxis: {
      type: 'value',
      name: 'Number of incidents',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: isPrinting ? '#000000' : '#e2e8f0', fontFamily: 'Outfit', fontSize: 12, fontWeight: isPrinting ? 'bold' : 'normal' },
      axisLabel: { color: isPrinting ? '#000000' : '#e2e8f0', fontFamily: 'Outfit', fontWeight: isPrinting ? 'bold' : 'normal' },
      splitLine: { lineStyle: { color: isPrinting ? '#e5e7eb' : '#2a3441', type: 'solid' } }
    },
    series: [
      {
        type: 'bar',
        barWidth: '50%',
        label: { show: true, position: 'insideTop', color: isPrinting ? '#000000' : '#ffffff', fontFamily: 'Outfit', distance: 10, fontWeight: 'bold' },
        data: chartData
      }
    ]
  };

  const getThreatColor = (threat: string, severity: string) => {
    const text = (threat + severity).toLowerCase();
    if (text.includes('vuln') || text.includes('malware') || text.includes('critical') || text.includes('ransom')) return 'text-red-500';
    if (text.includes('phish') || text.includes('fraud') || text.includes('geo') || text.includes('high')) return 'text-orange-400';
    return 'text-green-400';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in-up">
      <div className="flex justify-end print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50 px-5 py-2.5 rounded-lg font-bold tracking-wide hover:bg-cyber-primary hover:text-cyber-bg transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]"
        >
          <Printer className="w-5 h-5" />
          Print Report to PDF
        </button>
      </div>

      <div className="glass-panel rounded-2xl p-8 print:bg-transparent print:border-none print:shadow-none print:text-black">
        {/* Graph Section */}
        <div className="mb-12 h-[450px] w-full border border-cyber-border/50 rounded-xl bg-[#0b0f19] p-4 shadow-inner print:break-inside-avoid print:bg-white">
          {chartData.length > 0 ? (
            <ReactECharts option={chartOption} style={{ height: '100%', width: '100%' }} />
          ) : (
            <div className="flex items-center justify-center h-full text-cyber-muted font-bold text-lg">
              No incident data available. Please upload a dataset first.
            </div>
          )}
        </div>

        {/* Report Section */}
        {(recentAlerts.length > 0 || Object.values(osintApproved).some(arr => arr.length > 0)) && (
          <div className="space-y-8 text-cyber-text leading-relaxed font-medium print:text-black mt-16">
            <h2 className="text-3xl font-black tracking-wider uppercase mb-8 border-b-2 border-cyber-primary/30 pb-4 inline-block print:border-black">Detailed Intelligence Report</h2>
            
            {/* Executive Summary */}
            {recentAlerts.length > 0 && (
              <div className="bg-cyber-primary/5 border-l-4 border-cyber-primary p-6 rounded-r-xl print:bg-gray-100 print:border-gray-800">
                <h3 className="text-xl font-bold mb-3 tracking-wide text-cyber-primary print:text-black">Executive Summary</h3>
                <p>
                  This automated brief summarizes the cybersecurity threat landscape observed {dateRange ? `between ${dateRange.start} and ${dateRange.end}` : 'in the recent period'}. 
                  A total of <span className="font-bold text-cyber-text print:text-black">{kpis.total_incidents} security incidents</span> were analyzed. 
                  Our telemetry indicates that the most highly targeted {categoryName.slice(0, -1)} was <span className="font-bold text-cyber-text print:text-black">{topTargeted.length > 0 ? topTargeted[0].name : 'Unknown'}</span>. 
                  Notably, <span className="font-bold text-cyber-secondary print:text-black">{kpis.critical_alerts} critical severity alerts</span> were recorded, requiring immediate remediation.
                </p>
              </div>
            )}
            
            {/* Internal Telemetry Highlights */}
            {criticalHighlights.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mt-8 mb-4 tracking-wide border-b border-cyber-border/50 pb-2 print:border-gray-800">Internal Telemetry Highlights</h3>
                <div className="space-y-4 pl-2">
                  {criticalHighlights.map((highlight, idx) => {
                    const threat = highlight.event_type || 'Unknown Threat';
                    const colorClass = highlight.severity?.toLowerCase() === 'critical' ? 'text-red-500' : 'text-orange-500';
                    const sector = highlight.sector || highlight.industry || highlight.destination_ip || 'N/A';
                    return (
                      <p key={idx} className="flex gap-3">
                        <span className="text-cyber-muted mt-1">•</span>
                        <span>
                          <span className={`${colorClass} font-bold mr-2 uppercase tracking-wider`}>[{threat}]</span> 
                          {highlight.description || 'Critical security event recorded without detailed description.'} 
                          <span className="text-cyber-muted text-sm ml-2 print:text-gray-600">[Target: {sector}]</span>
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>
            )}

            {/* External OSINT Sections */}
            {Object.entries(osintApproved).map(([cat, articles]) => {
              if (!articles || articles.length === 0) return null;
              return (
                <div key={cat}>
                  <h3 className="text-xl font-bold mt-8 mb-4 tracking-wide border-b border-cyber-border/50 pb-2 print:border-gray-800">{cat}</h3>
                  <ul className="space-y-3 pl-2 list-none">
                    {articles.map((art, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="text-cyber-primary mt-1">»</span>
                        <a href={art.link} target="_blank" rel="noreferrer" className="hover:underline hover:text-cyber-primary transition-colors print:text-blue-800 print:underline">
                          {art.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}

            {/* Top Threat Actors */}
            {topSourceIps.length > 0 && (
              <div className="print:break-inside-avoid">
                <h3 className="text-xl font-bold mt-10 mb-4 tracking-wide border-b border-cyber-border/50 pb-2 print:border-gray-800">Top Threat Actors (Source IPs)</h3>
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full max-w-2xl border-collapse border border-cyber-border text-left text-sm print:border-gray-800">
                    <thead className="bg-cyber-card/80 print:bg-gray-200">
                      <tr>
                        <th className="border border-cyber-border p-3 font-bold text-center w-16 print:border-gray-800">Rank</th>
                        <th className="border border-cyber-border p-3 font-bold print:border-gray-800">Source IP / Actor ID</th>
                        <th className="border border-cyber-border p-3 font-bold text-center print:border-gray-800">Incident Volume</th>
                      </tr>
                    </thead>
                    <tbody className="bg-cyber-bg/50 print:bg-white">
                      {topSourceIps.map((actor, i) => (
                        <tr key={i} className="border-b border-cyber-border print:border-gray-800 hover:bg-cyber-primary/5 transition-colors">
                          <td className="border border-cyber-border p-3 text-center font-bold text-cyber-muted print:border-gray-800 print:text-gray-600">#{i + 1}</td>
                          <td className="border border-cyber-border p-3 font-mono print:border-gray-800">{actor.ip}</td>
                          <td className="border border-cyber-border p-3 text-center print:border-gray-800 font-bold text-cyber-primary print:text-black">{actor.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Competitive Intelligence Matrix */}
            {recentAlerts.length > 0 && (
              <div className="print:break-inside-avoid">
                <h3 className="text-xl font-bold mt-12 mb-2 tracking-wide">Customer Mentions</h3>
                <h3 className="text-lg font-bold mb-6 tracking-wide border-b border-cyber-border/50 pb-2 print:border-gray-800">
                  Competitive Intelligence (linking <span className="underline decoration-red-500 decoration-wavy">geopol</span> and cyber)
                </h3>

                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse border-2 border-cyber-border text-left text-sm print:border-gray-800">
                    <thead className="bg-cyber-card/80 print:bg-gray-200">
                      <tr>
                        <th className="border-2 border-cyber-border p-3 font-bold text-center print:border-gray-800">Region / IP</th>
                        <th className="border-2 border-cyber-border p-3 font-bold text-center print:border-gray-800">Country / Dest IP</th>
                        <th className="border-2 border-cyber-border p-3 font-bold text-center print:border-gray-800">Observations</th>
                        <th className="border-2 border-cyber-border p-3 font-bold text-center print:border-gray-800">Threat Type</th>
                        <th className="border-2 border-cyber-border p-3 font-bold text-center print:border-gray-800">Sector Affected</th>
                      </tr>
                    </thead>
                    <tbody className="bg-cyber-bg/50 print:bg-white">
                      {recentAlerts.map((inc: any, i: number) => {
                        const region = inc.region || inc.source_ip || 'Unknown';
                        const country = inc.country || inc.destination_ip || 'Unknown';
                        const observations = inc.observations || inc.description || 'Routine event observation.';
                        const threat = inc.threat_type || inc.event_type || 'Unknown';
                        const sector = inc.sector_affected || inc.industry || inc.status || 'N/A';
                        const colorClass = getThreatColor(threat, inc.severity || '');

                        return (
                          <tr key={i} className="border-b border-cyber-border print:border-gray-800 hover:bg-cyber-primary/5 transition-colors">
                            <td className="border border-cyber-border p-3 text-center align-middle font-bold print:border-gray-800">{region}</td>
                            <td className="border border-cyber-border p-3 print:border-gray-800 text-center">{country}</td>
                            <td className="border border-cyber-border p-3 print:border-gray-800">{observations}</td>
                            <td className={`border border-cyber-border p-3 font-semibold print:border-gray-800 text-center ${colorClass}`}>
                              {threat}
                            </td>
                            <td className="border border-cyber-border p-3 print:border-gray-800 text-center">{sector}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
