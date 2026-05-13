import React, { useEffect } from 'react';
import { Activity, ShieldAlert, Target, Users } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import { useAppStore } from '../store';

const Dashboard: React.FC = () => {
  const { kpis, severityDistribution, recentAlerts, incidentTimeline, fetchAnalytics, isLoading } = useAppStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const pieChartOption = {
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: '#94a3b8' }
    },
    series: [
      {
        name: 'Severity',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 5,
          borderColor: '#0b0f19',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold', color: '#e2e8f0' }
        },
        labelLine: { show: false },
        data: severityDistribution.length > 0 ? severityDistribution.map(item => ({
          value: item.value,
          name: item.name,
          itemStyle: {
            color: item.name === 'Critical' ? '#ff003c' : 
                   item.name === 'High' ? '#ff5500' : 
                   item.name === 'Medium' ? '#ffaa00' : '#00f0ff'
          }
        })) : [{ value: 1, name: 'No Data', itemStyle: { color: '#2a3441' } }]
      }
    ]
  };

  const timelineData = incidentTimeline && incidentTimeline.length > 0 ? incidentTimeline : [{ time: '00:00', count: 0 }];

  const timelineOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: timelineData.map(t => t.time),
      axisLine: { lineStyle: { color: '#2a3441' } },
      axisLabel: { color: '#94a3b8', hideOverlap: true }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: '#2a3441', type: 'dashed' } },
      axisLabel: { color: '#94a3b8' }
    },
    series: [
      {
        data: timelineData.map(t => t.count),
        type: 'line',
        smooth: true,
        lineStyle: { color: '#00f0ff', width: 3 },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(0,240,255,0.5)' }, { offset: 1, color: 'rgba(0,240,255,0)' }]
          }
        },
        itemStyle: { color: '#00f0ff' }
      }
    ]
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Incidents" value={isLoading ? "..." : kpis.total_incidents} icon={Activity} color="text-cyber-primary" delay="0s" />
        <KPICard title="Critical Alerts" value={isLoading ? "..." : kpis.critical_alerts} icon={ShieldAlert} color="text-cyber-secondary" delay="0.1s" />
        <KPICard title="Top Target" value="10.0.5.21" icon={Target} color="text-cyber-accent" delay="0.2s" />
        <KPICard title="Active Threats" value="12" icon={Users} color="text-cyber-primary" delay="0.3s" />
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ animationDelay: '0.4s' }}>
        <div className="col-span-1 lg:col-span-2 glass-panel rounded-2xl p-6 min-h-[400px] flex flex-col group transition-all duration-300 hover:border-cyber-primary/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.05)]">
          <h3 className="text-xl font-bold mb-6 text-cyber-text tracking-wide drop-shadow-sm flex items-center gap-3">
            <div className="w-2 h-6 bg-cyber-primary rounded-full shadow-[0_0_10px_rgba(0,240,255,0.5)]"></div>
            Incident Timeline
          </h3>
          <div className="h-[320px] w-full flex-1">
            <ReactECharts option={timelineOption} style={{ height: '100%', width: '100%' }} theme="dark" />
          </div>
        </div>
        
        <div className="glass-panel rounded-2xl p-6 min-h-[400px] flex flex-col group transition-all duration-300 hover:border-cyber-accent/30 hover:shadow-[0_0_30px_rgba(191,0,255,0.05)]">
          <h3 className="text-xl font-bold mb-6 text-cyber-text tracking-wide drop-shadow-sm flex items-center gap-3">
            <div className="w-2 h-6 bg-cyber-accent rounded-full shadow-[0_0_10px_rgba(191,0,255,0.5)]"></div>
            Severity Distribution
          </h3>
          <div className="h-[320px] w-full flex-1">
            <ReactECharts option={pieChartOption} style={{ height: '100%', width: '100%' }} theme="dark" />
          </div>
        </div>
      </div>
      
      <div className="glass-panel rounded-2xl p-6" style={{ animationDelay: '0.6s' }}>
        <h3 className="text-xl font-bold mb-6 text-cyber-text tracking-wide drop-shadow-sm flex items-center gap-3">
          <div className="w-2 h-6 bg-cyber-secondary rounded-full shadow-[0_0_10px_rgba(255,0,60,0.5)]"></div>
          Recent Alerts
        </h3>
        <div className="overflow-x-auto rounded-xl border border-cyber-border/30 bg-black/10">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-cyber-border/50 text-cyber-muted bg-cyber-card/30">
                <th className="py-4 px-6 font-semibold tracking-wider text-xs uppercase">Timestamp</th>
                <th className="py-4 px-6 font-semibold tracking-wider text-xs uppercase">Severity</th>
                <th className="py-4 px-6 font-semibold tracking-wider text-xs uppercase">Source IP</th>
                <th className="py-4 px-6 font-semibold tracking-wider text-xs uppercase">Event Type</th>
              </tr>
            </thead>
            <tbody>
              {recentAlerts.length > 0 ? recentAlerts.map((alert, i) => (
                <tr key={i} className="border-b border-cyber-border/30 hover:bg-cyber-primary/5 transition-colors group">
                  <td className="py-4 px-6 text-sm text-cyber-text group-hover:text-cyber-primary transition-colors">{new Date(alert.timestamp).toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1.5 rounded-md text-xs font-bold tracking-widest shadow-sm ${
                      alert.severity === 'Critical' ? 'bg-cyber-secondary/15 text-cyber-secondary border border-cyber-secondary/40 shadow-[0_0_10px_rgba(255,0,60,0.2)]' : 
                      alert.severity === 'High' ? 'bg-orange-500/15 text-orange-500 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]' :
                      'bg-cyber-primary/15 text-cyber-primary border border-cyber-primary/40 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    }`}>
                      {alert.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm font-mono text-cyber-muted group-hover:text-cyber-text transition-colors">{alert.source_ip}</td>
                  <td className="py-4 px-6 text-sm text-cyber-text font-medium">{alert.event_type}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-cyber-muted font-medium">No recent alerts found. Upload a dataset to begin analyzing.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Helper Component
const KPICard = ({ title, value, icon: Icon, color, delay }: any) => (
  <div 
    className="glass-panel rounded-2xl p-6 flex items-center gap-5 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,240,255,0.1)] hover:border-cyber-primary/30 cursor-pointer animate-fade-in-up"
    style={{ animationDelay: delay, animationFillMode: 'both' }}
  >
    <div className={`absolute -right-6 -top-6 w-32 h-32 bg-current opacity-5 rounded-full group-hover:scale-150 group-hover:opacity-10 transition-all duration-500 ease-out ${color}`} />
    <div className={`p-4 rounded-xl bg-cyber-bg/50 border border-cyber-border/50 shadow-inner group-hover:shadow-[0_0_15px_rgba(0,0,0,0.3)] transition-all ${color}`}>
      <Icon className="w-7 h-7 drop-shadow-md" />
    </div>
    <div>
      <p className="text-sm text-cyber-muted font-semibold tracking-wide uppercase mb-1">{title}</p>
      <h4 className={`text-3xl font-black tracking-wider drop-shadow-sm ${color}`}>{value}</h4>
    </div>
  </div>
);

export default Dashboard;
