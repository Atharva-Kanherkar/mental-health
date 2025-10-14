/**
 * Share Controller
 * Handles report sharing endpoints for therapists
 */

import { Request, Response } from 'express';
import { reportGenerationService } from '../services/reportGenerationService';
import { shareLinkService } from '../services/shareLinkService';
import { pdfExportService } from '../services/pdfExportService';

class ShareController {
  /**
   * POST /api/share/create
   * Create a shareable link for a mental health report
   */
  async createShareLink(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { reportType = 'comprehensive', expiryDays = 30, days = 30 } = req.body;

      // Validate report type
      if (!['weekly', 'monthly', 'comprehensive'].includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Must be: weekly, monthly, or comprehensive'
        });
      }

      // Validate expiry days
      if (expiryDays < 1 || expiryDays > 90) {
        return res.status(400).json({
          success: false,
          message: 'Expiry days must be between 1 and 90'
        });
      }

      console.log(`[ShareController] Generating ${reportType} report for user ${userId}`);

      // Generate the report based on type
      let report;
      if (reportType === 'weekly') {
        report = await reportGenerationService.generateWeeklyReport(userId);
      } else if (reportType === 'monthly') {
        report = await reportGenerationService.generateMonthlyReport(userId);
      } else {
        report = await reportGenerationService.generateComprehensiveReport(userId, days);
      }

      // Create share link
      const shareData = await shareLinkService.createShareLink(
        userId,
        report,
        reportType,
        expiryDays
      );

      console.log(`[ShareController] Share link created successfully`);

      return res.status(201).json({
        success: true,
        data: {
          shareUrl: shareData.shareUrl,
          password: shareData.password,
          expiresAt: shareData.expiresAt,
          reportType,
          message: 'Share link created successfully. Please share both the link and password with your therapist.'
        }
      });
    } catch (error: any) {
      console.error('[ShareController] Error creating share link:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create share link',
        error: error.message
      });
    }
  }

  /**
   * GET /share/:token
   * View shared report (PUBLIC - no auth required)
   */
  async viewSharedReport(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { password } = req.query;

      if (!password || typeof password !== 'string') {
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Password Required</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #F3F4F6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; text-align: center; }
                h1 { color: #6B5FA8; margin-bottom: 20px; }
                input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #E5E7EB; border-radius: 8px; font-size: 16px; }
                button { width: 100%; padding: 12px; background: #6B5FA8; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; margin-top: 10px; }
                button:hover { background: #5A4F8F; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🔒 Password Required</h1>
                <p>Please enter the password to view this mental health report.</p>
                <form method="GET">
                  <input type="password" name="password" placeholder="Enter password" required autofocus />
                  <button type="submit">View Report</button>
                </form>
              </div>
            </body>
          </html>
        `);
      }

      // Get the report
      const report = await shareLinkService.getSharedReport(token, password);

      if (!report) {
        return res.status(401).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Access Denied</title>
              <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #F3F4F6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; text-align: center; }
                h1 { color: #DC2626; margin-bottom: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>❌ Access Denied</h1>
                <p>Invalid password, expired link, or maximum views reached.</p>
                <p>Please check with the report owner for a valid link.</p>
              </div>
            </body>
          </html>
        `);
      }

      // Render HTML report
      const htmlReport = pdfExportService.generateHTMLReport(report);
      return res.send(htmlReport);
    } catch (error: any) {
      console.error('[ShareController] Error viewing shared report:', error);
      return res.status(500).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Server Error</h1>
            <p>An error occurred while loading the report.</p>
          </body>
        </html>
      `);
    }
  }

  /**
   * GET /share/:token/pdf
   * Download report as PDF (PUBLIC - no auth required)
   */
  async downloadPDF(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const { password } = req.query;

      if (!password || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Password required'
        });
      }

      // Get the report
      const report = await shareLinkService.getSharedReport(token, password);

      if (!report) {
        return res.status(401).json({
          success: false,
          message: 'Invalid password, expired link, or maximum views reached'
        });
      }

      // Generate PDF
      const pdf = await pdfExportService.generateReportPDF(report);

      // Send PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="mental-health-report-${Date.now()}.pdf"`
      );
      return res.send(pdf);
    } catch (error: any) {
      console.error('[ShareController] Error downloading PDF:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  }

  /**
   * GET /api/share/my-links
   * Get user's share links
   */
  async getMyShareLinks(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const links = await shareLinkService.getUserShareLinks(userId);

      return res.json({
        success: true,
        data: links
      });
    } catch (error: any) {
      console.error('[ShareController] Error fetching share links:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch share links',
        error: error.message
      });
    }
  }

  /**
   * DELETE /api/share/:token
   * Revoke a share link
   */
  async revokeShareLink(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { token } = req.params;

      const revoked = await shareLinkService.revokeShareLink(token, userId);

      if (!revoked) {
        return res.status(404).json({
          success: false,
          message: 'Share link not found or already revoked'
        });
      }

      return res.json({
        success: true,
        message: 'Share link revoked successfully'
      });
    } catch (error: any) {
      console.error('[ShareController] Error revoking share link:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to revoke share link',
        error: error.message
      });
    }
  }

  /**
   * GET /api/share/:token/stats
   * Get share link statistics
   */
  async getShareLinkStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const { token } = req.params;

      const stats = await shareLinkService.getShareLinkStats(token, userId);

      if (!stats) {
        return res.status(404).json({
          success: false,
          message: 'Share link not found'
        });
      }

      return res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('[ShareController] Error fetching share link stats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch share link stats',
        error: error.message
      });
    }
  }
}

export const shareController = new ShareController();
