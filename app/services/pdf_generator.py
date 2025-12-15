# app/services/pdf_generator.py
"""
Professional PDF Generation Service
Creates beautiful, branded PDF reports with charts and tables
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from io import BytesIO
import matplotlib

matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path


class PDFReportGenerator:
    """
    Generate professional PDF reports with branding and visualizations
    """

    def __init__(self, branding: Optional[Dict] = None):
        self.branding = branding or self._get_default_branding()
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _get_default_branding(self) -> Dict:
        """Default branding settings"""
        return {
            'primary_color': '#667eea',
            'secondary_color': '#764ba2',
            'accent_color': '#10b981',
            'text_color': '#1f2937',
            'light_gray': '#f3f4f6',
            'company_name': 'Carbon Accounting Platform',
            'logo_url': None,
            'font_family': 'Helvetica'
        }

    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Helper function to safely add styles
        def safe_add_style(name, style_obj):
            if name not in self.styles.byName:
                self.styles.add(style_obj)
        
        # Cover page title
        safe_add_style('CoverTitle', ParagraphStyle(
            name='CoverTitle',
            parent=self.styles['Heading1'],
            fontSize=36,
            textColor=colors.HexColor(self.branding['primary_color']),
            spaceAfter=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        ))

        # Cover subtitle
        safe_add_style('CoverSubtitle', ParagraphStyle(
            name='CoverSubtitle',
            parent=self.styles['Normal'],
            fontSize=18,
            textColor=colors.HexColor(self.branding['text_color']),
            spaceAfter=30,
            alignment=TA_CENTER
        ))

        # Section header
        safe_add_style('SectionHeader', ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor(self.branding['primary_color']),
            spaceAfter=12,
            spaceBefore=20,
            fontName='Helvetica-Bold',
            borderPadding=10,
            borderColor=colors.HexColor(self.branding['primary_color']),
            borderWidth=2,
            borderRadius=5
        ))

        # Subsection header
        safe_add_style('SubsectionHeader', ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor(self.branding['text_color']),
            spaceAfter=8,
            spaceBefore=12,
            fontName='Helvetica-Bold'
        ))

        # Body text (only add if it doesn't exist)
        if 'BodyText' not in self.styles.byName:
            self.styles.add(ParagraphStyle(
                name='BodyText',
                parent=self.styles['Normal'],
                fontSize=11,
                textColor=colors.HexColor(self.branding['text_color']),
                spaceAfter=6,
                alignment=TA_JUSTIFY,
                leading=14
            ))
        else:
            # Update existing style
            body_style = self.styles['BodyText']
            body_style.fontSize = 11
            body_style.textColor = colors.HexColor(self.branding['text_color'])
            body_style.spaceAfter = 6
            body_style.alignment = TA_JUSTIFY
            body_style.leading = 14

        # Highlight box
        safe_add_style('HighlightBox', ParagraphStyle(
            name='HighlightBox',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor(self.branding['text_color']),
            backColor=colors.HexColor(self.branding['light_gray']),
            borderPadding=10,
            spaceAfter=12,
            alignment=TA_LEFT
        ))

    def generate_report_pdf(
            self,
            report_data: Dict,
            output_path: str
    ) -> str:
        """
        Generate complete PDF report

        Args:
            report_data: Complete report data structure
            output_path: Where to save the PDF

        Returns:
            Path to generated PDF
        """
        # Create PDF document
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch
        )

        # Build content
        story = []

        # 1. Cover page
        story.extend(self._create_cover_page(report_data))
        story.append(PageBreak())

        # 2. Table of contents
        story.extend(self._create_table_of_contents(report_data))
        story.append(PageBreak())

        # 3. Executive summary
        story.extend(self._create_executive_summary(report_data))
        story.append(PageBreak())

        # 4. Main sections
        sections = report_data.get('sections', [])
        for section in sections:
            if section.get('is_included', True):
                story.extend(self._create_section_content(section, report_data))
                story.append(PageBreak())

        # 5. Appendices
        story.extend(self._create_appendices(report_data))

        # Build PDF with custom page template
        doc.build(story, onFirstPage=self._add_header_footer, onLaterPages=self._add_header_footer)

        return output_path

    def _create_cover_page(self, report_data: Dict) -> List:
        """Create professional cover page"""
        elements = []

        # Add logo if available
        if self.branding.get('logo_url'):
            try:
                logo = Image(self.branding['logo_url'], width=2 * inch, height=1 * inch)
                logo.hAlign = 'CENTER'
                elements.append(logo)
                elements.append(Spacer(1, 0.5 * inch))
            except:
                pass

        # Add title
        title = report_data.get('report', {}).get('title', 'Sustainability Report')
        elements.append(Paragraph(title, self.styles['CoverTitle']))
        elements.append(Spacer(1, 0.3 * inch))

        # Add reporting period
        period_start = report_data.get('report', {}).get('reporting_period_start', '')
        period_end = report_data.get('report', {}).get('reporting_period_end', '')
        if period_start and period_end:
            period_text = f"Reporting Period: {period_start} to {period_end}"
            elements.append(Paragraph(period_text, self.styles['CoverSubtitle']))

        elements.append(Spacer(1, 1 * inch))

        # Add company name
        company_name = self.branding.get('company_name', 'Company Name')
        elements.append(Paragraph(company_name, self.styles['CoverSubtitle']))

        # Add generation date
        gen_date = datetime.now().strftime('%B %d, %Y')
        elements.append(Paragraph(f"Generated on {gen_date}", self.styles['Normal']))

        return elements

    def _create_table_of_contents(self, report_data: Dict) -> List:
        """Create table of contents"""
        elements = []

        elements.append(Paragraph("Table of Contents", self.styles['SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))

        toc_data = [
            ['Section', 'Page'],
            ['Executive Summary', '3'],
        ]

        # Add all sections
        sections = report_data.get('sections', [])
        page_num = 4
        for section in sections:
            if section.get('is_included', True):
                toc_data.append([section['name'], str(page_num)])
                page_num += 1

        toc_data.append(['Appendices', str(page_num)])

        # Create table
        toc_table = Table(toc_data, colWidths=[5 * inch, 1 * inch])
        toc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.branding['primary_color'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(self.branding['light_gray'])])
        ]))

        elements.append(toc_table)

        return elements

    def _create_executive_summary(self, report_data: Dict) -> List:
        """Create executive summary section"""
        elements = []

        elements.append(Paragraph("Executive Summary", self.styles['SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))

        # Get key metrics from data
        data = report_data.get('data', {})
        emissions = data.get('emissions', {})

        # Create summary text
        summary_text = f"""
        This report presents the carbon footprint analysis for the reporting period 
        {report_data.get('report', {}).get('reporting_period_start', '')} to 
        {report_data.get('report', {}).get('reporting_period_end', '')}. 

        <b>Key Findings:</b>
        <br/>
        • Total GHG Emissions: {emissions.get('total', 0) / 1000:.2f} tonnes CO2e
        <br/>
        • Scope 1 Emissions: {emissions.get('scope1', 0) / 1000:.2f} tonnes CO2e ({self._calculate_percentage(emissions.get('scope1', 0), emissions.get('total', 1)):.1f}%)
        <br/>
        • Scope 2 Emissions: {emissions.get('scope2', 0) / 1000:.2f} tonnes CO2e ({self._calculate_percentage(emissions.get('scope2', 0), emissions.get('total', 1)):.1f}%)
        <br/>
        • Scope 3 Emissions: {emissions.get('scope3', 0) / 1000:.2f} tonnes CO2e ({self._calculate_percentage(emissions.get('scope3', 0), emissions.get('total', 1)):.1f}%)
        """

        elements.append(Paragraph(summary_text, self.styles['BodyText']))
        elements.append(Spacer(1, 0.3 * inch))

        # Add scope breakdown chart
        chart = self._create_scope_pie_chart(emissions)
        if chart:
            elements.append(chart)

        return elements

    def _create_section_content(self, section: Dict, report_data: Dict) -> List:
        """Create content for a specific section"""
        elements = []

        # Section header
        elements.append(Paragraph(section['name'], self.styles['SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))

        # Section code (if available)
        if section.get('section_code'):
            elements.append(Paragraph(
                f"<i>Section {section['section_code']}</i>",
                self.styles['Normal']
            ))
            elements.append(Spacer(1, 0.1 * inch))

        # Section content
        content = section.get('content', {})

        # Add text content
        if content.get('text'):
            elements.append(Paragraph(content['text'], self.styles['BodyText']))
            elements.append(Spacer(1, 0.2 * inch))

        # Add tables if present
        if content.get('tables'):
            for table_data in content['tables']:
                table = self._create_data_table(table_data)
                elements.append(table)
                elements.append(Spacer(1, 0.2 * inch))

        # Add charts if present
        if content.get('charts'):
            for chart_config in content['charts']:
                chart = self._create_chart(chart_config, report_data)
                if chart:
                    elements.append(chart)
                    elements.append(Spacer(1, 0.2 * inch))

        return elements

    def _create_appendices(self, report_data: Dict) -> List:
        """Create appendices section"""
        elements = []

        elements.append(Paragraph("Appendices", self.styles['SectionHeader']))
        elements.append(Spacer(1, 0.2 * inch))

        # Methodology
        elements.append(Paragraph("A. Methodology", self.styles['SubsectionHeader']))
        methodology_text = """
        This report follows the GHG Protocol Corporate Accounting and Reporting Standard.
        Emissions are calculated using activity data multiplied by appropriate emission factors.
        All emissions are reported in tonnes of carbon dioxide equivalent (CO2e).
        """
        elements.append(Paragraph(methodology_text, self.styles['BodyText']))
        elements.append(Spacer(1, 0.2 * inch))

        # Data Sources
        elements.append(Paragraph("B. Data Sources", self.styles['SubsectionHeader']))
        sources_text = """
        • Utility bills and invoices
        <br/>
        • Travel records and fuel consumption data
        <br/>
        • Purchased goods and services invoices
        <br/>
        • Facility management records
        """
        elements.append(Paragraph(sources_text, self.styles['BodyText']))

        return elements

    def _create_data_table(self, table_data: Dict) -> Table:
        """Create formatted data table"""
        data = table_data.get('data', [])

        # Create table
        table = Table(data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor(self.branding['primary_color'])),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor(self.branding['light_gray'])])
        ]))

        return table

    def _create_scope_pie_chart(self, emissions: Dict) -> Optional[Image]:
        """Create high-quality pie chart for scope breakdown"""
        try:
            # Use a compatible style
            try:
                plt.style.use('seaborn-v0_8-darkgrid')
            except:
                try:
                    plt.style.use('seaborn-darkgrid')
                except:
                    try:
                        plt.style.use('seaborn')
                    except:
                        plt.style.use('default')
            # Set figure background to white
            plt.rcParams['figure.facecolor'] = 'white'
            plt.rcParams['axes.facecolor'] = 'white'
            fig, ax = plt.subplots(figsize=(7, 5))
            
            scopes = ['Scope 1', 'Scope 2', 'Scope 3']
            values = [
                emissions.get('scope1', 0) / 1000,
                emissions.get('scope2', 0) / 1000,
                emissions.get('scope3', 0) / 1000
            ]
            colors_list = ['#ef4444', '#f59e0b', '#8b5cf6']
            
            # Create pie chart with better styling
            wedges, texts, autotexts = ax.pie(
                values, 
                labels=scopes, 
                autopct='%1.1f%%', 
                colors=colors_list, 
                startangle=90,
                explode=(0.05, 0.05, 0.05),
                shadow=True,
                textprops={'fontsize': 11, 'fontweight': 'bold'}
            )
            
            # Enhance autopct text
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontweight('bold')
            
            ax.set_title('Emissions by Scope', fontsize=16, fontweight='bold', pad=20)
            
            # Add total emissions text
            total = sum(values)
            ax.text(0, -1.3, f'Total: {total:.2f} tonnes CO₂e', 
                   ha='center', fontsize=12, fontweight='bold', 
                   bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()
            
            img = Image(buf, width=5.5 * inch, height=4 * inch)
            img.hAlign = 'CENTER'
            return img
        except Exception as e:
            print(f"Error creating pie chart: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _create_scope_bar_chart(self, emissions: Dict) -> Optional[Image]:
        """Create bar chart for scope breakdown"""
        try:
            # Use a compatible style
            try:
                plt.style.use('seaborn-v0_8-darkgrid')
            except:
                try:
                    plt.style.use('seaborn-darkgrid')
                except:
                    try:
                        plt.style.use('seaborn')
                    except:
                        plt.style.use('default')
            # Set figure background to white
            plt.rcParams['figure.facecolor'] = 'white'
            plt.rcParams['axes.facecolor'] = 'white'
            fig, ax = plt.subplots(figsize=(7, 5))
            
            scopes = ['Scope 1', 'Scope 2', 'Scope 3']
            values = [
                emissions.get('scope1', 0) / 1000,
                emissions.get('scope2', 0) / 1000,
                emissions.get('scope3', 0) / 1000
            ]
            colors_list = ['#ef4444', '#f59e0b', '#8b5cf6']
            
            bars = ax.bar(scopes, values, color=colors_list, edgecolor='black', linewidth=1.5, alpha=0.8)
            
            # Add value labels on bars
            for bar, val in zip(bars, values):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{val:.2f}\nt CO₂e',
                       ha='center', va='bottom', fontsize=10, fontweight='bold')
            
            ax.set_ylabel('Emissions (tonnes CO₂e)', fontsize=12, fontweight='bold')
            ax.set_title('Emissions Breakdown by Scope', fontsize=16, fontweight='bold', pad=20)
            ax.grid(axis='y', alpha=0.3, linestyle='--')
            ax.set_axisbelow(True)
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()
            
            img = Image(buf, width=5.5 * inch, height=4 * inch)
            img.hAlign = 'CENTER'
            return img
        except Exception as e:
            print(f"Error creating bar chart: {e}")
            return None

    def _create_trend_line_chart(self, trends: List[Dict]) -> Optional[Image]:
        """Create line chart for emissions trends"""
        try:
            if not trends or len(trends) == 0:
                return None
                
            # Use a compatible style
            try:
                plt.style.use('seaborn-v0_8-darkgrid')
            except:
                try:
                    plt.style.use('seaborn-darkgrid')
                except:
                    try:
                        plt.style.use('seaborn')
                    except:
                        plt.style.use('default')
            # Set figure background to white
            plt.rcParams['figure.facecolor'] = 'white'
            plt.rcParams['axes.facecolor'] = 'white'
            fig, ax = plt.subplots(figsize=(8, 5))
            
            periods = [t.get('period', '') for t in trends]
            emissions = [t.get('emissions_kg', 0) / 1000 for t in trends]
            
            ax.plot(periods, emissions, marker='o', linewidth=2.5, markersize=8, 
                   color='#667eea', markerfacecolor='#764ba2', markeredgecolor='white', 
                   markeredgewidth=2, label='Total Emissions')
            
            # Fill area under curve
            ax.fill_between(periods, emissions, alpha=0.3, color='#667eea')
            
            # Add value labels
            for i, (period, emission) in enumerate(zip(periods, emissions)):
                if i % max(1, len(periods) // 5) == 0:  # Label every 5th point or all if < 5
                    ax.annotate(f'{emission:.1f}t', 
                              (period, emission),
                              textcoords="offset points", 
                              xytext=(0,10), 
                              ha='center', fontsize=9, fontweight='bold')
            
            ax.set_xlabel('Period', fontsize=12, fontweight='bold')
            ax.set_ylabel('Emissions (tonnes CO₂e)', fontsize=12, fontweight='bold')
            ax.set_title('Emissions Trend Over Time', fontsize=16, fontweight='bold', pad=20)
            ax.grid(True, alpha=0.3, linestyle='--')
            ax.legend(loc='best', fontsize=10)
            
            # Rotate x-axis labels if needed
            plt.xticks(rotation=45, ha='right')
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()
            
            img = Image(buf, width=6 * inch, height=4 * inch)
            img.hAlign = 'CENTER'
            return img
        except Exception as e:
            print(f"Error creating trend chart: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _create_category_bar_chart(self, category_data: List[Dict]) -> Optional[Image]:
        """Create horizontal bar chart for category breakdown"""
        try:
            if not category_data or len(category_data) == 0:
                return None
                
            # Use a compatible style
            try:
                plt.style.use('seaborn-v0_8-darkgrid')
            except:
                try:
                    plt.style.use('seaborn-darkgrid')
                except:
                    try:
                        plt.style.use('seaborn')
                    except:
                        plt.style.use('default')
            # Set figure background to white
            plt.rcParams['figure.facecolor'] = 'white'
            plt.rcParams['axes.facecolor'] = 'white'
            fig, ax = plt.subplots(figsize=(8, 6))
            
            # Sort by emissions and take top 10
            sorted_data = sorted(category_data, key=lambda x: x.get('emissions_kg', 0), reverse=True)[:10]
            
            categories = [d.get('category', 'Uncategorized')[:30] for d in sorted_data]
            emissions = [d.get('emissions_kg', 0) / 1000 for d in sorted_data]
            
            # Create color gradient
            colors_list = plt.cm.viridis(np.linspace(0, 1, len(categories)))
            
            bars = ax.barh(categories, emissions, color=colors_list, edgecolor='black', linewidth=1, alpha=0.8)
            
            # Add value labels
            for i, (bar, val) in enumerate(zip(bars, emissions)):
                width = bar.get_width()
                ax.text(width, bar.get_y() + bar.get_height()/2.,
                       f' {val:.2f} t',
                       ha='left', va='center', fontsize=9, fontweight='bold')
            
            ax.set_xlabel('Emissions (tonnes CO₂e)', fontsize=12, fontweight='bold')
            ax.set_title('Top Emission Categories', fontsize=16, fontweight='bold', pad=20)
            ax.grid(axis='x', alpha=0.3, linestyle='--')
            ax.set_axisbelow(True)
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()
            
            img = Image(buf, width=6 * inch, height=4.5 * inch)
            img.hAlign = 'CENTER'
            return img
        except Exception as e:
            print(f"Error creating category chart: {e}")
            return None

    def _create_top_emitters_chart(self, top_emitters: List[Dict]) -> Optional[Image]:
        """Create bar chart for top emission sources"""
        try:
            if not top_emitters or len(top_emitters) == 0:
                return None
                
            # Use a compatible style
            try:
                plt.style.use('seaborn-v0_8-darkgrid')
            except:
                try:
                    plt.style.use('seaborn-darkgrid')
                except:
                    try:
                        plt.style.use('seaborn')
                    except:
                        plt.style.use('default')
            # Set figure background to white
            plt.rcParams['figure.facecolor'] = 'white'
            plt.rcParams['axes.facecolor'] = 'white'
            fig, ax = plt.subplots(figsize=(8, 5))
            
            # Take top 8
            top_data = top_emitters[:8]
            activities = [d.get('activity', 'N/A')[:25] for d in top_data]
            emissions = [d.get('total_emissions_kg', 0) / 1000 for d in top_data]
            
            colors_list = plt.cm.plasma(np.linspace(0, 1, len(activities)))
            
            bars = ax.bar(range(len(activities)), emissions, color=colors_list, 
                         edgecolor='black', linewidth=1.5, alpha=0.8)
            
            # Add value labels
            for bar, val in zip(bars, emissions):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{val:.2f}t',
                       ha='center', va='bottom', fontsize=9, fontweight='bold')
            
            ax.set_xticks(range(len(activities)))
            ax.set_xticklabels(activities, rotation=45, ha='right', fontsize=9)
            ax.set_ylabel('Emissions (tonnes CO₂e)', fontsize=12, fontweight='bold')
            ax.set_title('Top Emission Sources', fontsize=16, fontweight='bold', pad=20)
            ax.grid(axis='y', alpha=0.3, linestyle='--')
            ax.set_axisbelow(True)
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()
            
            img = Image(buf, width=6 * inch, height=4 * inch)
            img.hAlign = 'CENTER'
            return img
        except Exception as e:
            print(f"Error creating top emitters chart: {e}")
            return None

    def _create_lifecycle_chart(self, lifecycle_data: Dict) -> Optional[Image]:
        """Create stacked bar chart for lifecycle phases"""
        try:
            if not lifecycle_data:
                return None
                
            # Use a compatible style
            try:
                plt.style.use('seaborn-v0_8-darkgrid')
            except:
                try:
                    plt.style.use('seaborn-darkgrid')
                except:
                    try:
                        plt.style.use('seaborn')
                    except:
                        plt.style.use('default')
            # Set figure background to white
            plt.rcParams['figure.facecolor'] = 'white'
            plt.rcParams['axes.facecolor'] = 'white'
            fig, ax = plt.subplots(figsize=(7, 5))
            
            phases = ['Upstream', 'In-Process', 'Downstream']
            upstream = lifecycle_data.get('upstream', {}).get('total_emissions_kg', 0) / 1000
            inprocess = lifecycle_data.get('in_process', {}).get('total_emissions_kg', 0) / 1000
            downstream = lifecycle_data.get('downstream', {}).get('total_emissions_kg', 0) / 1000
            
            values = [upstream, inprocess, downstream]
            colors_list = ['#3b82f6', '#10b981', '#f59e0b']
            
            bars = ax.bar(phases, values, color=colors_list, edgecolor='black', linewidth=1.5, alpha=0.8)
            
            # Add value labels
            for bar, val in zip(bars, values):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{val:.2f}\nt CO₂e',
                       ha='center', va='bottom', fontsize=10, fontweight='bold')
            
            ax.set_ylabel('Emissions (tonnes CO₂e)', fontsize=12, fontweight='bold')
            ax.set_title('Emissions by Lifecycle Phase', fontsize=16, fontweight='bold', pad=20)
            ax.grid(axis='y', alpha=0.3, linestyle='--')
            ax.set_axisbelow(True)
            
            plt.tight_layout()
            
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=200, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()
            
            img = Image(buf, width=5.5 * inch, height=4 * inch)
            img.hAlign = 'CENTER'
            return img
        except Exception as e:
            print(f"Error creating lifecycle chart: {e}")
            return None

    def _create_chart(self, chart_config: Dict, report_data: Dict) -> Optional[Any]:
        """Create chart based on configuration"""
        chart_type = chart_config.get('type')

        if chart_type == 'pie':
            return self._create_scope_pie_chart(report_data.get('data', {}).get('emissions', {}))
        elif chart_type == 'bar':
            return self._create_scope_bar_chart(report_data.get('data', {}).get('emissions', {}))
        elif chart_type == 'line':
            return self._create_trend_line_chart(report_data.get('data', {}).get('trends', []))
        elif chart_type == 'category':
            return self._create_category_bar_chart(report_data.get('data', {}).get('category_breakdown', []))
        elif chart_type == 'top_emitters':
            return self._create_top_emitters_chart(report_data.get('data', {}).get('top_emitters', []))
        elif chart_type == 'lifecycle':
            return self._create_lifecycle_chart(report_data.get('data', {}).get('lifecycle', {}))

        return None

    def _add_header_footer(self, canvas, doc):
        """Add header and footer to each page"""
        canvas.saveState()

        # Header
        canvas.setFillColor(colors.HexColor(self.branding['primary_color']))
        canvas.rect(0, doc.height + doc.topMargin + 0.5 * inch, doc.width + doc.leftMargin + doc.rightMargin,
                    0.5 * inch, fill=1, stroke=0)

        canvas.setFillColor(colors.whitesmoke)
        canvas.setFont('Helvetica-Bold', 10)
        canvas.drawString(doc.leftMargin, doc.height + doc.topMargin + 0.65 * inch,
                          self.branding.get('company_name', ''))

        # Footer
        canvas.setFillColor(colors.grey)
        canvas.setFont('Helvetica', 8)
        canvas.drawString(doc.leftMargin, 0.5 * inch, f"Generated on {datetime.now().strftime('%B %d, %Y')}")
        canvas.drawRightString(doc.width + doc.leftMargin, 0.5 * inch, f"Page {doc.page}")

        canvas.restoreState()

    def _calculate_percentage(self, value: float, total: float) -> float:
        """Calculate percentage safely"""
        if total == 0:
            return 0
        return (value / total) * 100