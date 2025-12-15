import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { activitiesAPI } from '../../services/api';
import DashboardLayout from './DashboardLayout';

const Scope3Dashboard = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [scope3Data, setScope3Data] = useState({
    totalEmissions: 0,
    activityCount: 0,
    categories: []
  });
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoryDefinitions = [
    { code: '3.1', name: 'Purchased Goods & Services', icon: '🛒', color: '#8B5CF6', keywords: ['purchase', 'goods', 'materials', 'supplies'] },
    { code: '3.2', name: 'Capital Goods', icon: '🏭', color: '#EC4899', keywords: ['capital', 'equipment', 'machinery', 'building'] },
    { code: '3.3', name: 'Fuel & Energy Related', icon: '⛽', color: '#F59E0B', keywords: ['fuel', 'upstream', 'extraction'] },
    { code: '3.4', name: 'Upstream Transportation', icon: '🚚', color: '#10B981', keywords: ['upstream', 'inbound', 'logistics', 'delivery'] },
    { code: '3.5', name: 'Waste in Operations', icon: '🗑️', color: '#EF4444', keywords: ['waste', 'disposal', 'landfill'] },
    { code: '3.6', name: 'Business Travel', icon: '✈️', color: '#3B82F6', keywords: ['travel', 'flight', 'hotel', 'business trip'] },
    { code: '3.7', name: 'Employee Commuting', icon: '🚗', color: '#06B6D4', keywords: ['commute', 'employee travel', 'taxi', 'cab'] },
    { code: '3.8', name: 'Upstream Leased Assets', icon: '🏢', color: '#A855F7', keywords: ['leased', 'upstream lease'] },
    { code: '3.9', name: 'Downstream Transportation', icon: '🚛', color: '#14B8A6', keywords: ['downstream', 'outbound', 'shipping'] },
    { code: '3.10', name: 'Processing of Sold Products', icon: '⚙️', color: '#F97316', keywords: ['processing', 'manufacturing'] },
    { code: '3.11', name: 'Use of Sold Products', icon: '📱', color: '#8B5CF6', keywords: ['product use', 'operation'] },
    { code: '3.12', name: 'End-of-Life Treatment', icon: '♻️', color: '#059669', keywords: ['end of life', 'disposal', 'recycling'] },
    { code: '3.13', name: 'Downstream Leased Assets', icon: '🏠', color: '#D946EF', keywords: ['downstream lease'] },
    { code: '3.14', name: 'Franchises', icon: '🏪', color: '#F43F5E', keywords: ['franchise'] },
    { code: '3.15', name: 'Investments', icon: '💼', color: '#0EA5E9', keywords: ['investment', 'equity'] }
  ];

  useEffect(() => {
    if (user?.company_id) {
      fetchScope3Data();
    }
  }, [user]);

  const fetchScope3Data = async () => {
    setLoading(true);
    try {
      const response = await activitiesAPI.getActivities(user.company_id);
      const activities = response.data.activities || [];

      // Filter Scope 3 activities
      const scope3Activities = activities.filter(act => act.scope_number === 3);

      // Calculate total emissions
      const totalEmissions = scope3Activities.reduce((sum, act) =>
        sum + (act.emissions_kgco2e || 0), 0
      );

      // Categorize activities
      const categorizedData = categoryDefinitions.map(catDef => {
        const categoryActivities = scope3Activities.filter(act => {
          const activityText = `${act.activity_type || ''} ${act.category || ''} ${act.activity_name || ''}`.toLowerCase();
          return catDef.keywords.some(keyword => activityText.includes(keyword));
        });

        const categoryEmissions = categoryActivities.reduce((sum, act) =>
          sum + (act.emissions_kgco2e || 0), 0
        );

        return {
          ...catDef,
          activities: categoryActivities,
          emissions: categoryEmissions,
          activityCount: categoryActivities.length,
          percentage: totalEmissions > 0 ? (categoryEmissions / totalEmissions * 100) : 0
        };
      });

      const categoriesWithData = categorizedData.filter(cat => cat.activityCount > 0);

      setScope3Data({
        totalEmissions,
        activityCount: scope3Activities.length,
        categories: categoriesWithData,
        allCategories: categorizedData
      });
    } catch (err) {
      console.error('Failed to fetch Scope 3 data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Summary cards configuration
  const summaryCards = [
    {
      icon: '🌍',
      value: (scope3Data.totalEmissions / 1000).toFixed(2),
      label: 'Total Scope 3 Emissions',
      unit: 'tonnes CO2e',
      gradientLight: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)',
      accentColor: '#8B5CF6',
      textColorLight: '#5B21B6',
      textColorDark: '#A78BFA',
    },
    {
      icon: '📋',
      value: scope3Data.activityCount,
      label: 'Total Activities',
      unit: 'recorded',
      gradientLight: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
      accentColor: '#3B82F6',
      textColorLight: '#1E40AF',
      textColorDark: '#60A5FA',
    },
    {
      icon: '📂',
      value: scope3Data.categories.length,
      label: 'Active Categories',
      unit: 'out of 15',
      gradientLight: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
      accentColor: '#10B981',
      textColorLight: '#065F46',
      textColorDark: '#34D399',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6'}`,
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Loading Scope 3 data...</p>
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
          }}>📊</div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            fontSize: isMobile ? '30px' : '40px',
            opacity: 0.1,
          }}>🌍</div>
          
          <div style={{
            position: 'relative',
            zIndex: 1,
          }}>
            <h1 style={{
              fontSize: isMobile ? '22px' : isTablet ? '26px' : '30px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              📊 Scope 3 Value Chain Emissions
            </h1>
            <p style={{
              fontSize: isMobile ? '13px' : '15px',
              margin: 0,
              opacity: 0.9,
              lineHeight: 1.4,
            }}>
              Track and analyze indirect emissions across 15 GHG Protocol categories
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: isMobile ? '20px' : '28px',
        }}>
          {summaryCards.map((card, index) => (
            <SummaryCard key={index} card={card} isDark={isDark} isMobile={isMobile} />
          ))}
        </div>

        {/* Section Header */}
        <div style={{
          marginBottom: isMobile ? '16px' : '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: colors.text,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📂 Scope 3 Categories Breakdown
          </h2>
          <span style={{
            fontSize: '12px',
            color: isDark ? '#A78BFA' : '#7C3AED',
            background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: '600',
            border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)'}`,
          }}>
            {scope3Data.categories.length} of 15 categories active
          </span>
        </div>

        {/* Category Grid or Empty State */}
        {scope3Data.categories.length === 0 ? (
          <div style={{
            background: isDark 
              ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '12px' : '16px',
            padding: isMobile ? '40px 20px' : '60px 40px',
            textAlign: 'center',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark 
              ? '0 8px 32px rgba(0,0,0,0.3)' 
              : '0 8px 32px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.4 }}>📊</div>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              color: colors.text,
              margin: '0 0 8px 0',
            }}>No Scope 3 Activities Yet</h3>
            <p style={{ 
              fontSize: '14px', 
              color: colors.textSecondary,
              margin: 0,
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              Add activities with Scope 3 classification to see them organized by GHG Protocol categories
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '12px' : '16px',
          }}>
            {scope3Data.categories.map((category) => (
              <CategoryCard
                key={category.code}
                category={category}
                isDark={isDark}
                isMobile={isMobile}
                colors={colors}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>
        )}

        {/* Category Detail Modal */}
        {selectedCategory && (
          <CategoryDetailModal
            category={selectedCategory}
            onClose={() => setSelectedCategory(null)}
            isDark={isDark}
            colors={colors}
            isMobile={isMobile}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

// Summary Card Component
const SummaryCard = ({ card, isDark, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        background: isDark ? card.gradientDark : card.gradientLight,
        padding: isMobile ? '16px' : '20px',
        borderRadius: isMobile ? '12px' : '14px',
        border: `1px solid ${isDark ? `${card.accentColor}30` : `${card.accentColor}40`}`,
        boxShadow: isHovered 
          ? `0 8px 24px ${card.accentColor}30` 
          : `0 4px 12px ${card.accentColor}15`,
        transition: 'all 0.3s ease',
        transform: isHovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '14px' : '18px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        fontSize: isMobile ? '36px' : '44px',
        flexShrink: 0,
      }}>
        {card.icon}
      </div>
      <div>
        <p style={{
          fontSize: isMobile ? '24px' : '28px',
          fontWeight: '800',
          color: isDark ? card.textColorDark : card.textColorLight,
          margin: '0 0 4px 0',
          lineHeight: 1.1,
        }}>
          {card.value}
        </p>
        <p style={{
          fontSize: isMobile ? '12px' : '13px',
          color: card.accentColor,
          fontWeight: '600',
          margin: '0 0 2px 0',
        }}>
          {card.label}
        </p>
        <p style={{
          fontSize: isMobile ? '10px' : '11px',
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
          margin: 0,
        }}>
          {card.unit}
        </p>
      </div>
    </div>
  );
};

// Category Card Component
const CategoryCard = ({ category, isDark, isMobile, colors, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        background: isDark 
          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        padding: isMobile ? '16px' : '20px',
        borderRadius: isMobile ? '12px' : '14px',
        borderLeft: `4px solid ${category.color}`,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        borderLeftWidth: '4px',
        borderLeftColor: category.color,
        boxShadow: isHovered 
          ? (isDark ? '0 12px 32px rgba(0,0,0,0.4)' : '0 12px 32px rgba(0,0,0,0.12)')
          : (isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 4px 16px rgba(0,0,0,0.06)'),
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        transform: isHovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <span style={{ fontSize: isMobile ? '32px' : '40px' }}>{category.icon}</span>
        <span style={{
          padding: '4px 10px',
          background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
          color: colors.textSecondary,
        }}>
          {category.code}
        </span>
      </div>

      <h3 style={{
        fontSize: isMobile ? '14px' : '15px',
        fontWeight: '600',
        color: colors.text,
        margin: '0 0 12px 0',
        lineHeight: 1.3,
      }}>
        {category.name}
      </h3>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: '14px',
        paddingBottom: '14px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div>
          <p style={{
            fontSize: isMobile ? '22px' : '26px',
            fontWeight: '800',
            color: category.color,
            margin: '0 0 2px 0',
            lineHeight: 1.1,
          }}>
            {(category.emissions / 1000).toFixed(2)}
          </p>
          <p style={{
            fontSize: '10px',
            color: colors.textTertiary,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}>
            tonnes CO2e
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: colors.text,
            margin: '0 0 2px 0',
          }}>
            {category.percentage.toFixed(1)}%
          </p>
          <p style={{
            fontSize: '10px',
            color: colors.textSecondary,
            margin: 0,
          }}>
            {category.activityCount} {category.activityCount === 1 ? 'activity' : 'activities'}
          </p>
        </div>
      </div>

      <button style={{
        width: '100%',
        padding: isMobile ? '10px' : '12px',
        background: category.color,
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontSize: isMobile ? '12px' : '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s',
        opacity: isHovered ? 0.9 : 1,
      }}>
        View Details →
      </button>
    </div>
  );
};

// Category Detail Modal
const CategoryDetailModal = ({ category, onClose, isDark, colors, isMobile }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isMobile ? '16px' : '32px',
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: isDark 
            ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          overflow: 'hidden',
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px' : '20px',
          background: category.color,
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: isMobile ? '32px' : '40px' }}>{category.icon}</span>
            <div>
              <h2 style={{
                fontSize: isMobile ? '16px' : '20px',
                fontWeight: '700',
                margin: 0,
              }}>
                {category.code}: {category.name}
              </h2>
              <p style={{
                fontSize: isMobile ? '12px' : '14px',
                margin: '4px 0 0 0',
                opacity: 0.9,
              }}>
                {category.activityCount} activities • {(category.emissions / 1000).toFixed(2)} tonnes CO2e
              </p>
            </div>
          </div>
          <button 
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'white',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '16px' : '20px',
          overflowY: 'auto',
          flex: 1,
        }}>
          {category.activities.length === 0 ? (
            <p style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: colors.textSecondary,
              fontSize: '14px',
            }}>
              No activities in this category
            </p>
          ) : isMobile ? (
            // Mobile Card View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {category.activities.map((activity, index) => (
                <div 
                  key={activity.id || index}
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
                    borderRadius: '10px',
                    padding: '12px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                  }}
                >
                  <div style={{
                    fontWeight: '600',
                    color: colors.text,
                    fontSize: '13px',
                    marginBottom: '8px',
                  }}>
                    {activity.activity_type || activity.activity_name}
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '12px',
                  }}>
                    <div>
                      <span style={{ color: colors.textTertiary }}>Quantity: </span>
                      <span style={{ color: colors.text, fontWeight: '500' }}>
                        {activity.quantity?.toFixed(2)} {activity.unit}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: colors.textTertiary }}>Emissions: </span>
                      <span style={{ color: category.color, fontWeight: '600' }}>
                        {(activity.emissions_kgco2e / 1000).toFixed(3)} t
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop Table View
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
                gap: '12px',
                padding: '12px 16px',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                <div>Activity</div>
                <div>Quantity</div>
                <div>Unit</div>
                <div>Emissions</div>
                <div>Date</div>
              </div>
              {category.activities.map((activity, index) => (
                <div 
                  key={activity.id || index} 
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
                    gap: '12px',
                    padding: '14px 16px',
                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: colors.text,
                    alignItems: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark 
                      ? `${category.color}15` 
                      : `${category.color}08`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isDark 
                      ? 'rgba(255,255,255,0.03)' 
                      : 'rgba(255,255,255,0.8)';
                  }}
                >
                  <div style={{ fontWeight: '500' }}>
                    {activity.activity_type || activity.activity_name}
                  </div>
                  <div>{activity.quantity?.toFixed(2)}</div>
                  <div style={{ color: colors.textSecondary }}>{activity.unit}</div>
                  <div style={{ fontWeight: '600', color: category.color }}>
                    {(activity.emissions_kgco2e / 1000).toFixed(3)} t
                  </div>
                  <div style={{ color: colors.textSecondary }}>
                    {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scope3Dashboard;
