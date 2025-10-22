import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession.tsx';
import AppShell from '../components/AppShell.tsx';
import Button from '../components/Button.tsx';
import CitationsDisplay from '../components/CitationsDisplay.tsx';
import { IconFolder } from '../components/icons.tsx';
import { Citation } from '../types/api.ts';
import axios from 'axios';

type QueryDetail = {
  id: string;
  runId: string;
  runDate: string;
  queryText: string;
  brand: string | null;
  position: number | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  context: string | null;
  responseText?: string;
  citations?: Citation[];
  usedWebSearch?: boolean;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

const fetchProjectQueries = async (token: string, projectId: string): Promise<QueryDetail[]> => {
  const response = await axios.get(`${API_BASE}/projects/${projectId}/queries`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.queries;
};

const QueryDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { session, signOut, plan } = useSession();
  const navigate = useNavigate();
  const token = session?.access_token ?? null;

  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const queriesQuery = useQuery({
    queryKey: ['project-queries', projectId],
    queryFn: () => fetchProjectQueries(token ?? '', projectId ?? ''),
    enabled: Boolean(token && projectId)
  });

  const queries = queriesQuery.data ?? [];
  const rawFullName = session?.user?.user_metadata?.full_name as string | undefined;
  const displayName = rawFullName && rawFullName.trim().length > 0
    ? rawFullName.trim()
    : session?.user?.email?.split('@')[0] ?? 'Your workspace';
  const userEmail = session?.user?.email ?? undefined;

  // Get unique brands for filter
  const brands = Array.from(new Set(queries.map(q => q.brand).filter(Boolean))) as string[];

  // Filter queries
  const filteredQueries = queries.filter(q => {
    const matchesSearch = q.queryText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === 'all' || q.brand === brandFilter;
    const matchesSentiment = sentimentFilter === 'all' || q.sentiment === sentimentFilter;
    return matchesSearch && matchesBrand && matchesSentiment;
  });

  // Group by query text for display
  const groupedQueries = filteredQueries.reduce<Record<string, QueryDetail[]>>((acc, query) => {
    if (!acc[query.queryText]) acc[query.queryText] = [];
    acc[query.queryText].push(query);
    return acc;
  }, {});

  // Get citations for a query group (take from first result that has citations)
  const getQueryCitations = (mentions: QueryDetail[]): Citation[] => {
    for (const mention of mentions) {
      if (mention.citations && mention.citations.length > 0) {
        return mention.citations;
      }
    }
    return [];
  };

  // Check if any mention in the group used web search
  const usedWebSearch = (mentions: QueryDetail[]): boolean => {
    return mentions.some(m => m.usedWebSearch);
  };

  const getSentimentColor = (sentiment: string | null) => {
    if (sentiment === 'positive') return 'var(--success)';
    if (sentiment === 'negative') return 'var(--danger)';
    return 'rgba(255,255,255,0.6)';
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) return null;
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        background: sentiment === 'positive' ? 'rgba(94,252,130,0.15)' :
                    sentiment === 'negative' ? 'rgba(255,107,107,0.15)' :
                    'rgba(255,255,255,0.08)',
        color: getSentimentColor(sentiment)
      }}>
        {sentiment}
      </span>
    );
  };

  const navItems = [
    { label: 'Dashboard', to: '/dashboard', icon: <IconFolder /> }
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (queriesQuery.isLoading) {
    return (
      <AppShell
        planTier={plan}
        navItems={navItems}
        onSignOut={handleSignOut}
        footerNote="Detailed visibility for every prompt."
        user={{ name: displayName, email: userEmail }}
      >
        <div className="empty-state">Loading query data...</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      planTier={plan}
      navItems={navItems}
      onSignOut={handleSignOut}
      footerNote="Detailed visibility for every prompt."
      user={{ name: displayName, email: userEmail }}
    >
      <div className="stack stack--loose">
        <div className="panel panel--muted">
          <div className="stack stack--tight">
            <Button type="button" variant="ghost" onClick={() => navigate(`/dashboard/${projectId ?? ''}`)}>
              ← Dashboard
            </Button>
            <h1 className="headline-secondary">Query details</h1>
          </div>
        </div>

        <div style={{ padding: '32px 48px' }}>
        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          padding: '20px',
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <input
            type="text"
            placeholder="Search queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10,12,16,0.6)',
              color: 'inherit',
              fontSize: '14px'
            }}
          />
          <select
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10,12,16,0.6)',
              color: 'inherit',
              fontSize: '14px'
            }}
          >
            <option value="all">All Brands</option>
            {brands.map(brand => (
              <option key={brand} value={brand}>{brand}</option>
            ))}
          </select>
          <select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10,12,16,0.6)',
              color: 'inherit',
              fontSize: '14px'
            }}
          >
            <option value="all">All Sentiments</option>
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>

        {/* Query Table */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          overflow: 'hidden'
        }}>
          {Object.entries(groupedQueries).length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
              No queries match your filters
            </div>
          ) : (
            <div>
              {Object.entries(groupedQueries).map(([queryText, mentions]) => (
                <div key={queryText} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div
                    onClick={() => setExpandedRow(expandedRow === queryText ? null : queryText)}
                    style={{
                      padding: '20px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background 0.2s',
                      background: expandedRow === queryText ? 'rgba(255,255,255,0.04)' : 'transparent'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = expandedRow === queryText ? 'rgba(255,255,255,0.04)' : 'transparent'}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '15px', fontWeight: 500 }}>{queryText}</div>
                        {usedWebSearch(mentions) && (
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: 'rgba(91, 140, 254, 0.15)',
                            color: 'var(--accent)',
                            fontSize: '10px',
                            fontWeight: 600
                          }}>
                            🌐 WEB
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.7 }}>
                        <span>{mentions.length} mention{mentions.length !== 1 ? 's' : ''}</span>
                        <span>{new Set(mentions.map(m => m.brand)).size} brand{new Set(mentions.map(m => m.brand)).size !== 1 ? 's' : ''}</span>
                        {getQueryCitations(mentions).length > 0 && (
                          <span>{getQueryCitations(mentions).length} source{getQueryCitations(mentions).length !== 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: '20px', transform: expandedRow === queryText ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                  </div>

                  {expandedRow === queryText && (
                    <div style={{ padding: '0 24px 20px' }}>
                      {/* Show citations first if available */}
                      {getQueryCitations(mentions).length > 0 && (
                        <div style={{
                          padding: '16px',
                          marginBottom: '16px',
                          borderRadius: '12px',
                          background: 'rgba(91, 140, 254, 0.05)',
                          border: '1px solid rgba(91, 140, 254, 0.15)'
                        }}>
                          <CitationsDisplay citations={getQueryCitations(mentions)} />
                        </div>
                      )}

                      {/* Brand mentions */}
                      {mentions.filter(m => m.brand).map((mention, idx) => (
                        <div
                          key={`${mention.id}-${idx}`}
                          style={{
                            padding: '16px',
                            marginBottom: '12px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600 }}>{mention.brand}</span>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)'
                              }}>
                                #{mention.position}
                              </span>
                              {getSentimentBadge(mention.sentiment)}
                            </div>
                            <span style={{ fontSize: '12px', opacity: 0.5 }}>
                              {new Date(mention.runDate).toLocaleDateString()}
                            </span>
                          </div>
                          {mention.context && (
                            <div style={{
                              fontSize: '13px',
                              opacity: 0.8,
                              fontStyle: 'italic',
                              padding: '12px',
                              background: 'rgba(0,0,0,0.2)',
                              borderRadius: '8px',
                              borderLeft: '3px solid var(--accent)'
                            }}>
                              "{mention.context}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center', opacity: 0.6, fontSize: '14px' }}>
          Showing {Object.keys(groupedQueries).length} unique queries with {filteredQueries.length} total mentions
        </div>
        </div>
      </div>
    </AppShell>
  );
};

export default QueryDetailPage;
