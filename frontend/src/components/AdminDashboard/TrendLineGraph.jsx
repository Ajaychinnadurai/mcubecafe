import { useState, useMemo } from 'react';

/**
 * Helper to construct cubic Bezier curve path string from array of [x, y] points
 */
function getSmoothBezierPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];

    // Control point offsets
    const cp1x = current.x + (next.x - current.x) * 0.4;
    const cp1y = current.y;
    const cp2x = current.x + (next.x - current.x) * 0.6;
    const cp2y = next.y;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  return d;
}

export default function TrendLineGraph({
  data = [],
  metric = 'revenue', // 'revenue' | 'orders'
  height = 240,
  strokeColor = '#fdf43b',
}) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute scale and SVG points
  const { points, maxValue, minValue, yTicks, xLabels, totalVal, avgVal, peakVal, peakDate } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], maxValue: 100, minValue: 0, yTicks: [0, 25, 50, 75, 100], xLabels: [], totalVal: 0, avgVal: 0, peakVal: 0, peakDate: '' };
    }

    const values = data.map(d => Number(d[metric] || 0));
    const rawMax = Math.max(...values, 10);
    const rawMin = 0;
    
    // Round max to nice upper bound
    const padding = rawMax * 0.15;
    const maxValue = Math.ceil(rawMax + padding);
    const minValue = 0;

    const width = 800;
    const svgHeight = height;
    const margin = { top: 25, right: 30, bottom: 35, left: 55 };

    const graphWidth = width - margin.left - margin.right;
    const graphHeight = svgHeight - margin.top - margin.bottom;

    let maxV = 0;
    let pDate = '';
    let total = 0;

    const points = data.map((item, index) => {
      const val = Number(item[metric] || 0);
      total += val;

      if (val >= maxV) {
        maxV = val;
        pDate = item.full_date || item.date;
      }

      const x = margin.left + (index / (data.length - 1 || 1)) * graphWidth;
      const y = margin.top + graphHeight - ((val - minValue) / (maxValue - minValue || 1)) * graphHeight;

      return {
        x,
        y,
        value: val,
        date: item.date,
        fullDate: item.full_date || item.date,
        raw: item,
        index,
      };
    });

    // Generate 4 Y-axis tick values
    const ticksCount = 4;
    const yTicks = Array.from({ length: ticksCount + 1 }, (_, i) => {
      const v = minValue + (i / ticksCount) * (maxValue - minValue);
      const y = margin.top + graphHeight - (i / ticksCount) * graphHeight;
      return { value: Math.round(v), y };
    });

    // Filter x labels to prevent crowding
    const step = Math.max(1, Math.floor(data.length / 8));
    const xLabels = points.filter((_, idx) => idx % step === 0 || idx === points.length - 1);

    const avg = total / (data.length || 1);

    return {
      points,
      maxValue,
      minValue,
      yTicks,
      xLabels,
      totalVal: total,
      avgVal: avg,
      peakVal: maxV,
      peakDate: pDate,
      margin,
      graphWidth,
      graphHeight,
      width,
    };
  }, [data, metric, height]);

  if (!data || data.length === 0) {
    return (
      <div className="trend-graph-empty">
        <p>No trend data available for selected period.</p>
      </div>
    );
  }

  const svgWidth = 800;
  const margin = { top: 25, right: 30, bottom: 35, left: 55 };
  const graphHeight = height - margin.top - margin.bottom;

  // Path strings
  const linePath = getSmoothBezierPath(points);
  const firstP = points[0];
  const lastP = points[points.length - 1];
  const areaPath = points.length > 0 
    ? `${linePath} L ${lastP.x} ${margin.top + graphHeight} L ${firstP.x} ${margin.top + graphHeight} Z`
    : '';

  const formatVal = (v) => {
    if (metric === 'revenue') {
      return `₹${v.toLocaleString('en-IN')}`;
    }
    return `${v} Order${v === 1 ? '' : 's'}`;
  };

  return (
    <div className="trend-line-graph-wrapper">
      {/* Graph Metrics Quick Summary */}
      <div className="trend-summary-row">
        <div className="trend-stat-chip">
          <span className="chip-label">Total {metric === 'revenue' ? 'Revenue' : 'Orders'}</span>
          <span className="chip-value">{formatVal(totalVal)}</span>
        </div>
        <div className="trend-stat-chip">
          <span className="chip-label">Daily Average</span>
          <span className="chip-value">{formatVal(Math.round(avgVal))}</span>
        </div>
        <div className="trend-stat-chip highlight">
          <span className="chip-label">Peak Performance</span>
          <span className="chip-value">{formatVal(peakVal)} <small style={{ fontWeight: 400, opacity: 0.85 }}>({peakDate})</small></span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="trend-svg-container">
        <svg viewBox={`0 0 ${svgWidth} ${height}`} className="trend-svg">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Gridlines */}
          {yTicks.map((tick, idx) => (
            <g key={idx} className="grid-group">
              <line
                x1={margin.left}
                y1={tick.y}
                x2={svgWidth - margin.right}
                y2={tick.y}
                className="grid-line"
              />
              <text x={margin.left - 10} y={tick.y + 4} className="y-axis-label">
                {metric === 'revenue' ? `₹${tick.value}` : tick.value}
              </text>
            </g>
          ))}

          {/* Area Fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#trendGradient)" />
          )}

          {/* Bezier Trend Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
          )}

          {/* X Axis Labels & Ticks */}
          {points.map((pt, idx) => (
            <g key={idx} className="x-tick-group">
              {(idx % Math.max(1, Math.floor(points.length / 8)) === 0 || idx === points.length - 1) && (
                <>
                  <line
                    x1={pt.x}
                    y1={height - margin.bottom}
                    x2={pt.x}
                    y2={height - margin.bottom + 5}
                    stroke="rgba(255,255,255,0.2)"
                  />
                  <text x={pt.x} y={height - margin.bottom + 20} className="x-axis-label">
                    {pt.date}
                  </text>
                </>
              )}
            </g>
          ))}

          {/* Data Nodes & Hover Event Handlers */}
          {points.map((pt) => {
            const isHovered = hoveredPoint?.index === pt.index;
            return (
              <g
                key={pt.index}
                className={`node-group ${isHovered ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Hit area extension */}
                <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                {/* Visible node circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? '6' : '4'}
                  fill={isHovered ? '#ffffff' : strokeColor}
                  stroke={strokeColor}
                  strokeWidth="2"
                  className="trend-node-circle"
                />

                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="10"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="1.5"
                    opacity="0.6"
                    className="pulse-ring"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="trend-tooltip"
            style={{
              left: `${(hoveredPoint.x / svgWidth) * 100}%`,
              top: `${Math.max(10, (hoveredPoint.y / height) * 100 - 15)}%`,
            }}
          >
            <div className="tooltip-date">{hoveredPoint.fullDate}</div>
            <div className="tooltip-value">{formatVal(hoveredPoint.value)}</div>
            <div className="tooltip-sub">
              {metric === 'revenue' 
                ? `${hoveredPoint.raw.orders || 0} Orders Placed`
                : `₹${(hoveredPoint.raw.revenue || 0).toLocaleString('en-IN')} Total Revenue`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
