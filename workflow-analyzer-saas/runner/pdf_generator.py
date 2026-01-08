#!/usr/bin/env python3
"""
PDF Report Generator for Workflow Analysis
Converts JSON analysis results to professional PDF reports
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas

logger = logging.getLogger(__name__)


class WorkflowPDFGenerator:
    """Generates professional PDF reports from workflow analysis results."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._create_custom_styles()
        
    def _create_custom_styles(self):
        """Create custom paragraph styles for the report."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1F2937'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))
        
        # Section header style
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#2563EB'),
            spaceAfter=12,
            spaceBefore=20
        ))
        
        # Subsection header style
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#374151'),
            spaceAfter=8,
            spaceBefore=12
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='CustomBodyText',
            parent=self.styles['BodyText'],
            fontSize=11,
            textColor=colors.HexColor('#4B5563'),
            alignment=TA_JUSTIFY,
            spaceAfter=8
        ))
        
        # Highlight box style
        self.styles.add(ParagraphStyle(
            name='HighlightBox',
            parent=self.styles['BodyText'],
            fontSize=11,
            textColor=colors.HexColor('#1E40AF'),
            backColor=colors.HexColor('#EFF6FF'),
            borderColor=colors.HexColor('#3B82F6'),
            borderWidth=1,
            borderPadding=10,
            spaceAfter=12
        ))
    
    def generate_report(self, 
                       analysis_data: Dict[str, Any], 
                       output_path: Path,
                       video_filename: str = "Video Analysis",
                       company_name: str = "Workflow Analyzer Pro") -> Path:
        """Generate a PDF report from analysis data."""
        try:
            # Create document
            doc = SimpleDocTemplate(
                str(output_path),
                pagesize=A4,
                rightMargin=72,
                leftMargin=72,
                topMargin=72,
                bottomMargin=72
            )
            
            # Build story (content)
            story = []
            
            # Add header
            story.extend(self._create_header(video_filename, company_name))
            
            # Add executive summary
            story.extend(self._create_executive_summary(analysis_data))
            
            # Add workflow analysis
            story.extend(self._create_workflow_analysis(analysis_data))
            
            # Add automation recommendations
            story.extend(self._create_automation_recommendations(analysis_data))
            
            # Add patterns and insights
            story.extend(self._create_patterns_section(analysis_data))
            
            # Add next steps
            story.extend(self._create_next_steps(analysis_data))
            
            # Build PDF
            doc.build(story, onFirstPage=self._add_page_number, 
                     onLaterPages=self._add_page_number)
            
            logger.info(f"PDF report generated successfully: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            raise
    
    def _create_header(self, video_filename: str, company_name: str) -> List:
        """Create report header."""
        story = []
        
        # Title
        story.append(Paragraph(
            f"{company_name}<br/>Workflow Analysis Report",
            self.styles['CustomTitle']
        ))
        
        # Metadata
        story.append(Paragraph(
            f"<b>Video:</b> {video_filename}<br/>"
            f"<b>Generated:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}<br/>"
            f"<b>Analysis Model:</b> Google Gemini 2.5 Flash",
            self.styles['Normal']
        ))
        
        story.append(Spacer(1, 0.5 * inch))
        
        return story
    
    def _create_executive_summary(self, analysis_data: Dict[str, Any]) -> List:
        """Create executive summary section."""
        story = []
        
        story.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
        
        # Extract key metrics
        segments = analysis_data.get('segments', [])
        total_duration = sum(s.get('duration', 0) for s in segments)
        num_segments = len(segments)
        
        # Count actions and patterns
        total_actions = 0
        patterns = {}
        for segment in segments:
            result = segment.get('result', {})
            actions = result.get('chronological_actions', [])
            total_actions += len(actions)
            
            # Count patterns
            segment_patterns = result.get('patterns', {})
            for pattern, details in segment_patterns.items():
                if pattern not in patterns:
                    patterns[pattern] = 0
                patterns[pattern] += details.get('frequency', 1)
        
        # Create summary data
        summary_data = [
            ['Metric', 'Value'],
            ['Total Video Duration', f"{total_duration:.1f} minutes"],
            ['Segments Analyzed', str(num_segments)],
            ['Total Actions Identified', str(total_actions)],
            ['Unique Patterns Found', str(len(patterns))],
            ['Automation Opportunities', str(self._count_automation_opportunities(analysis_data))],
        ]
        
        # Create table
        table = Table(summary_data, colWidths=[3*inch, 2*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563EB')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F9FAFB')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E5E7EB')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ]))
        
        story.append(table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Key insights
        if patterns:
            story.append(Paragraph("Key Insights", self.styles['SubsectionHeader']))
            
            top_patterns = sorted(patterns.items(), key=lambda x: x[1], reverse=True)[:3]
            for pattern, count in top_patterns:
                story.append(Paragraph(
                    f"• <b>{pattern}:</b> Occurred {count} times",
                    self.styles['CustomBodyText']
                ))
        
        story.append(Spacer(1, 0.5 * inch))
        
        return story
    
    def _create_workflow_analysis(self, analysis_data: Dict[str, Any]) -> List:
        """Create detailed workflow analysis section."""
        story = []
        
        story.append(Paragraph("Detailed Workflow Analysis", self.styles['SectionHeader']))
        
        segments = analysis_data.get('segments', [])
        
        for i, segment in enumerate(segments):
            result = segment.get('result', {})
            
            # Segment header
            story.append(Paragraph(
                f"Segment {i+1}: {segment.get('start', 0)}-{segment.get('end', 0)} seconds",
                self.styles['SubsectionHeader']
            ))
            
            # Active windows/apps
            active_windows = result.get('active_windows_apps', [])
            if active_windows:
                story.append(Paragraph("<b>Active Applications:</b>", self.styles['Normal']))
                for window in active_windows[:3]:  # Limit to top 3
                    story.append(Paragraph(
                        f"• {window}",
                        self.styles['CustomBodyText']
                    ))
            
            # Key actions
            actions = result.get('chronological_actions', [])
            if actions:
                story.append(Paragraph("<b>Key Actions:</b>", self.styles['Normal']))
                for action in actions[:5]:  # Limit to top 5
                    action_text = action
                    if isinstance(action, dict):
                        action_text = action.get('description', str(action))
                    story.append(Paragraph(
                        f"• {action_text}",
                        self.styles['CustomBodyText']
                    ))
            
            story.append(Spacer(1, 0.2 * inch))
        
        return story
    
    def _create_automation_recommendations(self, analysis_data: Dict[str, Any]) -> List:
        """Create automation recommendations section."""
        story = []
        
        story.append(Paragraph("Automation Recommendations", self.styles['SectionHeader']))
        
        # Collect all automation ideas
        all_automations = []
        
        for segment in analysis_data.get('segments', []):
            result = segment.get('result', {})
            automations = result.get('automation_ideas', [])
            
            for automation in automations:
                if isinstance(automation, dict):
                    all_automations.append(automation)
                else:
                    # Handle string format
                    all_automations.append({
                        'task': automation,
                        'complexity': 'Medium',
                        'tool': 'Custom',
                        'impact': 'Medium'
                    })
        
        # Group by complexity
        quick_wins = [a for a in all_automations if a.get('complexity', '').lower() == 'quick win']
        medium = [a for a in all_automations if a.get('complexity', '').lower() == 'medium']
        complex = [a for a in all_automations if a.get('complexity', '').lower() == 'complex']
        
        # Quick Wins
        if quick_wins:
            story.append(Paragraph("Quick Wins (Implement in 1-2 weeks)", self.styles['SubsectionHeader']))
            for automation in quick_wins[:3]:
                story.append(Paragraph(
                    f"• <b>{automation.get('task', 'Unknown')}:</b> "
                    f"Use {automation.get('tool', 'TBD')} - "
                    f"{automation.get('impact', 'Efficiency gain')}",
                    self.styles['CustomBodyText']
                ))
        
        # Medium Complexity
        if medium:
            story.append(Paragraph("Medium Complexity (1-2 months)", self.styles['SubsectionHeader']))
            for automation in medium[:3]:
                story.append(Paragraph(
                    f"• <b>{automation.get('task', 'Unknown')}:</b> "
                    f"Use {automation.get('tool', 'TBD')} - "
                    f"{automation.get('impact', 'Process improvement')}",
                    self.styles['CustomBodyText']
                ))
        
        # Complex
        if complex:
            story.append(Paragraph("Complex Initiatives (3+ months)", self.styles['SubsectionHeader']))
            for automation in complex[:2]:
                story.append(Paragraph(
                    f"• <b>{automation.get('task', 'Unknown')}:</b> "
                    f"Use {automation.get('tool', 'TBD')} - "
                    f"{automation.get('impact', 'Strategic transformation')}",
                    self.styles['CustomBodyText']
                ))
        
        story.append(Spacer(1, 0.5 * inch))
        
        return story
    
    def _create_patterns_section(self, analysis_data: Dict[str, Any]) -> List:
        """Create patterns and insights section."""
        story = []
        
        story.append(Paragraph("Workflow Patterns & Insights", self.styles['SectionHeader']))
        
        # Collect all patterns
        all_patterns = {}
        
        for segment in analysis_data.get('segments', []):
            result = segment.get('result', {})
            patterns = result.get('patterns', {})
            
            for pattern_type, details in patterns.items():
                if pattern_type not in all_patterns:
                    all_patterns[pattern_type] = []
                all_patterns[pattern_type].append(details)
        
        # Display patterns
        for pattern_type, occurrences in all_patterns.items():
            if occurrences:
                story.append(Paragraph(f"<b>{pattern_type}:</b>", self.styles['Normal']))
                
                # Aggregate frequency
                total_frequency = sum(o.get('frequency', 1) for o in occurrences)
                
                # Get unique examples
                examples = []
                for occ in occurrences:
                    if 'example' in occ:
                        examples.append(occ['example'])
                
                story.append(Paragraph(
                    f"Frequency: {total_frequency} occurrences",
                    self.styles['CustomBodyText']
                ))
                
                if examples:
                    story.append(Paragraph(
                        f"Examples: {', '.join(examples[:3])}",
                        self.styles['CustomBodyText']
                    ))
                
                story.append(Spacer(1, 0.1 * inch))
        
        return story
    
    def _create_next_steps(self, analysis_data: Dict[str, Any]) -> List:
        """Create next steps section."""
        story = []
        
        story.append(Paragraph("Recommended Next Steps", self.styles['SectionHeader']))
        
        next_steps = [
            "1. Review and prioritize the Quick Win automation opportunities",
            "2. Schedule a workflow optimization workshop with your team",
            "3. Create detailed documentation for the most repetitive tasks",
            "4. Evaluate automation tools that match your identified needs",
            "5. Set up metrics to track time saved after implementing automations"
        ]
        
        for step in next_steps:
            story.append(Paragraph(step, self.styles['CustomBodyText']))
        
        # Add a highlight box
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph(
            "<b>Ready to implement these automations?</b><br/>"
            "Contact our automation experts for personalized guidance and support.",
            self.styles['HighlightBox']
        ))
        
        return story
    
    def _count_automation_opportunities(self, analysis_data: Dict[str, Any]) -> int:
        """Count total automation opportunities."""
        count = 0
        for segment in analysis_data.get('segments', []):
            result = segment.get('result', {})
            automations = result.get('automation_ideas', [])
            count += len(automations)
        return count
    
    def _add_page_number(self, canvas, doc):
        """Add page numbers to the document."""
        canvas.saveState()
        canvas.setFont('Helvetica', 9)
        canvas.setFillColor(colors.HexColor('#9CA3AF'))
        
        # Add page number
        page_num = canvas.getPageNumber()
        text = f"Page {page_num}"
        canvas.drawRightString(doc.width + doc.rightMargin, 0.5 * inch, text)
        
        # Add footer
        canvas.drawString(doc.leftMargin, 0.5 * inch, 
                         "Workflow Analyzer Pro - Confidential Report")
        
        canvas.restoreState()


def generate_pdf_from_json(json_path: Path, output_path: Path, 
                          video_filename: str = "Video Analysis") -> Path:
    """Convenience function to generate PDF from JSON file."""
    with open(json_path, 'r') as f:
        analysis_data = json.load(f)
    
    generator = WorkflowPDFGenerator()
    return generator.generate_report(analysis_data, output_path, video_filename)


if __name__ == "__main__":
    # Test the generator
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python pdf_generator.py <input.json> <output.pdf>")
        sys.exit(1)
    
    input_file = Path(sys.argv[1])
    output_file = Path(sys.argv[2])
    
    if not input_file.exists():
        print(f"Error: Input file {input_file} not found")
        sys.exit(1)
    
    try:
        generate_pdf_from_json(input_file, output_file)
        print(f"PDF generated successfully: {output_file}")
    except Exception as e:
        print(f"Error generating PDF: {str(e)}")
        sys.exit(1)