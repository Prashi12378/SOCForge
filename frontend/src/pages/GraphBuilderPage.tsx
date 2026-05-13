import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { useGraphStore } from '../store/graphStore';
import type { DataPoint } from '../store/graphStore';
import { Plus, Trash2, PieChart, BarChart3, Edit3, X, Save, Printer } from 'lucide-react';

const GraphBuilderPage: React.FC = () => {
  const {
    title, chartType, xAxisName, yAxisName, dataPoints,
    setTitle, setChartType, setAxisNames, addDataPoint, updateDataPoint, removeDataPoint,
    loadTemplate, loadFromDb, saveToDb
  } = useGraphStore();

  const [drilldownModal, setDrilldownModal] = useState<{ isOpen: boolean; data: DataPoint | null }>({ isOpen: false, data: null });
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    loadFromDb();
  }, [loadFromDb]);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 500);
  };

  const handleChartClick = (params: any) => {
    const clickedData = dataPoints.find(dp => dp.label === params.name);
    if (clickedData) {
      setDrilldownModal({ isOpen: true, data: clickedData });
    }
  };

  const colors = ['#b91c1c', '#ef4444', '#0f766e', '#06b6d4', '#cbd5e1', '#d946ef', '#f59e0b'];

  const getChartOption = () => {
    const textColor = isPrinting ? '#000000' : '#e2e8f0';
    const titleColor = isPrinting ? '#000000' : '#ffffff';
    const splitColor = isPrinting ? '#e5e7eb' : '#2a3441';
    
    // Formatting data for ECharts
    const chartData = dataPoints.map((dp, idx) => ({
      name: dp.label,
      value: dp.value,
      itemStyle: { color: colors[idx % colors.length] }
    }));

    const baseOption: any = {
      backgroundColor: 'transparent',
      title: {
        text: title,
        left: 'center',
        top: 10,
        textStyle: { color: titleColor, fontSize: 20, fontFamily: 'Outfit', fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}'
      }
    };

    if (chartType === 'pie' || chartType === 'donut') {
      return {
        ...baseOption,
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            type: 'pie',
            radius: chartType === 'donut' ? ['40%', '70%'] : '70%',
            center: ['50%', '55%'],
            itemStyle: {
              borderRadius: chartType === 'donut' ? 10 : 0,
              borderColor: isPrinting ? '#ffffff' : '#0b0f19',
              borderWidth: 2,
              shadowBlur: isPrinting ? 0 : 20,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            label: { color: textColor, fontFamily: 'Outfit', fontWeight: 'bold' },
            data: chartData
          }
        ]
      };
    }

    // Bar or Horizontal Bar
    const isHorizontal = chartType === 'horizontal-bar';
    
    return {
      ...baseOption,
      grid: { left: '10%', right: '10%', bottom: '15%', top: '20%', containLabel: true },
      xAxis: {
        type: isHorizontal ? 'value' : 'category',
        name: isHorizontal ? yAxisName : xAxisName,
        nameLocation: 'middle',
        nameGap: 35,
        nameTextStyle: { color: textColor, fontFamily: 'Outfit', fontWeight: 'bold' },
        data: isHorizontal ? undefined : chartData.map(d => d.name),
        axisLabel: { color: textColor, fontFamily: 'Outfit', fontWeight: isPrinting ? 'bold' : 'normal' },
        splitLine: { show: isHorizontal, lineStyle: { color: splitColor } },
        axisLine: { show: true, lineStyle: { color: textColor } }
      },
      yAxis: {
        type: isHorizontal ? 'category' : 'value',
        name: isHorizontal ? xAxisName : yAxisName,
        nameLocation: 'middle',
        nameGap: 50,
        nameTextStyle: { color: textColor, fontFamily: 'Outfit', fontWeight: 'bold' },
        data: isHorizontal ? chartData.map(d => d.name) : undefined,
        axisLabel: { color: textColor, fontFamily: 'Outfit', fontWeight: isPrinting ? 'bold' : 'normal' },
        splitLine: { show: !isHorizontal, lineStyle: { color: splitColor } },
        axisLine: { show: true, lineStyle: { color: textColor } }
      },
      series: [
        {
          type: 'bar',
          barWidth: '60%',
          itemStyle: {
            borderRadius: isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0],
            shadowBlur: isPrinting ? 0 : 15,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          label: {
            show: true,
            position: isHorizontal ? 'right' : 'top',
            color: textColor,
            fontFamily: 'Outfit',
            fontWeight: 'bold'
          },
          data: chartData
        }
      ]
    };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-fade-in-up">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-cyber-text tracking-widest drop-shadow-sm uppercase">Custom Graph Generator</h2>
          <p className="text-cyber-muted font-medium mt-1">Design daily intelligence graphs with manual data entry and drill-down insights.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { saveToDb(); alert('Saved locally!'); }} className="flex items-center gap-2 bg-cyber-card border border-cyber-border px-4 py-2 rounded-lg text-cyber-text hover:text-cyber-primary transition-colors">
            <Save className="w-4 h-4" /> Save Graph
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50 px-5 py-2.5 rounded-lg font-bold hover:bg-cyber-primary hover:text-cyber-bg transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Printer className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Templates */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap gap-3 print:hidden">
        <span className="text-cyber-muted font-bold self-center mr-2">Load Template:</span>
        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
          <button key={day} onClick={() => loadTemplate(day)} className="bg-cyber-bg border border-cyber-border px-4 py-1.5 rounded-md text-sm font-semibold text-cyber-text hover:bg-cyber-primary/20 hover:text-cyber-primary hover:border-cyber-primary/50 transition-all shadow-sm">
            {day}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Data Editor */}
        <div className="lg:col-span-1 space-y-6 print:hidden">
          <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold text-cyber-primary border-b border-cyber-border pb-3 mb-5 flex items-center gap-2">
              <Edit3 className="w-5 h-5" /> Chart Configuration
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-1">Chart Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-cyber-text focus:outline-none focus:border-cyber-primary/50" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-1">Chart Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setChartType('bar')} className={`py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 ${chartType === 'bar' ? 'bg-cyber-primary text-cyber-bg border-cyber-primary' : 'bg-cyber-bg text-cyber-muted border-cyber-border hover:border-cyber-primary/50'}`}>
                    <BarChart3 className="w-4 h-4" /> Bar
                  </button>
                  <button onClick={() => setChartType('horizontal-bar')} className={`py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 ${chartType === 'horizontal-bar' ? 'bg-cyber-primary text-cyber-bg border-cyber-primary' : 'bg-cyber-bg text-cyber-muted border-cyber-border hover:border-cyber-primary/50'}`}>
                    <BarChart3 className="w-4 h-4 rotate-90" /> Row
                  </button>
                  <button onClick={() => setChartType('pie')} className={`py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 ${chartType === 'pie' ? 'bg-cyber-primary text-cyber-bg border-cyber-primary' : 'bg-cyber-bg text-cyber-muted border-cyber-border hover:border-cyber-primary/50'}`}>
                    <PieChart className="w-4 h-4" /> Pie
                  </button>
                  <button onClick={() => setChartType('donut')} className={`py-2 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 ${chartType === 'donut' ? 'bg-cyber-primary text-cyber-bg border-cyber-primary' : 'bg-cyber-bg text-cyber-muted border-cyber-border hover:border-cyber-primary/50'}`}>
                    <PieChart className="w-4 h-4" /> Donut
                  </button>
                </div>
              </div>

              {(chartType === 'bar' || chartType === 'horizontal-bar') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-1">X-Axis Label</label>
                    <input type="text" value={xAxisName} onChange={e => setAxisNames(e.target.value, yAxisName)} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-cyber-text text-sm focus:outline-none focus:border-cyber-primary/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-cyber-muted uppercase tracking-wider mb-1">Y-Axis Label</label>
                    <input type="text" value={yAxisName} onChange={e => setAxisNames(xAxisName, e.target.value)} className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-cyber-text text-sm focus:outline-none focus:border-cyber-primary/50" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex justify-between items-center border-b border-cyber-border pb-3 mb-5">
              <h3 className="text-xl font-bold text-cyber-primary">Data Points</h3>
              <button onClick={addDataPoint} className="bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary hover:text-cyber-bg p-1.5 rounded-md transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {dataPoints.map((dp) => (
                <div key={dp.id} className="bg-cyber-bg border border-cyber-border p-4 rounded-xl relative group">
                  <button onClick={() => removeDataPoint(dp.id)} className="absolute top-2 right-2 text-cyber-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-3 gap-3 mb-3 pr-6">
                    <div className="col-span-2">
                      <label className="block text-[10px] font-bold text-cyber-muted uppercase tracking-wider mb-1">Label</label>
                      <input type="text" value={dp.label} onChange={e => updateDataPoint(dp.id, { label: e.target.value })} className="w-full bg-black/50 border border-cyber-border rounded px-2 py-1.5 text-cyber-text text-sm focus:outline-none focus:border-cyber-primary/50" />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-cyber-muted uppercase tracking-wider mb-1">Value</label>
                      <input type="number" value={dp.value} onChange={e => updateDataPoint(dp.id, { value: parseFloat(e.target.value) || 0 })} className="w-full bg-black/50 border border-cyber-border rounded px-2 py-1.5 text-cyber-text text-sm focus:outline-none focus:border-cyber-primary/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-cyber-muted uppercase tracking-wider mb-1 text-cyber-primary/80">Drilldown Information (Markdown supported)</label>
                    <textarea value={dp.drilldownText} onChange={e => updateDataPoint(dp.id, { drilldownText: e.target.value })} rows={2} className="w-full bg-black/50 border border-cyber-border rounded px-2 py-1.5 text-cyber-text text-sm focus:outline-none focus:border-cyber-primary/50 resize-none font-mono text-xs" placeholder="Threat actors, geography, impact..." />
                  </div>
                </div>
              ))}
              {dataPoints.length === 0 && <p className="text-center text-cyber-muted py-4">No data points. Click + to add one.</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Chart Viewer */}
        <div className="lg:col-span-2">
          <div className="glass-panel p-6 rounded-2xl h-full min-h-[600px] flex flex-col print:bg-white print:border-none print:shadow-none print:p-0">
            <p className="text-cyber-muted text-sm text-center mb-2 print:hidden italic">Click on any bar or slice to view drill-down intelligence.</p>
            <div className="flex-1 w-full bg-black/20 rounded-xl border border-cyber-border/30 print:bg-transparent print:border-none">
              <ReactECharts 
                option={getChartOption()} 
                style={{ height: '100%', minHeight: '550px', width: '100%' }} 
                onEvents={{ click: handleChartClick }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Drilldown Modal */}
      {drilldownModal.isOpen && drilldownModal.data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border-cyber-primary/50 shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
            <div className="bg-cyber-card/80 border-b border-cyber-border/50 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-black text-cyber-text">
                Intelligence Drilldown: <span className="text-cyber-primary">{drilldownModal.data.label}</span>
              </h3>
              <button onClick={() => setDrilldownModal({ isOpen: false, data: null })} className="text-cyber-muted hover:text-red-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-xl bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center">
                  <PieChart className="w-8 h-8 text-cyber-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-cyber-muted uppercase tracking-widest">Total Volume</p>
                  <p className="text-4xl font-black text-cyber-text">{drilldownModal.data.value} <span className="text-lg text-cyber-muted font-medium">incidents</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-cyber-primary uppercase tracking-widest border-b border-cyber-border/50 pb-2">Threat Actor / Geography / Impact</h4>
                <div className="bg-black/30 border border-cyber-border rounded-xl p-5">
                  <pre className="font-mono text-sm text-cyber-text whitespace-pre-wrap leading-relaxed">
                    {drilldownModal.data.drilldownText || 'No additional drilldown intelligence available for this vector.'}
                  </pre>
                </div>
              </div>
            </div>
            <div className="bg-cyber-card/50 px-6 py-4 flex justify-end">
              <button onClick={() => setDrilldownModal({ isOpen: false, data: null })} className="bg-cyber-bg border border-cyber-border px-6 py-2 rounded-lg font-bold text-cyber-text hover:text-cyber-primary hover:border-cyber-primary/50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphBuilderPage;
