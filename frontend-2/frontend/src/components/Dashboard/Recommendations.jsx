// AI Recommendations Page - with Dark/Light mode support v3.0
import { useState, useEffect } from 'react';
import { recommendationsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import DashboardLayout from './DashboardLayout';

function Recommendations({ user }) {
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(null);
  const [maxRecommendations, setMaxRecommendations] = useState(5);
  const [cacheInfo, setCacheInfo] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [savedRecommendations, setSavedRecommendations] = useState(new Set());
  const [implementedRecommendations, setImplementedRecommendations] = useState(new Set());

  useEffect(() => {
    fetchRecommendations();
  }, [period, maxRecommendations]);

  useEffect(() => {
    const loadPersistedData = () => {
      try {
        const key = `recommendations_${user.company_id}`;
        const persisted = localStorage.getItem(key);
        if (persisted) {
          const data = JSON.parse(persisted);
          const age = Date.now() - data.timestamp;
          if (age < 24 * 60 * 60 * 1000) {
            setRecommendations(data.recommendations || []);
            setCacheInfo(data.cacheInfo || null);
            setSavedRecommendations(new Set(data.savedRecommendations || []));
            setImplementedRecommendations(new Set(data.implementedRecommendations || []));
          } else {
            localStorage.removeItem(key);
          }
        }
      } catch (error) {
        console.error('Error loading persisted recommendations:', error);
        localStorage.removeItem(`recommendations_${user.company_id}`);
      }
    };

    loadPersistedData();

    const handleStorageChange = (e) => {
      if (e.key === `recommendations_${user.company_id}`) {
        loadPersistedData();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user.company_id]);

  useEffect(() => {
    if (recommendations.length > 0) {
      const key = `recommendations_${user.company_id}`;
      const data = {
        recommendations,
        cacheInfo,
        savedRecommendations: Array.from(savedRecommendations),
        implementedRecommendations: Array.from(implementedRecommendations),
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    }
  }, [recommendations, cacheInfo, savedRecommendations, implementedRecommendations, user.company_id]);

  const fetchRecommendations = async (refresh = false) => {
    try {
      setLoading(true);
      setError('');
      setAnimationPhase('analyzing');
      setAnimationProgress(0);

      const analysisInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 30) {
            clearInterval(analysisInterval);
            setAnimationPhase('generating');
            return 30;
          }
          return prev + 5;
        });
      }, 200);

      const response = await recommendationsAPI.getRecommendations(
        user.company_id,
        period,
        maxRecommendations,
        refresh || forceRefresh
      );

      clearInterval(analysisInterval);
      setAnimationPhase('generating');
      setAnimationProgress(30);

      const generationInterval = setInterval(() => {
        setAnimationProgress(prev => {
          if (prev >= 90) {
            clearInterval(generationInterval);
            return 90;
          }
          return prev + 3;
        });
      }, 150);

      const data = response.data;

      if (data.success) {
        setTimeout(() => {
          setAnimationProgress(100);
          setAnimationPhase('complete');

          setRecommendations(data.recommendations || []);
          setCacheInfo({
            cached: data.summary?.cached || data.cached || false,
            generated_at: data.generated_at || data.summary?.generated_at,
            recommendation_id: data.recommendation_id || data.metadata?.recommendation_id,
            expires_at: data.summary?.expires_at,
            total_savings: data.summary?.total_potential_savings_kg,
            reduction_percentage: data.summary?.potential_reduction_percentage
          });

          setTimeout(() => {
            setAnimationPhase('idle');
            setAnimationProgress(0);
          }, 1000);
        }, 500);
      } else {
        clearInterval(generationInterval);
        setError(data.error || 'Failed to load recommendations');
        setRecommendations([]);
        setAnimationPhase('idle');
        setAnimationProgress(0);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError('Failed to load recommendations. Please try again.');
      setRecommendations([]);
      setAnimationPhase('idle');
      setAnimationProgress(0);
    } finally {
      setLoading(false);
      setForceRefresh(false);
    }
  };

  const saveRecommendation = async (recommendationId) => {
    try {
      const response = await recommendationsAPI.saveRecommendation(user.company_id, recommendationId);
      if (response.data.success) {
        setSavedRecommendations(prev => new Set([...prev, recommendationId]));
      } else {
        throw new Error(response.data.message || 'Failed to save recommendation');
      }
    } catch (error) {
      console.error('Error saving recommendation:', error);
      if (error.response?.status === 404) {
        alert('Recommendation not found. Please refresh the page and try again.');
      } else {
        alert('Failed to save recommendation. Please check your connection and try again.');
      }
    }
  };

  const markAsImplemented = async (recommendationId) => {
    try {
      const response = await recommendationsAPI.markAsImplemented(user.company_id, recommendationId, {
        implementation_notes: 'Marked as implemented from dashboard',
        implementation_progress: 100
      });
      if (response.data.success) {
        setImplementedRecommendations(prev => new Set([...prev, recommendationId]));
        setSavedRecommendations(prev => {
          const newSet = new Set(prev);
          newSet.delete(recommendationId);
          return newSet;
        });
      } else {
        throw new Error(response.data.message || 'Failed to mark as implemented');
      }
    } catch (error) {
      console.error('Error marking as implemented:', error);
      if (error.response?.status === 404) {
        alert('Recommendation not found. Please refresh the page and try again.');
      } else {
        alert('Failed to mark as implemented. Please check your connection and try again.');
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return { bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', text: isDark ? '#F87171' : '#DC2626' };
      case 'medium': return { bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7', text: isDark ? '#FBBF24' : '#D97706' };
      case 'low': return { bg: isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', text: isDark ? '#34D399' : '#059669' };
      default: return { bg: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', text: colors.textSecondary };
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  // Loading State with Animation
  if (loading && animationPhase !== 'idle') {
    return (
      <DashboardLayout>
        <div style={{
          minHeight: '100vh',
          background: isDark ? colors.bgSecondary : '#F5F3FF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}>
          <AnimatedAILoader phase={animationPhase} progress={animationProgress} isDark={isDark} colors={colors} />
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            maxWidth: '400px',
          }}>
            <h3 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: '700',
              color: colors.text,
              marginBottom: '12px',
            }}>
              {animationPhase === 'analyzing' && '🤖 Analyzing Your Emissions Data'}
              {animationPhase === 'generating' && '🧠 Generating Smart Recommendations'}
              {animationPhase === 'complete' && '✅ Recommendations Ready!'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: colors.textSecondary,
              lineHeight: 1.5,
              marginBottom: '24px',
            }}>
              {animationPhase === 'analyzing' && 'Processing your carbon footprint data and identifying key emission sources...'}
              {animationPhase === 'generating' && 'AI is crafting personalized reduction strategies based on your industry and operations...'}
              {animationPhase === 'complete' && 'Your comprehensive carbon reduction roadmap is ready!'}
            </p>
            <div style={{
              width: '100%',
              height: '8px',
              background: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '12px',
            }}>
              <div style={{
                height: '100%',
                borderRadius: '4px',
                transition: 'width 0.3s ease',
                width: `${animationProgress}%`,
                background: animationPhase === 'analyzing' ? '#3B82F6' :
                          animationPhase === 'generating' ? '#8B5CF6' : '#10B981',
              }} />
            </div>
            <p style={{
              fontSize: '13px',
              color: colors.textSecondary,
              fontWeight: '600',
            }}>
              {animationProgress}% complete
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: isDark ? colors.bgSecondary : '#F5F3FF',
        transition: 'background 0.3s ease',
      }}>
        {/* Hero Header */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)' 
            : 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '20px' : isTablet ? '28px' : '32px',
          marginBottom: isMobile ? '16px' : '24px',
          color: 'white',
          boxShadow: isDark 
            ? '0 8px 32px rgba(91, 33, 182, 0.4)' 
            : '0 8px 32px rgba(139, 92, 246, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            fontSize: isMobile ? '40px' : '60px',
            opacity: 0.15,
          }}>🤖</div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            fontSize: isMobile ? '30px' : '40px',
            opacity: 0.1,
          }}>🧠</div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{
              fontSize: isMobile ? '22px' : isTablet ? '26px' : '30px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              🤖 AI Recommendations
            </h1>
            <p style={{
              fontSize: isMobile ? '13px' : '15px',
              margin: 0,
              opacity: 0.9,
              lineHeight: 1.4,
            }}>
              Smart emission reduction strategies powered by AI
            </p>
          </div>
        </div>

        {/* Controls Section */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '20px',
          marginBottom: isMobile ? '16px' : '24px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDark 
            ? '0 4px 16px rgba(0,0,0,0.3)' 
            : '0 4px 16px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '16px',
            alignItems: isMobile ? 'stretch' : 'flex-end',
            flexWrap: 'wrap',
          }}>
            {/* Period Select */}
            <div style={{ flex: isMobile ? 'none' : '1', minWidth: '140px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: colors.textSecondary,
                marginBottom: '6px',
              }}>
                📅 Period
              </label>
              <select
                value={period || ''}
                onChange={(e) => setPeriod(e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB'}`,
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                  color: colors.text,
                  cursor: 'pointer',
                }}
              >
                <option value="">All time</option>
                <option value="FY 2024-25">FY 2024-25</option>
                <option value="FY 2023-24">FY 2023-24</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
            </div>

            {/* Max Recommendations Select */}
            <div style={{ flex: isMobile ? 'none' : '1', minWidth: '140px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: colors.textSecondary,
                marginBottom: '6px',
              }}>
                🔢 Max Results
              </label>
              <select
                value={maxRecommendations}
                onChange={(e) => setMaxRecommendations(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#D1D5DB'}`,
                  borderRadius: '10px',
                  fontSize: '13px',
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                  color: colors.text,
                  cursor: 'pointer',
                }}
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '8px',
              flex: isMobile ? 'none' : '2',
              flexWrap: 'wrap',
            }}>
              <ActionButton
                onClick={() => fetchRecommendations(false)}
                icon="🔄"
                label="Refresh"
                gradient="linear-gradient(135deg, #667EEA 0%, #764BA2 100%)"
                isMobile={isMobile}
              />
              <ActionButton
                onClick={() => fetchRecommendations(true)}
                icon="⚡"
                label="Generate New"
                gradient="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                isMobile={isMobile}
              />
              <ActionButton
                onClick={() => {
                  localStorage.removeItem(`recommendations_${user.company_id}`);
                  setRecommendations([]);
                  setCacheInfo(null);
                  setSavedRecommendations(new Set());
                  setImplementedRecommendations(new Set());
                }}
                icon="🗑️"
                label="Clear Cache"
                gradient="linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                isMobile={isMobile}
              />
            </div>
          </div>
        </div>

        {/* Error Box */}
        {error && (
          <div style={{
            padding: '14px 18px',
            background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
            borderRadius: '12px',
            color: isDark ? '#F87171' : '#DC2626',
            fontSize: '14px',
            marginBottom: '20px',
          }}>
            ❌ {error}
          </div>
        )}

        {/* Cache Status */}
        {cacheInfo && !loading && (
          <div style={{
            marginBottom: isMobile ? '16px' : '24px',
            padding: isMobile ? '14px' : '18px',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)'
              : 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
            borderRadius: '12px',
            border: `1px solid ${isDark ? 'rgba(14, 165, 233, 0.3)' : '#0EA5E9'}`,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '20px' }}>
                {cacheInfo.cached ? '💾' : '🤖'}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isDark ? '#38BDF8' : '#0C4A6E',
              }}>
                {cacheInfo.cached ? 'Using cached recommendations' : 'Fresh AI-generated recommendations'}
              </span>
              {cacheInfo.generated_at && (
                <span style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                  marginLeft: 'auto',
                }}>
                  Generated: {new Date(cacheInfo.generated_at).toLocaleString()}
                </span>
              )}
            </div>
            {cacheInfo.total_savings && (
              <div style={{ marginTop: '10px' }}>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: isDark ? '#34D399' : '#059669',
                }}>
                  💰 Potential Savings: {cacheInfo.total_savings?.toLocaleString()} kg CO2e
                  ({cacheInfo.reduction_percentage?.toFixed(1)}% reduction)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Section */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDark 
            ? '0 8px 32px rgba(0,0,0,0.3)' 
            : '0 8px 32px rgba(0,0,0,0.06)',
        }}>
          {recommendations.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '40px 20px' : '60px 40px',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🤖</div>
              <p style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.text,
                marginBottom: '8px',
              }}>
                No recommendations available
              </p>
              <p style={{
                fontSize: '14px',
                color: colors.textSecondary,
                marginBottom: '24px',
              }}>
                Add emission activities first, then click "Generate New" to get AI-powered recommendations
              </p>
              
              {/* Instruction Box */}
              <div style={{
                maxWidth: '500px',
                margin: '0 auto',
                padding: '20px',
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)'
                  : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                borderRadius: '12px',
                border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : '#E2E8F0'}`,
                textAlign: 'left',
              }}>
                <h4 style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.text,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  📋 How to get recommendations:
                </h4>
                <ol style={{
                  paddingLeft: '20px',
                  margin: 0,
                  color: colors.textSecondary,
                  fontSize: '13px',
                  lineHeight: 1.8,
                }}>
                  <li>Add emission activities in the Activities section</li>
                  <li>Return here and click "⚡ Generate New" button</li>
                  <li>Wait for AI to analyze your data and provide recommendations</li>
                  <li>Use "Save for Later" or "Mark as Implemented" buttons</li>
                </ol>
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '16px' : '20px',
            }}>
              {recommendations.map((rec, index) => {
                let uniqueId = rec.recommendation_unique_id;
                if (!uniqueId) {
                  const titleHash = rec.title ? rec.title.replace(/\s+/g, '_').substring(0, 20) : 'rec';
                  uniqueId = `${titleHash}_${index}_${Date.now()}`;
                }
                return (
                  <RecommendationCard
                    key={index}
                    recommendation={{...rec, recommendation_unique_id: uniqueId}}
                    priorityColors={getPriorityColor(rec.priority)}
                    priorityIcon={getPriorityIcon(rec.priority)}
                    isSaved={savedRecommendations.has(uniqueId)}
                    isImplemented={implementedRecommendations.has(uniqueId)}
                    onSave={() => saveRecommendation(uniqueId)}
                    onImplement={() => markAsImplemented(uniqueId)}
                    hasRecommendations={recommendations.length > 0}
                    isDark={isDark}
                    colors={colors}
                    isMobile={isMobile}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Action Button Component
function ActionButton({ onClick, icon, label, gradient, isMobile }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      style={{
        flex: isMobile ? 1 : 'none',
        padding: isMobile ? '10px 14px' : '10px 16px',
        background: gradient,
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon} {label}
    </button>
  );
}

// Animated AI Loader Component
function AnimatedAILoader({ phase, progress, isDark, colors }) {
  const [thinkingDots, setThinkingDots] = useState('•');

  useEffect(() => {
    if (phase === 'analyzing') {
      const interval = setInterval(() => {
        setThinkingDots(prev => prev.length < 3 ? prev + '•' : '•');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '120px',
      height: '120px',
      borderRadius: '50%',
      background: isDark 
        ? 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)'
        : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
      border: `3px solid ${phase === 'analyzing' ? '#3B82F6' : phase === 'generating' ? '#8B5CF6' : '#10B981'}`,
      boxShadow: `0 10px 40px ${phase === 'analyzing' ? 'rgba(59, 130, 246, 0.3)' : phase === 'generating' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
    }}>
      <div style={{
        fontSize: '48px',
        transition: 'all 0.5s ease',
        transform: phase === 'analyzing' ? 'scale(1.1)' :
                  phase === 'generating' ? 'scale(1.2)' : 'scale(1.3)',
      }}>
        {phase === 'complete' ? '✅' : '🧠'}
      </div>
      {phase === 'analyzing' && (
        <div style={{
          position: 'absolute',
          bottom: '15px',
          fontSize: '20px',
          color: '#3B82F6',
          fontWeight: 'bold',
        }}>
          {thinkingDots}
        </div>
      )}
      {phase === 'generating' && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          fontSize: '18px',
        }}>
          ✨✨✨
        </div>
      )}
    </div>
  );
}

// Recommendation Card Component
function RecommendationCard({ recommendation, priorityColors, priorityIcon, isSaved, isImplemented, onSave, onImplement, hasRecommendations, isDark, colors, isMobile }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: isDark 
        ? 'rgba(255,255,255,0.03)' 
        : 'rgba(0,0,0,0.01)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      borderRadius: '14px',
      padding: isMobile ? '16px' : '20px',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          background: priorityColors.bg,
          borderRadius: '20px',
        }}>
          <span style={{ fontSize: '14px' }}>{priorityIcon}</span>
          <span style={{
            fontSize: '12px',
            fontWeight: '600',
            color: priorityColors.text,
            textTransform: 'capitalize',
          }}>
            {recommendation.priority} Priority
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
            border: 'none',
            fontSize: '18px',
            cursor: 'pointer',
            color: colors.textSecondary,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {expanded ? '−' : '+'}
        </button>
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '600',
        color: colors.text,
        margin: '0 0 14px 0',
        lineHeight: 1.4,
      }}>
        {recommendation.title}
      </h3>

      {/* Executive Summary */}
      <div style={{
        marginBottom: '16px',
        padding: '14px',
        background: isDark 
          ? 'rgba(139, 92, 246, 0.1)' 
          : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        borderRadius: '10px',
        border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : '#E2E8F0'}`,
      }}>
        <p style={{
          fontSize: '13px',
          color: colors.textSecondary,
          lineHeight: 1.6,
          margin: 0,
        }}>
          {recommendation.executive_summary}
        </p>
      </div>

      {/* Meta Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '16px',
      }}>
        {[
          { label: 'Potential Savings', value: `${recommendation.estimated_savings_kg?.toLocaleString() || 0} kg CO2e`, color: '#10B981' },
          { label: 'Cost Range', value: recommendation.implementation_details?.cost_range_inr || 'TBD', color: '#3B82F6' },
          { label: 'Timeline', value: recommendation.implementation_details?.timeline_months || 'TBD', color: '#F59E0B' },
          { label: 'Difficulty', value: recommendation.implementation_details?.difficulty || 'Medium', color: '#8B5CF6' },
        ].map((item, idx) => (
          <div key={idx} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}>
            <span style={{
              fontSize: '11px',
              color: colors.textTertiary,
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
            }}>
              {item.label}
            </span>
            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: isDark ? item.color : colors.text,
            }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Expanded Content */}
      {expanded && (
        <ExpandedContent 
          recommendation={recommendation} 
          isDark={isDark} 
          colors={colors}
          isMobile={isMobile}
        />
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            background: isImplemented 
              ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5')
              : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: isImplemented ? (isDark ? '#34D399' : '#059669') : 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isImplemented || !hasRecommendations ? 'not-allowed' : 'pointer',
            opacity: !hasRecommendations ? 0.5 : 1,
          }}
          onClick={() => {
            if (!hasRecommendations) {
              alert('Please generate recommendations first before marking as implemented.');
              return;
            }
            onImplement();
          }}
          disabled={isImplemented || !hasRecommendations}
        >
          {isImplemented ? '✅ Implemented' : '✅ Mark as Implemented'}
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px 16px',
            background: isSaved 
              ? (isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE')
              : (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'),
            color: isSaved ? (isDark ? '#60A5FA' : '#1E40AF') : colors.text,
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: isSaved || isImplemented || !hasRecommendations ? 'not-allowed' : 'pointer',
            opacity: !hasRecommendations ? 0.5 : 1,
          }}
          onClick={() => {
            if (!hasRecommendations) {
              alert('Please generate recommendations first before saving for later.');
              return;
            }
            onSave();
          }}
          disabled={isSaved || isImplemented || !hasRecommendations}
        >
          {isSaved ? '💾 Saved' : '💾 Save for Later'}
        </button>
      </div>
    </div>
  );
}

// Expanded Content Component
function ExpandedContent({ recommendation, isDark, colors, isMobile }) {
  const sectionStyle = {
    marginBottom: '20px',
    padding: isMobile ? '14px' : '18px',
    background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
  };

  const titleStyle = {
    fontSize: isMobile ? '15px' : '16px',
    fontWeight: '700',
    color: colors.text,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Detailed Analysis */}
      {recommendation.detailed_analysis && (
        <div style={sectionStyle}>
          <h4 style={titleStyle}>📊 Comprehensive Analysis</h4>
          <div style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: 1.7 }}>
            {recommendation.detailed_analysis?.split('\n').map((paragraph, index) => (
              paragraph.trim() && <p key={index} style={{ marginBottom: '10px' }}>{paragraph.trim()}</p>
            ))}
          </div>
        </div>
      )}

      {/* Impact Metrics */}
      {recommendation.impact_metrics && (
        <div style={sectionStyle}>
          <h4 style={titleStyle}>📈 Impact Assessment</h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '10px',
          }}>
            {[
              { label: 'Estimated Savings', value: `${recommendation.impact_metrics.estimated_savings_kg?.toLocaleString()} kg CO2e` },
              { label: 'Savings Range', value: recommendation.impact_metrics.savings_range_kg },
              { label: 'Reduction %', value: recommendation.impact_metrics.reduction_percentage },
              { label: 'Payback Period', value: `${recommendation.impact_metrics.payback_period_months} months` },
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                borderRadius: '8px',
              }}>
                <span style={{ fontSize: '12px', color: colors.textSecondary }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: colors.text }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Plan */}
      {recommendation.action_plan && recommendation.action_plan.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={titleStyle}>📅 Action Plan</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendation.action_plan.map((phase, index) => (
              <div key={index} style={{
                padding: '14px',
                background: isDark ? 'rgba(139, 92, 246, 0.08)' : '#F8FAFC',
                borderRadius: '10px',
                borderLeft: `3px solid #8B5CF6`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}>
                  <h5 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: colors.text,
                    margin: 0,
                  }}>
                    {phase.phase}
                  </h5>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: isDark ? '#A78BFA' : '#7C3AED',
                    background: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE',
                    padding: '3px 8px',
                    borderRadius: '10px',
                  }}>
                    {phase.duration_weeks} weeks
                  </span>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: colors.textSecondary,
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {phase.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expected Benefits */}
      {recommendation.expected_benefits && recommendation.expected_benefits.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={titleStyle}>💎 Expected Benefits</h4>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}>
            {recommendation.expected_benefits.map((benefit, index) => (
              <li key={index} style={{
                fontSize: '13px',
                color: colors.textSecondary,
                padding: '8px 0',
                borderBottom: index < recommendation.expected_benefits.length - 1 
                  ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` 
                  : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}>
                <span style={{ color: '#10B981' }}>✓</span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {recommendation.risks_and_mitigations && recommendation.risks_and_mitigations.length > 0 && (
        <div style={sectionStyle}>
          <h4 style={titleStyle}>⚠️ Risk Assessment</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recommendation.risks_and_mitigations.map((risk, index) => (
              <div key={index} style={{
                padding: '12px',
                background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                borderRadius: '10px',
                border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA'}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isDark ? '#F87171' : '#DC2626',
                    flex: 1,
                  }}>
                    {risk.risk}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: isDark ? '#FCA5A5' : '#7F1D1D',
                      background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
                      padding: '2px 6px',
                      borderRadius: '6px',
                    }}>
                      {risk.probability}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '600',
                      color: isDark ? '#FCA5A5' : '#7F1D1D',
                      background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
                      padding: '2px 6px',
                      borderRadius: '6px',
                    }}>
                      {risk.impact}
                    </span>
                  </div>
                </div>
                <p style={{
                  fontSize: '12px',
                  color: isDark ? '#FCA5A5' : '#991B1B',
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  <strong>Mitigation:</strong> {risk.mitigation_strategy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Recommendations;
