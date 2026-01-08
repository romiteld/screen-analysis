import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import Logo from './Logo';
import TimelineChart from './TimelineChart';

// Register fonts if needed
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2'
// });

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563EB',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
    marginTop: 15,
  },
  text: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  stepContainer: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 8,
    borderLeft: '4px solid #3B82F6',
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  stepTimestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  stepDescription: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.5,
  },
  recommendationItem: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  recommendationBullet: {
    width: 20,
    fontSize: 12,
    color: '#3B82F6',
  },
  recommendationText: {
    flex: 1,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 1.5,
  },
  summaryBox: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 12,
    color: '#3730A3',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  chart: {
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    marginBottom: 10,
  },
});

interface WorkflowStep {
  timestamp: number;
  title: string;
  description: string;
  duration?: number;
}

interface AnalysisData {
  id: string;
  video_filename: string;
  created_at: string;
  analysis: string;
  metadata: {
    frames_analyzed: number;
    timestamps: number[];
    model: string;
    analysis_date: string;
  };
  workflow_summary: {
    total_steps: number;
    has_errors: boolean;
    tools_mentioned: string[];
    key_sections: string[];
  };
  extracted_steps?: WorkflowStep[];
  recommendations?: string[];
}

interface PDFReportProps {
  analysisData: AnalysisData;
  companyName?: string;
  logoUrl?: string;
}

const PDFReport: React.FC<PDFReportProps> = ({ 
  analysisData, 
  companyName = 'Workflow Analyzer Pro',
  logoUrl 
}) => {
  const extractStepsFromAnalysis = (analysisText: string): WorkflowStep[] => {
    // Parse the analysis text to extract structured steps
    const steps: WorkflowStep[] = [];
    const lines = analysisText.split('\n');
    let currentStep: Partial<WorkflowStep> | null = null;

    for (const line of lines) {
      // Look for step patterns
      if (line.match(/^(Step\s+\d+|^\d+\.|\[.*\])/i)) {
        if (currentStep && currentStep.title) {
          steps.push(currentStep as WorkflowStep);
        }
        currentStep = {
          title: line.trim(),
          description: '',
          timestamp: analysisData.metadata.timestamps[steps.length] || steps.length * 5,
        };
      } else if (currentStep && line.trim()) {
        currentStep.description = (currentStep.description || '') + line.trim() + ' ';
      }
    }

    if (currentStep && currentStep.title) {
      steps.push(currentStep as WorkflowStep);
    }

    return steps;
  };

  const extractRecommendations = (analysisText: string): string[] => {
    // Extract recommendations from the analysis
    const recommendations: string[] = [];
    const lines = analysisText.split('\n');
    let inRecommendations = false;
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('suggest')) {
        inRecommendations = true;
      } else if (inRecommendations && line.trim() && !line.match(/^#/)) {
        if (line.trim().length > 20) {
          recommendations.push(line.trim());
        }
      }
    });
    
    // If no recommendations found, generate some based on the analysis
    if (recommendations.length === 0) {
      if (analysisData.workflow_summary.has_errors) {
        recommendations.push('Review and address the identified errors in the workflow');
      }
      if (analysisData.workflow_summary.total_steps > 10) {
        recommendations.push('Consider breaking down complex workflows into smaller, manageable sections');
      }
      recommendations.push('Document each step clearly for better team understanding');
      recommendations.push('Implement regular reviews to optimize the workflow efficiency');
    }
    
    return recommendations;
  };

  const steps = analysisData.extracted_steps || extractStepsFromAnalysis(analysisData.analysis);
  const recommendations = analysisData.recommendations || extractRecommendations(analysisData.analysis);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {logoUrl ? (
            /* eslint-disable-next-line jsx-a11y/alt-text */
            <Image style={styles.logo} src={logoUrl} />
          ) : (
            <Logo companyName={companyName} />
          )}
          <Text style={styles.title}>Workflow Analysis Report</Text>
          <Text style={styles.subtitle}>Video: {analysisData.video_filename}</Text>
          <Text style={styles.subtitle}>
            Generated on: {format(new Date(analysisData.created_at), 'MMMM dd, yyyy')}
          </Text>
          <Text style={styles.subtitle}>
            Analysis ID: {analysisData.id}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>Key Findings</Text>
            <Text style={styles.summaryText}>
              • Total Steps Identified: {analysisData.workflow_summary.total_steps}
            </Text>
            <Text style={styles.summaryText}>
              • Frames Analyzed: {analysisData.metadata.frames_analyzed}
            </Text>
            <Text style={styles.summaryText}>
              • Analysis Model: {analysisData.metadata.model}
            </Text>
            {analysisData.workflow_summary.has_errors && (
              <Text style={[styles.summaryText, { color: '#DC2626' }]}>
                • Issues Detected: Yes - Review required
              </Text>
            )}
          </View>
        </View>

        {/* Timeline Visualization */}
        {analysisData.metadata.timestamps.length > 0 && (
          <View style={styles.section}>
            <TimelineChart timestamps={analysisData.metadata.timestamps} />
          </View>
        )}

        {/* Workflow Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detailed Workflow Analysis</Text>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepContainer}>
              <View style={styles.stepHeader}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepTimestamp}>
                  Timestamp: {step.timestamp.toFixed(2)}s
                </Text>
              </View>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          ))}
        </View>

        {/* Recommendations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendationItem}>
              <Text style={styles.recommendationBullet}>•</Text>
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {companyName} - Confidential Report
          </Text>
          <Text style={styles.footerText}>
            Page 1 of 1
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFReport;