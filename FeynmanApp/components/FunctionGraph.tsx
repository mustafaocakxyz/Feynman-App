import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Path, Circle, Text as SvgText, Marker, Polyline, Defs } from 'react-native-svg';
import { useTheme } from '@/contexts/theme-context';
import { Colors } from '@/constants/theme';

export type FunctionDef = {
  formula: string; // e.g., "x^2 + 1", "sin(x)", "1/x"
  color?: string;
  lineWidth?: number;
};

export type HighlightPoint = {
  x: number;
  y: number;
  color?: string;
  radius?: number;
  label?: string;
};

export type ApproachConfig = {
  x?: number; // Value being approached on x-axis
  y?: number; // Value being approached on y-axis
  direction?: 'left' | 'right' | 'both' | 'up' | 'down' | 'both-vertical'; // Direction of approach
  showArrows?: boolean; // Show arrows on axes
  highlightSegment?: boolean; // Highlight the approaching segment of the graph
  highlightColor?: string;
  arrowColor?: string;
  label?: string; // Label like "x → 1" or "y → 2"
};

export type GraphConfig = {
  functions: FunctionDef[];
  xDomain: [number, number]; // e.g., [-5, 5]
  yDomain: [number, number]; // e.g., [-3, 10]
  showGrid?: boolean;
  showAxes?: boolean;
  width?: number;
  height?: number;
  padding?: number;
  highlightPoints?: HighlightPoint[];
  approach?: ApproachConfig;
};

// Simple function evaluator for basic mathematical expressions
function evaluateFunction(formula: string, x: number): number | null {
  try {
    // Handle common functions
    let expr = formula
      .replace(/\s+/g, '') // Remove spaces
      .replace(/x/g, `(${x})`) // Replace x with the value in parentheses
      .replace(/\^/g, '**'); // Replace ^ with ** for exponentiation

    // Evaluate using Function constructor (safe for our use case)
    // Wrap in try-catch for invalid expressions
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${expr}`)();
    
    // Check if result is valid (not NaN or Infinity)
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    }
    return null;
  } catch (error) {
    // Silently fail for invalid expressions or out-of-domain values
    return null;
  }
}

// Generate points for a function within a domain
function generateFunctionPoints(
  formula: string,
  xDomain: [number, number],
  yDomain: [number, number],
  samples: number = 200,
): Array<{ x: number; y: number }> {
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;
  const points: Array<{ x: number; y: number }> = [];
  const step = (xMax - xMin) / samples;

  for (let i = 0; i <= samples; i++) {
    const x = xMin + i * step;
    const y = evaluateFunction(formula, x);

    // Only include points within the y domain
    if (y !== null && y >= yMin && y <= yMax) {
      points.push({ x, y });
    }
  }

  return points;
}

// Convert math coordinates to SVG coordinates
function mathToSvg(
  x: number,
  y: number,
  mathXDomain: [number, number],
  mathYDomain: [number, number],
  svgWidth: number,
  svgHeight: number,
  padding: number,
): { x: number; y: number } {
  const [xMin, xMax] = mathXDomain;
  const [yMin, yMax] = mathYDomain;
  const graphWidth = svgWidth - 2 * padding;
  const graphHeight = svgHeight - 2 * padding;

  const svgX = padding + ((x - xMin) / (xMax - xMin)) * graphWidth;
  const svgY = padding + graphHeight - ((y - yMin) / (yMax - yMin)) * graphHeight;

  return { x: svgX, y: svgY };
}

export function FunctionGraph({ config }: { config: GraphConfig }) {
  const { theme } = useTheme();
  const colors = Colors[theme as 'light' | 'dark'];
  const {
    functions,
    xDomain,
    yDomain,
    showGrid = true,
    showAxes = true,
    width = 320,
    height = 200,
    padding = 40,
    highlightPoints = [],
    approach,
  } = config;

  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;
  const [xMin, xMax] = xDomain;
  const [yMin, yMax] = yDomain;

  // Generate grid lines
  const gridLines: Array<{ type: 'vertical' | 'horizontal'; position: number; label: string }> = [];
  
  if (showGrid) {
    // Vertical grid lines (x-axis ticks)
    const xStep = Math.max(1, Math.ceil((xMax - xMin) / 10));
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
      if (Math.abs(x) > 0.01) {
        gridLines.push({ type: 'vertical', position: x, label: x.toString() });
      }
    }
    
    // Horizontal grid lines (y-axis ticks)
    const yStep = Math.max(1, Math.ceil((yMax - yMin) / 10));
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
      if (Math.abs(y) > 0.01) {
        gridLines.push({ type: 'horizontal', position: y, label: y.toString() });
      }
    }
  }

  // Generate function paths
  const functionPaths = functions.map((func) => {
    const points = generateFunctionPoints(func.formula, xDomain, yDomain);
    if (points.length === 0) return null;

    const pathData = points
      .map((point, idx) => {
        const svg = mathToSvg(point.x, point.y, xDomain, yDomain, width, height, padding);
        return `${idx === 0 ? 'M' : 'L'} ${svg.x} ${svg.y}`;
      })
      .join(' ');

    return {
      path: pathData,
      color: func.color || colors.primary,
      lineWidth: func.lineWidth || 2.5,
      formula: func.formula,
      points: points,
    };
  }).filter((path): path is { path: string; color: string; lineWidth: number; formula: string; points: Array<{ x: number; y: number }> } => path !== null);

  // Generate highlighted segments for approaching behavior
  const highlightedSegments: Array<{ path: string; color: string }> = [];
  if (approach?.highlightSegment && approach.x !== undefined && functions.length > 0) {
    const func = functions[0];
    const allPoints = generateFunctionPoints(func.formula, xDomain, yDomain);
    const approachX = approach.x;
    const direction = approach.direction || 'both';
    
    // Filter points based on approach direction
    let segmentPoints: Array<{ x: number; y: number }> = [];
    
    if (direction === 'left' || direction === 'both') {
      // Points approaching from left (x < approachX)
      const leftPoints = allPoints.filter(p => p.x < approachX && p.x >= approachX - (xMax - xMin) * 0.4);
      segmentPoints = [...segmentPoints, ...leftPoints];
    }
    
    if (direction === 'right' || direction === 'both') {
      // Points approaching from right (x > approachX)
      const rightPoints = allPoints.filter(p => p.x > approachX && p.x <= approachX + (xMax - xMin) * 0.4);
      segmentPoints = [...segmentPoints, ...rightPoints];
    }
    
    // Sort by x value
    segmentPoints.sort((a, b) => a.x - b.x);
    
    if (segmentPoints.length > 1) {
      const highlightPath = segmentPoints
        .map((point, idx) => {
          const svg = mathToSvg(point.x, point.y, xDomain, yDomain, width, height, padding);
          return `${idx === 0 ? 'M' : 'L'} ${svg.x} ${svg.y}`;
        })
        .join(' ');
      
      highlightedSegments.push({
        path: highlightPath,
        color: approach.highlightColor || '#f97316',
      });
    }
  }

  // Find origin position for axes
  const originSvg = mathToSvg(0, 0, xDomain, yDomain, width, height, padding);

  return (
    <View style={styles.container}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        {showGrid &&
          gridLines.map((grid, idx) => {
            if (grid.type === 'vertical') {
              const svgPos = mathToSvg(grid.position, 0, xDomain, yDomain, width, height, padding);
              return (
                <React.Fragment key={`v-grid-${idx}`}>
                  <Line
                    x1={svgPos.x}
                    y1={padding}
                    x2={svgPos.x}
                    y2={height - padding}
                    stroke={colors.border}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <SvgText
                    x={svgPos.x}
                    y={height - padding + 20}
                    fill={colors.textSecondary}
                    fontSize="12"
                    textAnchor="middle">
                    {grid.label}
                  </SvgText>
                </React.Fragment>
              );
            } else {
              const svgPos = mathToSvg(0, grid.position, xDomain, yDomain, width, height, padding);
              return (
                <React.Fragment key={`h-grid-${idx}`}>
                  <Line
                    x1={padding}
                    y1={svgPos.y}
                    x2={width - padding}
                    y2={svgPos.y}
                    stroke={colors.border}
                    strokeWidth={1}
                    strokeDasharray="2,2"
                  />
                  <SvgText
                    x={padding - 10}
                    y={svgPos.y + 4}
                    fill={colors.textSecondary}
                    fontSize="12"
                    textAnchor="end">
                    {grid.label}
                  </SvgText>
                </React.Fragment>
              );
            }
          })}

        {/* Axes */}
        {showAxes && (() => {
          // Determine where to draw axes based on whether origin is in view
          const originInXRange = xMin <= 0 && xMax >= 0;
          const originInYRange = yMin <= 0 && yMax >= 0;
          
          // X-axis position: bottom edge if origin not in view, or at y=0 if it is
          const xAxisY = originInYRange 
            ? originSvg.y 
            : height - padding;
          
          // Y-axis position: left edge if origin not in view, or at x=0 if it is
          const yAxisX = originInXRange 
            ? originSvg.x 
            : padding;
          
          return (
            <>
              {/* X-axis */}
              <Line
                x1={padding}
                y1={xAxisY}
                x2={width - padding}
                y2={xAxisY}
                stroke="#374151"
                strokeWidth={2}
              />
              {/* Y-axis */}
              <Line
                x1={yAxisX}
                y1={padding}
                x2={yAxisX}
                y2={height - padding}
                stroke="#374151"
                strokeWidth={2}
              />
              {/* Axis labels */}
              <SvgText
                x={width - padding + 10}
                y={xAxisY - 5}
                fill={colors.text}
                fontSize="14"
                fontWeight="bold">
                x
              </SvgText>
              <SvgText
                x={yAxisX + 5}
                y={padding - 10}
                fill={colors.text}
                fontSize="14"
                fontWeight="bold">
                y
              </SvgText>
            </>
          );
        })()}

        {/* Arrow marker definitions */}
        <Defs>
          <Marker
            id="arrowhead-right"
            markerWidth="15"
            markerHeight="15"
            refX="8"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse">
            <Polyline
              points="0,0 14,4 0,8"
              fill={approach?.arrowColor || '#f97316'}
              stroke={approach?.arrowColor || '#f97316'}
              strokeWidth={0.5}
            />
          </Marker>
          <Marker
            id="arrowhead-left"
            markerWidth="15"
            markerHeight="15"
            refX="0"
            refY="4"
            orient="auto"
            markerUnits="userSpaceOnUse">
            <Polyline
              points="14,0 0,4 14,8"
              fill={approach?.arrowColor || '#f97316'}
              stroke={approach?.arrowColor || '#f97316'}
              strokeWidth={0.5}
            />
          </Marker>
        </Defs>

        {/* Approach arrows on axes */}
        {approach && approach.showArrows && (() => {
          const originInXRange = xMin <= 0 && xMax >= 0;
          const originInYRange = yMin <= 0 && yMax >= 0;
          const xAxisY = originInYRange ? originSvg.y : height - padding;
          const arrows: React.ReactElement[] = [];
          const arrowColor = approach.arrowColor || '#f97316';
          
          // X-axis approach arrow
          if (approach.x !== undefined) {
            const approachXSvg = mathToSvg(
              approach.x,
              originInYRange ? 0 : yMin,
              xDomain,
              yDomain,
              width,
              height,
              padding
            );
            const direction = approach.direction || 'both';
            
            if (direction === 'left' || direction === 'both') {
              // Arrow from left approaching x
              arrows.push(
                <Line
                  key="x-arrow-left"
                  x1={padding}
                  y1={xAxisY}
                  x2={approachXSvg.x - 5}
                  y2={xAxisY}
                  stroke={arrowColor}
                  strokeWidth={3}
                  markerEnd="url(#arrowhead-right)"
                />
              );
            }
            
            if (direction === 'right' || direction === 'both') {
              // Arrow from right approaching x
              // Line goes from right edge to approach point (left direction)
              // We want arrowhead at the end (approach point) pointing left toward x
              // Reverse line direction so arrowhead-left marker aligns correctly
              arrows.push(
                <Line
                  key="x-arrow-right"
                  x1={approachXSvg.x + 5}
                  y1={xAxisY}
                  x2={width - padding}
                  y2={xAxisY}
                  stroke={arrowColor}
                  strokeWidth={3}
                  markerStart="url(#arrowhead-left)"
                />
              );
            }
            
            // Label for approach
            if (approach.label) {
              arrows.push(
                <SvgText
                  key="x-arrow-label"
                  x={approachXSvg.x}
                  y={xAxisY - 10}
                  fill={arrowColor}
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle">
                  {approach.label}
                </SvgText>
              );
            }
          }
          
          return arrows;
        })()}

        {/* Highlighted approaching segments */}
        {highlightedSegments.map((segment, idx) => (
          <Path
            key={`highlight-${idx}`}
            d={segment.path}
            fill="none"
            stroke={segment.color}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        ))}

        {/* Function paths */}
        {functionPaths.map((funcPath, idx) => (
          <Path
            key={`func-${idx}`}
            d={funcPath.path}
            fill="none"
            stroke={funcPath.color}
            strokeWidth={funcPath.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* Highlighted points */}
        {highlightPoints.map((point, idx) => {
          // Check if point is within the visible domain
          if (
            point.x < xMin ||
            point.x > xMax ||
            point.y < yMin ||
            point.y > yMax
          ) {
            return null;
          }

          const svgPos = mathToSvg(point.x, point.y, xDomain, yDomain, width, height, padding);
          const radius = point.radius || 5;
          const color = point.color || '#f97316'; // Default orange

          return (
            <React.Fragment key={`point-${idx}`}>
              <Circle
                cx={svgPos.x}
                cy={svgPos.y}
                r={radius}
                fill={color}
                stroke={colors.background}
                strokeWidth={2}
              />
              {point.label && (
                <SvgText
                  x={svgPos.x + radius + 8}
                  y={svgPos.y + 4}
                  fill={colors.text}
                  fontSize="12"
                  fontWeight="bold">
                  {point.label}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
  },
});
