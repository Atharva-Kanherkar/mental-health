/**
 * PDF Export Service
 * Generates PDF reports using Puppeteer
 */

import PDFDocument from 'pdfkit';
import { Report } from './reportGenerationService';

class PDFExportService {
  /**
   * Generate PDF from report data using PDFKit (no Chrome required)
   */
  async generateReportPDF(report: Report): Promise<Buffer> {
    console.log('[PDFExportService] Generating PDF report');

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        doc.fontSize(24).fillColor('#6B5FA8').text('Mental Health Report', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor('#6B7280').text('Confidential Clinical Summary', { align: 'center' });
        doc.moveDown(2);

        // Meta Info
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Patient: ${report.userName}`);
        doc.text(`Period: ${new Date(report.reportPeriod.start).toLocaleDateString()} - ${new Date(report.reportPeriod.end).toLocaleDateString()}`);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`);
        doc.moveDown(1.5);

        // Executive Summary
        doc.fontSize(16).fillColor('#6B5FA8').text('Executive Summary');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Average Mood: ${report.summary.averageMood}/10`);
        doc.text(`Average Energy: ${report.summary.averageEnergy}/10`);
        doc.text(`Average Stress: ${report.summary.averageStress}/10`);
        doc.text(`Average Anxiety: ${report.summary.averageAnxiety}/10`);
        doc.moveDown(1.5);

        // Safety Assessment
        doc.fontSize(16).fillColor('#6B5FA8').text('Safety Assessment');
        doc.moveDown(0.5);
        doc.fontSize(12).fillColor(this.getRiskColor(report.safetyIndicators.riskLevel)).text(`Risk Level: ${report.safetyIndicators.riskLevel.toUpperCase()}`);
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Self-harm thoughts: ${report.safetyIndicators.selfHarmThoughts} occurrences`);
        doc.text(`Suicidal thoughts: ${report.safetyIndicators.suicidalThoughts} occurrences`);
        doc.text(`Self-harm actions: ${report.safetyIndicators.actedOnHarm} occurrences`);
        doc.moveDown(1.5);

        // Behavioral Patterns
        doc.fontSize(16).fillColor('#6B5FA8').text('Behavioral Patterns');
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor('#374151');
        doc.text(`Exercise: ${report.behaviors.exercise.percentage}% (${report.behaviors.exercise.count} days)`);
        doc.text(`Self-Care: ${report.behaviors.selfCare.percentage}% (${report.behaviors.selfCare.count} days)`);
        doc.text(`Social Connection: ${report.behaviors.socialConnection.percentage}% (${report.behaviors.socialConnection.count} days)`);
        doc.text(`Healthy Eating: ${report.behaviors.healthyEating.percentage}% (${report.behaviors.healthyEating.count} days)`);
        doc.text(`Medication: ${report.behaviors.medication.percentage}% (${report.behaviors.medication.count} days)`);
        doc.moveDown(1.5);

        // Recommendations
        if (report.recommendations.length > 0) {
          doc.fontSize(16).fillColor('#6B5FA8').text('Clinical Recommendations');
          doc.moveDown(0.5);
          doc.fontSize(10).fillColor('#374151');
          report.recommendations.forEach((rec: string) => {
            doc.text(`• ${rec}`);
          });
        }

        doc.end();
        console.log('[PDFExportService] PDF generated successfully');
      } catch (error) {
        reject(error);
      }
    });
  }

  private getRiskColor(level: string): string {
    switch (level) {
      case 'low': return '#10B981';
      case 'moderate': return '#F59E0B';
      case 'high': return '#EF4444';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  }

  /**
   * Generate HTML report for viewing or PDF conversion
   */
  generateHTMLReport(report: Report): string {
    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getRiskLevelColor = (level: string) => {
      switch (level) {
        case 'low': return '#10B981';
        case 'moderate': return '#F59E0B';
        case 'high': return '#EF4444';
        case 'critical': return '#DC2626';
        default: return '#6B7280';
      }
    };

    const getTrendIcon = (trend: string) => {
      switch (trend) {
        case 'improving': return '=�';
        case 'declining': return '=�';
        default: return '�';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mental Health Report - ${report.userName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Georgia', 'Times New Roman', serif;
            color: #374151;
            line-height: 1.6;
            background: #FFFFFF;
            padding: 20px;
          }

          .container {
            max-width: 800px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #6B5FA8;
          }

          .header h1 {
            color: #6B5FA8;
            font-size: 32px;
            margin-bottom: 10px;
          }

          .header .subtitle {
            color: #6B7280;
            font-size: 16px;
          }

          .meta-info {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
          }

          .meta-info p {
            margin: 8px 0;
            color: #4B5563;
          }

          .section {
            margin-bottom: 40px;
          }

          .section-title {
            color: #6B5FA8;
            font-size: 24px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #E5E7EB;
          }

          .card {
            background: #F9FAFB;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            border-left: 4px solid #6B5FA8;
          }

          .metric-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }

          .metric {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }

          .metric-label {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 5px;
          }

          .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #6B5FA8;
          }

          .metric-unit {
            font-size: 16px;
            color: #9CA3AF;
          }

          .trend-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-left: 10px;
          }

          .trend-improving {
            background: #D1FAE5;
            color: #065F46;
          }

          .trend-stable {
            background: #E0E7FF;
            color: #3730A3;
          }

          .trend-declining {
            background: #FEE2E2;
            color: #991B1B;
          }

          .behavior-bars {
            margin-top: 15px;
          }

          .behavior-bar {
            margin-bottom: 15px;
          }

          .behavior-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
            color: #4B5563;
          }

          .bar-container {
            width: 100%;
            height: 24px;
            background: #E5E7EB;
            border-radius: 12px;
            overflow: hidden;
          }

          .bar-fill {
            height: 100%;
            background: linear-gradient(90deg, #8B7FB8 0%, #6B5FA8 100%);
            border-radius: 12px;
            transition: width 0.3s ease;
          }

          .pattern-list {
            list-style: none;
            padding: 0;
          }

          .pattern-item {
            padding: 12px;
            margin-bottom: 10px;
            background: white;
            border-radius: 8px;
            border-left: 3px solid #6B5FA8;
          }

          .pattern-item strong {
            color: #6B5FA8;
          }

          .recommendation-list {
            list-style: none;
            padding: 0;
          }

          .recommendation-item {
            padding: 15px;
            margin-bottom: 12px;
            background: #FEF3C7;
            border-radius: 8px;
            border-left: 4px solid #F59E0B;
          }

          .recommendation-item.urgent {
            background: #FEE2E2;
            border-left-color: #DC2626;
          }

          .safety-alert {
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            border: 2px solid;
          }

          .safety-low {
            background: #D1FAE5;
            border-color: #10B981;
          }

          .safety-moderate {
            background: #FEF3C7;
            border-color: #F59E0B;
          }

          .safety-high {
            background: #FEE2E2;
            border-color: #EF4444;
          }

          .safety-critical {
            background: #FEE2E2;
            border-color: #DC2626;
          }

          .correlation-item {
            padding: 12px;
            margin-bottom: 10px;
            background: white;
            border-radius: 8px;
          }

          .correlation-strength {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            margin-left: 8px;
          }

          .strength-strong {
            background: #D1FAE5;
            color: #065F46;
          }

          .strength-moderate {
            background: #E0E7FF;
            color: #3730A3;
          }

          .strength-weak {
            background: #F3F4F6;
            color: #6B7280;
          }

          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }

          @media print {
            body {
              padding: 0;
            }
            .section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Mental Health Report</h1>
            <p class="subtitle">Confidential Clinical Summary</p>
          </div>

          <!-- Meta Information -->
          <div class="meta-info">
            <p><strong>Patient:</strong> ${report.userName}</p>
            <p><strong>Report Period:</strong> ${formatDate(report.reportPeriod.start)} - ${formatDate(report.reportPeriod.end)} (${report.reportPeriod.days} days)</p>
            <p><strong>Generated:</strong> ${formatDate(new Date())}</p>
            <p><strong>Data Points:</strong> ${report.summary.totalCheckIns} check-ins, ${report.summary.totalJournalEntries} journal entries</p>
          </div>

          <!-- Summary Section -->
          <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="metric-grid">
              <div class="metric">
                <div class="metric-label">Average Mood</div>
                <div class="metric-value">${report.summary.averageMood}<span class="metric-unit">/10</span></div>
              </div>
              <div class="metric">
                <div class="metric-label">Average Energy</div>
                <div class="metric-value">${report.summary.averageEnergy}<span class="metric-unit">/10</span></div>
              </div>
              <div class="metric">
                <div class="metric-label">Average Stress</div>
                <div class="metric-value">${report.summary.averageStress}<span class="metric-unit">/10</span></div>
              </div>
              <div class="metric">
                <div class="metric-label">Average Anxiety</div>
                <div class="metric-value">${report.summary.averageAnxiety}<span class="metric-unit">/10</span></div>
              </div>
            </div>
          </div>

          <!-- Mood Trends -->
          <div class="section">
            <h2 class="section-title">
              Mood Trends ${getTrendIcon(report.moodTrends.trend)}
              <span class="trend-badge trend-${report.moodTrends.trend}">${report.moodTrends.trend}</span>
            </h2>
            <div class="card">
              <p>Overall mood trend over the reporting period shows a <strong>${report.moodTrends.trend}</strong> pattern.</p>
              ${report.moodTrends.weeklyAverages.length > 0 ? `
                <p style="margin-top: 15px;"><strong>Weekly Averages:</strong></p>
                <ul style="margin-top: 10px;">
                  ${report.moodTrends.weeklyAverages.map(week => `
                    <li>Week of ${formatDate(week.week)}: Mood ${week.avgMood}/10, Energy ${week.avgEnergy}/10</li>
                  `).join('')}
                </ul>
              ` : ''}
            </div>
          </div>

          <!-- Safety Indicators -->
          <div class="section">
            <h2 class="section-title">Safety Assessment</h2>
            <div class="safety-alert safety-${report.safetyIndicators.riskLevel}">
              <h3 style="margin-bottom: 10px; color: ${getRiskLevelColor(report.safetyIndicators.riskLevel)};">
                Risk Level: ${report.safetyIndicators.riskLevel.toUpperCase()}
              </h3>
              <ul style="margin-left: 20px;">
                <li>Self-harm thoughts: ${report.safetyIndicators.selfHarmThoughts} occurrences</li>
                <li>Suicidal thoughts: ${report.safetyIndicators.suicidalThoughts} occurrences</li>
                <li>Self-harm actions: ${report.safetyIndicators.actedOnHarm} occurrences</li>
              </ul>
              ${report.safetyIndicators.riskLevel === 'critical' || report.safetyIndicators.riskLevel === 'high' ? `
                <p style="margin-top: 15px; font-weight: bold; color: ${getRiskLevelColor(report.safetyIndicators.riskLevel)};">
                  � ALERT: Immediate clinical attention recommended
                </p>
              ` : ''}
            </div>
          </div>

          <!-- Behavioral Patterns -->
          <div class="section">
            <h2 class="section-title">Behavioral Patterns</h2>
            <div class="card">
              <div class="behavior-bars">
                <div class="behavior-bar">
                  <div class="behavior-label">
                    <span>Exercise</span>
                    <span><strong>${report.behaviors.exercise.percentage}%</strong> (${report.behaviors.exercise.count} days)</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${report.behaviors.exercise.percentage}%"></div>
                  </div>
                </div>

                <div class="behavior-bar">
                  <div class="behavior-label">
                    <span>Self-Care</span>
                    <span><strong>${report.behaviors.selfCare.percentage}%</strong> (${report.behaviors.selfCare.count} days)</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${report.behaviors.selfCare.percentage}%"></div>
                  </div>
                </div>

                <div class="behavior-bar">
                  <div class="behavior-label">
                    <span>Social Connection</span>
                    <span><strong>${report.behaviors.socialConnection.percentage}%</strong> (${report.behaviors.socialConnection.count} days)</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${report.behaviors.socialConnection.percentage}%"></div>
                  </div>
                </div>

                <div class="behavior-bar">
                  <div class="behavior-label">
                    <span>Healthy Eating</span>
                    <span><strong>${report.behaviors.healthyEating.percentage}%</strong> (${report.behaviors.healthyEating.count} days)</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${report.behaviors.healthyEating.percentage}%"></div>
                  </div>
                </div>

                <div class="behavior-bar">
                  <div class="behavior-label">
                    <span>Medication Adherence</span>
                    <span><strong>${report.behaviors.medication.percentage}%</strong> (${report.behaviors.medication.count} days)</span>
                  </div>
                  <div class="bar-container">
                    <div class="bar-fill" style="width: ${report.behaviors.medication.percentage}%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detected Patterns -->
          ${report.patterns.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Detected Patterns</h2>
            <ul class="pattern-list">
              ${report.patterns.slice(0, 10).map(pattern => `
                <li class="pattern-item">
                  <strong>${pattern.name}</strong> (${pattern.type})
                  <br>
                  <small>Frequency: ${pattern.frequency} | Trend: ${pattern.trend} ${pattern.impactOnMood ? `| Mood Impact: ${pattern.impactOnMood > 0 ? '+' : ''}${pattern.impactOnMood}` : ''}</small>
                  ${pattern.examples.length > 0 ? `<br><small>Examples: ${pattern.examples.join(', ')}</small>` : ''}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Correlations -->
          ${report.correlations.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Behavioral Correlations</h2>
            <div class="card">
              ${report.correlations.map(corr => {
                const strengthClass = Math.abs(corr.strength) > 0.5 ? 'strong' : Math.abs(corr.strength) > 0.3 ? 'moderate' : 'weak';
                return `
                  <div class="correlation-item">
                    <strong>${corr.factor}</strong> � ${corr.metric}
                    <span class="correlation-strength strength-${strengthClass}">
                      ${corr.direction === 'positive' ? '�' : '�'} ${Math.abs(corr.strength).toFixed(2)}
                    </span>
                    <br>
                    <small>${corr.significance}</small>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Journal Insights -->
          ${report.journalInsights.totalEntries > 0 ? `
          <div class="section">
            <h2 class="section-title">Journal Insights</h2>
            <div class="card">
              <p><strong>Total Entries:</strong> ${report.journalInsights.totalEntries}</p>
              <p><strong>Average Wellness Score:</strong> ${report.journalInsights.averageWellnessScore}/10</p>
              ${report.journalInsights.commonThemes.length > 0 ? `
                <p><strong>Common Themes:</strong> ${report.journalInsights.commonThemes.join(', ')}</p>
              ` : ''}
              <p><strong>Sentiment Distribution:</strong>
                Positive (${report.journalInsights.sentimentDistribution.positive}),
                Neutral (${report.journalInsights.sentimentDistribution.neutral}),
                Negative (${report.journalInsights.sentimentDistribution.negative})
              </p>
            </div>
          </div>
          ` : ''}

          <!-- Assessments -->
          ${report.assessments.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Standardized Assessments</h2>
            ${report.assessments.map(assessment => `
              <div class="card">
                <h3 style="color: #6B5FA8; margin-bottom: 10px;">${assessment.type}</h3>
                <p><strong>Date:</strong> ${formatDate(assessment.date)}</p>
                <p><strong>Score:</strong> ${assessment.score}</p>
                <p><strong>Severity:</strong> ${assessment.severity}</p>
                <p><strong>Interpretation:</strong> ${assessment.interpretation}</p>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <!-- Clinical Recommendations -->
          ${report.recommendations.length > 0 ? `
          <div class="section">
            <h2 class="section-title">Clinical Recommendations</h2>
            <ul class="recommendation-list">
              ${report.recommendations.map(rec => `
                <li class="recommendation-item ${rec.includes('�') || rec.includes('URGENT') ? 'urgent' : ''}">
                  ${rec}
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <!-- Progress Metrics -->
          <div class="section">
            <h2 class="section-title">Progress Metrics</h2>
            <div class="card">
              <p><strong>Mood Change:</strong> ${report.progressMetrics.moodChange > 0 ? '+' : ''}${report.progressMetrics.moodChange} points</p>
              <p><strong>Energy Change:</strong> ${report.progressMetrics.energyChange > 0 ? '+' : ''}${report.progressMetrics.energyChange} points</p>
              <p><strong>Stress Change:</strong> ${report.progressMetrics.stressChange > 0 ? '+' : ''}${report.progressMetrics.stressChange} points (lower is better)</p>
              ${report.progressMetrics.behaviorImprovements.length > 0 ? `
                <p><strong>Improvements:</strong> ${report.progressMetrics.behaviorImprovements.join(', ')}</p>
              ` : ''}
            </div>
          </div>

          <!-- Download PDF Button -->
          <div style="text-align: center; margin: 40px 0; padding: 30px; background: #F3F4F6; border-radius: 12px;">
            <a href="?download=pdf"
               onclick="window.location.href = window.location.pathname + '/pdf' + window.location.search; return false;"
               style="display: inline-block; background: #6B5FA8; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 18px; box-shadow: 0 4px 12px rgba(107,95,168,0.3);">
              📥 Download PDF Report
            </a>
            <p style="margin-top: 12px; font-size: 14px; color: #6B7280;">
              Click to download a printable PDF version
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>This report is confidential and intended for professional mental health assessment only.</p>
            <p>Generated on ${formatDate(new Date())} | My Echoes Mental Health Platform</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const pdfExportService = new PDFExportService();
