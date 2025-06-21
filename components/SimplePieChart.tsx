import React from 'react';
import { StyleSheet, View } from 'react-native';
import Colors from '@/constants/colors';

interface AllocationItem {
  category: string;
  percentage: number;
}

interface SimplePieChartProps {
  data: AllocationItem[];
  size?: number;
  holeSize?: number;
}

export default function SimplePieChart({ 
  data, 
  size = 160, 
  holeSize = 80 
}: SimplePieChartProps) {
  // Calculate total for percentage calculations
  const total = data.reduce((sum: number, item: AllocationItem) => sum + item.percentage, 0);
  
  // Calculate cumulative angles for each segment
  let cumulativeAngle = 0;
  const segments = data.map((item: AllocationItem, index: number) => {
    // Calculate angle for this segment
    const angle = (item.percentage / total) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    
    return {
      ...item,
      startAngle,
      angle,
      color: getColorForIndex(index)
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {segments.map((segment, index) => {
        // Skip rendering if percentage is too small
        if (segment.percentage < 1) return null;
        
        return (
          <View 
            key={index}
            style={[
              styles.segment,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: segment.color,
                transform: [
                  { rotate: `${segment.startAngle}deg` }
                ],
              }
            ]}
          >
            <View 
              style={[
                styles.segmentCover,
                {
                  width: size,
                  height: size,
                  transform: [
                    { rotate: `${segment.angle}deg` }
                  ],
                }
              ]}
            />
          </View>
        );
      })}
      
      {/* Center hole */}
      <View 
        style={[
          styles.hole, 
          { 
            width: holeSize, 
            height: holeSize, 
            borderRadius: holeSize / 2 
          }
        ]} 
      />
    </View>
  );
}

// Helper function to get color for allocation segment
export function getColorForIndex(index: number): string {
  const colors = [
    Colors.primary,
    Colors.secondary,
    '#FFB946',
    '#885AF8',
    '#FF5C5C',
    '#6B7280',
  ];
  return colors[index % colors.length];
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segment: {
    position: 'absolute',
    overflow: 'hidden',
  },
  segmentCover: {
    position: 'absolute',
    backgroundColor: Colors.card,
  },
  hole: {
    backgroundColor: Colors.card,
    position: 'absolute',
    zIndex: 10,
  },
});