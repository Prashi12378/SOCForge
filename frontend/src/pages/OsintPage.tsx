// OSINT Triage Center Component
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../store';
import { Rss, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = [
  "Global Highlights", "Customer Mentions", "Cyber Development",
  "Geo-Political", "Competitive Intel", "Other OSINT"
];

const OsintPage: React.FC = () => {
  const { osintSources, osintApproved, fetchOsintState, approveOsintArticle, removeOsintArticle } = useAppStore();
  
  const [queue, setQueue] = useState<{ title: string; link: string; date: string; description: string }[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Manual Entry State
  const [manualTitle, setManualTitle] = useState('');
  const [manualLink, setManualLink] = useState('');
  const [manualCategory, setManualCategory] = useState(CATEGORIES[0]);

  useEffect(() => {
    fetchOsintState();
  }, [fetchOsintState]);

  const runScraper = async () => {
    setIsFetching(true);
    setFetchError('');
    setQueue([]);
    setSelectedArticle(null);
    
    let allArticles: any[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    for (const url of osintSources) {
      try {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        const parser = new DOMParser();
        const xml = parser.parseFromString(data.contents, "text/xml");
        
        const items = xml.querySelectorAll("item");
        items.forEach(item => {
          const title = item.querySelector("title")?.textContent || "No Title";
          const link = item.querySelector("link")?.textContent || "";
          const pubDate = item.querySelector("pubDate")?.textContent || "";
          const description = item.querySelector("description")?.textContent || "No description available.";
          
          let isRecent = true;
          if (pubDate) {
            const date = new Date(pubDate);
            if (!isNaN(date.getTime()) && date < sevenDaysAgo) {
              isRecent = false;
            }
          }
          
          if (isRecent) {
            allArticles.push({ title, link, date: pubDate, description });
          }
        });
      } catch (err) {
        console.error(`Failed to fetch ${url}`, err);
        setFetchError((prev) => prev + `Failed to fetch ${url}. `);
      }
    }
    
    const uniqueArticles = allArticles.filter((v, i, a) => a.findIndex(t => (t.title === v.title)) === i);
    setQueue(uniqueArticles);
    setIsFetching(false);
  };

  const handleApprove = () => {
    if (selectedArticle) {
      approveOsintArticle(selectedCategory, { title: selectedArticle.title, link: selectedArticle.link });
      setQueue(queue.filter(a => a !== selectedArticle));
      setSelectedArticle(null);
    }
  };

  const handleDiscard = () => {
    if (selectedArticle) {
      setQueue(queue.filter(a => a !== selectedArticle));
      setSelectedArticle(null);
    }
  };

  const handleManualInject = () => {
    if (manualTitle.trim() && manualLink.trim()) {
      approveOsintArticle(manualCategory, { title: manualTitle.trim(), link: manualLink.trim() });
      setManualTitle('');
      setManualLink('');
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-[#0080ff] uppercase shadow-cyber drop-shadow-[0_0_10px_rgba(0,240,255,0.8)]">OSINT Triage Center</h1>
          <p className="text-cyber-muted mt-2 font-medium tracking-wide">Automated Threat Feed Scraper & Injector</p>
        </div>
        <button
          onClick={runScraper}
          disabled={isFetching}
          className="flex items-center gap-2 bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/50 px-6 py-3 rounded-lg font-bold tracking-wide hover:bg-cyber-primary hover:text-cyber-bg transition-colors shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
          {isFetching ? 'Fetching...' : 'Run Scraper (Last 7 Days)'}
        </button>
      </div>

      {fetchError && (
        <div className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{fetchError}</p>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-[500px]">
        {/* Panel 1: Queue */}
        <div className="glass-panel rounded-xl p-5 flex flex-col h-full border border-cyber-border/30">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-cyber-border/50">
            <Rss className="w-5 h-5 text-cyber-primary" />
            <h2 className="text-xl font-bold tracking-wide">1. Scraper Queue ({queue.length})</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 custom-scrollbar pr-2">
            {queue.length === 0 ? (
              <p className="text-cyber-muted italic text-center mt-10">Queue is empty. Run scraper to fetch feeds.</p>
            ) : (
              queue.map((article, idx) => (
                <div 
                  key={idx}
                  onClick={() => setSelectedArticle(article)}
                  className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                    selectedArticle === article 
                      ? 'bg-cyber-primary/20 border-cyber-primary text-cyber-text' 
                      : 'bg-cyber-bg/50 border-cyber-border/30 hover:border-cyber-primary/50 text-cyber-muted'
                  }`}
                >
                  <p className="font-semibold text-sm line-clamp-2">{article.title}</p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-cyber-border/50 pt-4">
            <h3 className="font-bold text-sm text-cyber-primary mb-3">Manual Override</h3>
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Article Title" 
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-primary"
              />
              <input 
                type="text" 
                placeholder="URL" 
                value={manualLink}
                onChange={e => setManualLink(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-primary"
              />
              <select 
                value={manualCategory}
                onChange={e => setManualCategory(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2 text-sm text-cyber-text focus:outline-none focus:border-cyber-primary"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button 
                onClick={handleManualInject}
                className="w-full bg-cyber-secondary/20 text-cyber-secondary border border-cyber-secondary/50 rounded py-2 font-bold text-sm hover:bg-cyber-secondary hover:text-black transition-colors"
              >
                Inject to Report
              </button>
            </div>
          </div>
        </div>

        {/* Panel 2: Review */}
        <div className="glass-panel rounded-xl p-5 flex flex-col h-full border border-cyber-border/30 relative">
          <h2 className="text-xl font-bold tracking-wide mb-4 pb-3 border-b border-cyber-border/50">2. Review & Assign</h2>
          
          {selectedArticle ? (
            <div className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto mb-6 bg-cyber-bg/50 p-4 rounded-xl border border-cyber-border/30">
                <h3 className="text-lg font-bold text-cyber-primary mb-2">{selectedArticle.title}</h3>
                <a href={selectedArticle.link} target="_blank" rel="noreferrer" className="text-cyber-secondary hover:underline text-sm break-all">
                  {selectedArticle.link}
                </a>
                <p className="text-xs text-cyber-muted mt-2 mb-4">{selectedArticle.date}</p>
                <div 
                  className="text-sm text-gray-300 leading-relaxed prose prose-invert"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.description }}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-cyber-muted mb-2">Assign Category:</label>
                  <select 
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#0b0f19] border-2 border-cyber-primary rounded-lg px-4 py-3 text-cyber-text font-bold focus:outline-none"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div className="flex gap-4">
                  <button 
                    onClick={handleApprove}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500/20 text-green-400 border border-green-500/50 py-3 rounded-lg font-bold hover:bg-green-500 hover:text-black transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve
                  </button>
                  <button 
                    onClick={handleDiscard}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 py-3 rounded-lg font-bold hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Discard
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-cyber-muted italic">
              Select an article from the queue to review
            </div>
          )}
        </div>

        {/* Panel 3: Approved */}
        <div className="glass-panel rounded-xl p-5 flex flex-col h-full border border-cyber-border/30">
          <h2 className="text-xl font-bold tracking-wide mb-4 pb-3 border-b border-cyber-border/50">3. Approved Output</h2>
          
          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
            {CATEGORIES.map(category => {
              const items = osintApproved[category] || [];
              if (items.length === 0) return null;
              
              return (
                <div key={category}>
                  <h3 className="text-cyber-primary font-bold text-sm uppercase tracking-widest border-b border-cyber-primary/30 pb-1 mb-2">
                    {category}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((item, idx) => (
                      <li key={idx} className="bg-cyber-bg/50 p-3 rounded border border-cyber-border/30 flex justify-between items-start group">
                        <div>
                          <p className="text-sm font-semibold text-cyber-text line-clamp-2">{item.title}</p>
                        </div>
                        <button 
                          onClick={() => removeOsintArticle(category, idx)}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 hover:bg-red-500/20 rounded p-1"
                          title="Remove"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            
            {Object.values(osintApproved).every(arr => arr.length === 0) && (
              <div className="h-full flex items-center justify-center text-cyber-muted italic">
                No articles approved yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OsintPage;
