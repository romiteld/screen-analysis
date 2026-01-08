import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  chartContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  timeline: {
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  timelineSegment: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#3B82F6',
    opacity: 0.7,
  },
  timelineLabel: {
    position: 'absolute',
    top: 20,
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  timeAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  timeLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
});

interface TimelineChartProps {
  timestamps: number[];
  totalDuration?: number;
}

const TimelineChart: React.FC<TimelineChartProps> = ({ timestamps, totalDuration }) => {
  const maxTime = totalDuration || Math.max(...timestamps, 1);
  
  // Group timestamps into segments
  const segments: { start: number; end: number; count: number }[] = [];
  timestamps.forEach((timestamp, index) => {
    const nextTimestamp = timestamps[index + 1] || maxTime;
    segments.push({
      start: timestamp,
      end: nextTimestamp,
      count: index + 1,
    });
  });

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>Analysis Timeline</Text>
      <View style={styles.timeline}>
        {segments.map((segment, index) => (
          <View
            key={index}
            style={[
              styles.timelineSegment,
              {
                left: `${(segment.start / maxTime) * 100}%`,
                width: `${((segment.end - segment.start) / maxTime) * 100}%`,
              },
            ]}
          >
            <Text style={[
              styles.timelineLabel,
              { left: '50%', transform: 'translateX(-50%)' }
            ]}>
              {segment.count}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.timeAxis}>
        <Text style={styles.timeLabel}>0:00</Text>
        <Text style={styles.timeLabel}>
          {Math.floor(maxTime / 60)}:{(Math.floor(maxTime) % 60).toString().padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
};

export default TimelineChart;