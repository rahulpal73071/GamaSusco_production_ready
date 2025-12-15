// frontend/src/components/LineChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';

function EmissionLineChart({ activities, period }) {
  // Process activities into chart data
  const chartData = processActivitiesForChart(activities, period);
  const isDailyActivities = period === 'day' && activities && activities.length > 0 && activities[0]?.activity_date;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      if (payload.length > 1) {
        // Scope data
        return (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', fontSize: '12px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
            {payload.map(p => (
              <p key={p.dataKey} style={{ margin: '2px 0' }}>
                {`${p.name}: ${p.value.toFixed(2)} t`}
              </p>
            ))}
          </div>
        );
      } else if (payload.length === 1 && payload[0].payload.activities) {
        // Daily activities - show all activities for that day
        const data = payload[0].payload;
        return (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px', fontSize: '12px', maxWidth: '300px' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{`Date: ${label}`}</p>
            <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{`Total Emissions: ${payload[0].value.toFixed(2)} t CO2e`}</p>
            <div style={{ marginTop: '8px', borderTop: '1px solid #e5e7eb', paddingTop: '4px' }}>
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold' }}>Activities:</p>
              {data.activities.map((activity, index) => (
                <p key={index} style={{ margin: '2px 0', fontSize: '11px' }}>
                  • {activity.activity_name || `${activity.activity_type} - ${activity.quantity} ${activity.unit}`}
                  <br />
                  <span style={{ color: '#6b7280' }}>
                    {activity.emissions_kgco2e?.toFixed(2) || '0.00'} kg CO2e
                  </span>
                </p>
              ))}
            </div>
          </div>
        );
      }
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          label={{ value: 'tonnes CO2e', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Brush dataKey="date" height={30} stroke="#667eea" />
        {isDailyActivities ? (
          <Line
            type="monotone"
            dataKey="emissions"
            stroke="#667eea"
            strokeWidth={2}
            dot={{ fill: '#667eea', r: 4 }}
            activeDot={{ r: 6 }}
            name="Emissions"
          />
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="scope1"
              stroke="#ef4444"
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 3 }}
              activeDot={{ r: 5 }}
              name="Scope 1"
            />
            <Line
              type="monotone"
              dataKey="scope2"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b', r: 3 }}
              activeDot={{ r: 5 }}
              name="Scope 2"
            />
            <Line
              type="monotone"
              dataKey="scope3"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 3 }}
              activeDot={{ r: 5 }}
              name="Scope 3"
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#667eea"
              strokeWidth={3}
              dot={{ fill: '#667eea', r: 4 }}
              activeDot={{ r: 6 }}
              name="Total"
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Helper function to process activities or timeline data
function processActivitiesForChart(data, period = 'month') {
  if (!data || data.length === 0) {
    return [
      { date: 'No data', emissions: 0 }
    ];
  }

  // Check if this is timeline data (has 'period' and 'total' fields)
  if (data[0] && 'period' in data[0] && 'total' in data[0]) {
    // Process timeline data
    let processedData = data.map(item => {
      const date = new Date(item.period + '-01');
      return {
        date: date,
        scope1: (item.scope_1 || 0) / 1000, // Convert to tonnes
        scope2: (item.scope_2 || 0) / 1000,
        scope3: (item.scope_3 || 0) / 1000,
        total: (item.total || 0) / 1000
      };
    }).sort((a, b) => a.date - b.date);

    // Group data based on selected period
    const groupedData = {};
    processedData.forEach(item => {
      let groupKey;
      let displayDate;

      if (period === 'day') {
        // For daily, show monthly data (since backend only provides monthly)
        displayDate = item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        groupKey = item.date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'month') {
        displayDate = item.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        groupKey = item.date.getFullYear() + '-' + String(item.date.getMonth() + 1).padStart(2, '0'); // YYYY-MM
      } else if (period === 'year') {
        displayDate = item.date.getFullYear().toString();
        groupKey = item.date.getFullYear().toString(); // YYYY
      }

      if (!groupedData[groupKey]) {
        groupedData[groupKey] = {
          date: displayDate,
          sortDate: item.date,
          scope1: 0,
          scope2: 0,
          scope3: 0,
          total: 0
        };
      }

      groupedData[groupKey].scope1 += item.scope1;
      groupedData[groupKey].scope2 += item.scope2;
      groupedData[groupKey].scope3 += item.scope3;
      groupedData[groupKey].total += item.total;
    });

    const chartData = Object.values(groupedData).sort((a, b) => a.sortDate - b.sortDate);

    return chartData.length > 0 ? chartData : [{ date: 'No data', emissions: 0 }];
  }

  // Process individual activities data
  const dateMap = {};

  data.forEach(activity => {
    const date = new Date(activity.activity_date);
    let dateKey;
    let displayDate;

    if (period === 'day') {
      displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dateKey = date.toISOString().split('T')[0];
    } else if (period === 'month') {
      displayDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      dateKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    } else if (period === 'year') {
      displayDate = date.getFullYear().toString();
      dateKey = date.getFullYear().toString();
    }

    if (!dateMap[dateKey]) {
      dateMap[dateKey] = {
        date: displayDate,
        sortDate: date,
        emissions: 0,
        activities: []
      };
    }

    dateMap[dateKey].emissions += (activity.emissions_kgco2e || 0) / 1000; // Convert to tonnes
    dateMap[dateKey].activities.push(activity);
  });

  // Convert to array and sort by date
  const chartData = Object.values(dateMap)
    .sort((a, b) => a.sortDate - b.sortDate)
    .map(item => ({
      date: item.date,
      emissions: parseFloat(item.emissions.toFixed(2)),
      activities: item.activities
    }))
    .slice(-10); // Last 10 data points

  return chartData.length > 0 ? chartData : [{ date: 'No data', emissions: 0 }];
}

export default EmissionLineChart;