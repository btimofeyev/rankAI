import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSession } from '../hooks/useSession.tsx';
import Layout from '../components/Layout.tsx';
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
  const { session, signOut } = useSession();
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

  if (queriesQuery.isLoading) {
    return (
      <Layout>
        <div style={{ padding: '48px', textAlign: 'center', opacity: 0.6 }}>
          Loading query data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 48px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Dashboard
          </button>
          <span style={{ fontWeight: 600, fontSize: '18px' }}>Query Details</span>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          style={{ padding: '10px 16px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'inherit', cursor: 'pointer' }}
        >
          Log out
        </button>
      </header>

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
                      <div style={{ fontSize: '15px', fontWeight: 500, marginBottom: '8px' }}>{queryText}</div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', opacity: 0.7 }}>
                        <span>{mentions.length} mention{mentions.length !== 1 ? 's' : ''}</span>
                        <span>{new Set(mentions.map(m => m.brand)).size} brand{new Set(mentions.map(m => m.brand)).size !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '20px', transform: expandedRow === queryText ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                  </div>

                  {expandedRow === queryText && (
                    <div style={{ padding: '0 24px 20px' }}>
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
    </Layout>
  );
};

export default QueryDetailPage;
