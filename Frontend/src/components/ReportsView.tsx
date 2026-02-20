import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import {
  getMonthlyCustomerReport,
  getMonthlyProjectReport,
  getInvoiceReport,
  getWeeklyTimesheetReport,
  getCustomerActivityReport,
  getProjectStatusReport,
  getYearToDateSummary,
  getMonthlyComparison,
  getCustomers,
  getInvoiceExportData,
} from '../api';
import { getWeekStart } from '../utils/dateUtils';
import type { Customer, InvoiceExportProject } from '../types';

type ReportType =
  | 'monthly-customer'
  | 'monthly-project'
  | 'invoice'
  | 'weekly-timesheet'
  | 'customer-activity'
  | 'project-status'
  | 'ytd-summary'
  | 'monthly-comparison';

interface ReportOption {
  value: ReportType;
  label: string;
  description: string;
  requiresDateRange?: boolean;
  requiresMonth?: boolean;
  requiresWeek?: boolean;
  requiresYear?: boolean;
  allowsCustomerFilter?: boolean;
}

const reportOptions: ReportOption[] = [
  {
    value: 'monthly-customer',
    label: 'Monthly Summary by Customer',
    description: 'Total hours per customer for a specific month',
    requiresMonth: true,
  },
  {
    value: 'monthly-project',
    label: 'Monthly Summary by Project',
    description: 'Detailed breakdown by project for invoicing',
    requiresMonth: true,
    allowsCustomerFilter: true,
  },
  {
    value: 'invoice',
    label: 'Invoice Preparation',
    description: 'Detailed entries for custom date range',
    requiresDateRange: true,
    allowsCustomerFilter: true,
  },
  {
    value: 'weekly-timesheet',
    label: 'Weekly Timesheet',
    description: 'Daily breakdown for a specific week',
    requiresWeek: true,
  },
  {
    value: 'customer-activity',
    label: 'Customer Activity Report',
    description: 'Customer engagement over a date range',
    requiresDateRange: true,
  },
  {
    value: 'project-status',
    label: 'Project Status Report',
    description: 'Overview of all projects with recent activity',
  },
  {
    value: 'ytd-summary',
    label: 'Year-to-Date Summary',
    description: 'Annual performance metrics',
    requiresYear: true,
  },
  {
    value: 'monthly-comparison',
    label: 'Month-by-Month Comparison',
    description: 'Track trends over the last 6 months',
  },
];

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('monthly-customer');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Date filters
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weekStartDate, setWeekStartDate] = useState(format(getWeekStart(new Date()), 'yyyy-MM-dd'));
  
  // Customer filter
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);

  const currentReportOption = reportOptions.find(r => r.value === selectedReport)!;

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers(true);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      let data: any;

      switch (selectedReport) {
        case 'monthly-customer':
          data = await getMonthlyCustomerReport(year, month);
          break;
        case 'monthly-project':
          data = await getMonthlyProjectReport(year, month, selectedCustomerId);
          break;
        case 'invoice':
          data = await getInvoiceReport(startDate, endDate, selectedCustomerId);
          break;
        case 'weekly-timesheet':
          data = await getWeeklyTimesheetReport(weekStartDate);
          break;
        case 'customer-activity':
          data = await getCustomerActivityReport(startDate, endDate);
          break;
        case 'project-status':
          data = await getProjectStatusReport();
          break;
        case 'ytd-summary':
          data = await getYearToDateSummary(year);
          break;
        case 'monthly-comparison':
          data = await getMonthlyComparison(year);
          break;
      }

      setReportData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const reportOption = reportOptions.find(r => r.value === selectedReport)!;
    let worksheet: XLSX.WorkSheet;

    // Convert data to array format for Excel
    if (Array.isArray(reportData)) {
      worksheet = XLSX.utils.json_to_sheet(reportData);
    } else {
      // For single object (YTD Summary)
      worksheet = XLSX.utils.json_to_sheet([reportData]);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Generate filename
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
    const filename = `${reportOption.label.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const exportInvoiceToExcelSingleSheet = async () => {
    if (selectedReport !== 'invoice') return;
    
    setLoading(true);
    try {
      const invoiceData: InvoiceExportProject[] = await getInvoiceExportData(startDate, endDate, selectedCustomerId);
      
      if (invoiceData.length === 0) {
        setError('No data to export');
        return;
      }

      const aoa: any[][] = [];
      
      for (let i = 0; i < invoiceData.length; i++) {
        const project = invoiceData[i];
        
        // Customer/Project Header (merged across columns)
        aoa.push([project.customer]);
        aoa.push([`Project: ${project.projectNumber} - ${project.projectName}`]);
        aoa.push([`Period: ${project.period}`]);
        aoa.push([]);
        
        // Cost breakdown header row
        aoa.push(['', 'Regular Hours', 'On-Site Hours', 'Travel Time', 'Travel Distance']);
        
        // Hours/Km row
        aoa.push([
          'Hours/Km',
          project.regularHours,
          project.onSiteHours,
          project.travelHours,
          project.travelKm
        ]);
        
        // Rate row
        aoa.push([
          'Rate (€)',
          project.hourlyRate,
          project.hourlyRate,
          project.travelHourlyRate,
          project.kmCost
        ]);
        
        // Total row with formulas
        const baseRow = aoa.length + 1; // Excel is 1-indexed
        aoa.push([
          'Total (€)',
          { f: `B${baseRow-1}*B${baseRow}` },
          { f: `C${baseRow-1}*C${baseRow}` },
          { f: `D${baseRow-1}*D${baseRow}` },
          { f: `E${baseRow-1}*E${baseRow}` }
        ]);
        
        aoa.push([]);
        
        // Detailed entries header
        aoa.push(['Date', 'Description', 'Hours', 'On-Site', 'Travel Hrs', 'Travel Km']);
        
        // Detailed entries
        project.entries.forEach(entry => {
          aoa.push([
            format(new Date(entry.date), 'yyyy-MM-dd'),
            entry.description || '',
            entry.hours,
            entry.isOnSite ? 'Yes' : 'No',
            entry.travelHours || 0,
            entry.travelKm || 0
          ]);
        });
        
        aoa.push([]);
        
        // Project total
        aoa.push([`PROJECT TOTAL: €${project.grandTotal.toFixed(2)}`]);
        
        // Separator between projects
        if (i < invoiceData.length - 1) {
          aoa.push([]);
          aoa.push([]);
        }
      }
      
      const worksheet = XLSX.utils.aoa_to_sheet(aoa);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // Date/Label column
        { wch: 15 }, // Regular Hours/Description
        { wch: 15 }, // On-Site Hours
        { wch: 12 }, // Travel Time
        { wch: 15 }, // Travel Distance
      ];
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice');
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      const filename = `Invoice_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (err: any) {
      setError(err.message || 'Failed to export invoice');
    } finally {
      setLoading(false);
    }
  };

  const exportInvoiceToExcelTabbed = async () => {
    if (selectedReport !== 'invoice') return;
    
    setLoading(true);
    try {
      const invoiceData: InvoiceExportProject[] = await getInvoiceExportData(startDate, endDate, selectedCustomerId);
      
      if (invoiceData.length === 0) {
        setError('No data to export');
        return;
      }

      const workbook = XLSX.utils.book_new();
      
      invoiceData.forEach(project => {
        const aoa: any[][] = [];
        
        // Customer/Project Header
        aoa.push([project.customer]);
        aoa.push([`Project: ${project.projectNumber} - ${project.projectName}`]);
        aoa.push([`Period: ${project.period}`]);
        aoa.push([]);
        
        // Cost breakdown header row
        aoa.push(['', 'Regular Hours', 'On-Site Hours', 'Travel Time', 'Travel Distance']);
        
        // Hours/Km row
        aoa.push([
          'Hours/Km',
          project.regularHours,
          project.onSiteHours,
          project.travelHours,
          project.travelKm
        ]);
        
        // Rate row
        aoa.push([
          'Rate (€)',
          project.hourlyRate,
          project.hourlyRate,
          project.travelHourlyRate,
          project.kmCost
        ]);
        
        // Total row with formulas
        const baseRow = aoa.length + 1;
        aoa.push([
          'Total (€)',
          { f: `B${baseRow-1}*B${baseRow}` },
          { f: `C${baseRow-1}*C${baseRow}` },
          { f: `D${baseRow-1}*D${baseRow}` },
          { f: `E${baseRow-1}*E${baseRow}` }
        ]);
        
        aoa.push([]);
        
        // Detailed entries header
        aoa.push(['Date', 'Description', 'Hours', 'On-Site', 'Travel Hrs', 'Travel Km']);
        
        // Detailed entries
        project.entries.forEach(entry => {
          aoa.push([
            format(new Date(entry.date), 'yyyy-MM-dd'),
            entry.description || '',
            entry.hours,
            entry.isOnSite ? 'Yes' : 'No',
            entry.travelHours || 0,
            entry.travelKm || 0
          ]);
        });
        
        aoa.push([]);
        aoa.push([`PROJECT TOTAL: €${project.grandTotal.toFixed(2)}`]);
        
        const worksheet = XLSX.utils.aoa_to_sheet(aoa);
        
        // Set column widths
        worksheet['!cols'] = [
          { wch: 20 },
          { wch: 15 },
          { wch: 15 },
          { wch: 12 },
          { wch: 15 },
        ];
        
        // Create sheet name (max 31 chars for Excel)
        const sheetName = `${project.customer}-${project.projectNumber}`.substring(0, 31);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      });
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      const filename = `Invoice_Tabbed_${timestamp}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
    } catch (err: any) {
      setError(err.message || 'Failed to export invoice');
    } finally {
      setLoading(false);
    }
  };

  const renderReportTable = () => {
    if (!reportData) return null;

    const columns = Object.keys(Array.isArray(reportData) ? reportData[0] || {} : reportData);
    const rows = Array.isArray(reportData) ? reportData : [reportData];

    if (rows.length === 0) {
      return <div className="no-data">No data available for the selected criteria</div>;
    }

    return (
      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{formatColumnHeader(col)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map(col => (
                  <td key={col}>{formatCellValue(col, row[col])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const formatColumnHeader = (col: string): string => {
    return col
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  const formatCellValue = (col: string, value: any): string => {
    if (value === null || value === undefined) return '-';
    
    // Format dates
    if (col.toLowerCase().includes('date') || col.toLowerCase().includes('activity')) {
      if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return format(new Date(value), 'MMM dd, yyyy');
      }
    }
    
    // Format hours
    if (col.toLowerCase().includes('hours') || col.toLowerCase().includes('avg')) {
      return typeof value === 'number' ? value.toFixed(2) : value;
    }

    // Format times
    if (col.toLowerCase().includes('time') && typeof value === 'string' && value.match(/^\d{2}:\d{2}/)) {
      return value.substring(0, 5);
    }

    // Format boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  };

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2>📊 Management Reports</h2>
        <p>Generate reports and export to Excel</p>
      </div>

      <div className="report-controls">
        <div className="control-group">
          <label>Report Type</label>
          <select
            value={selectedReport}
            onChange={e => {
              setSelectedReport(e.target.value as ReportType);
              setReportData(null);
            }}
          >
            {reportOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <small>{currentReportOption.description}</small>
        </div>

        {currentReportOption.requiresMonth && (
          <>
            <div className="control-group">
              <label>Year</label>
              <input
                type="number"
                value={year}
                onChange={e => setYear(parseInt(e.target.value))}
                min="2020"
                max="2099"
              />
            </div>
            <div className="control-group">
              <label>Month</label>
              <select value={month} onChange={e => setMonth(parseInt(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>
                    {format(new Date(2000, m - 1, 1), 'MMMM')}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {currentReportOption.requiresDateRange && (
          <>
            <div className="control-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="control-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </>
        )}

        {currentReportOption.requiresWeek && (
          <div className="control-group">
            <label>Week Starting (Monday)</label>
            <input
              type="date"
              value={weekStartDate}
              onChange={e => setWeekStartDate(e.target.value)}
            />
          </div>
        )}

        {currentReportOption.requiresYear && !currentReportOption.requiresMonth && (
          <div className="control-group">
            <label>Year</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              min="2020"
              max="2099"
            />
          </div>
        )}

        {currentReportOption.allowsCustomerFilter && (
          <div className="control-group">
            <label>Filter by Customer (Optional)</label>
            <select
              value={selectedCustomerId || ''}
              onChange={e => setSelectedCustomerId(e.target.value ? parseInt(e.target.value) : undefined)}
            >
              <option value="">All Customers</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="control-actions">
          <button onClick={generateReport} disabled={loading} className="btn-primary">
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && selectedReport === 'invoice' && (
            <>
              <button onClick={exportInvoiceToExcelSingleSheet} disabled={loading} className="btn-secondary">
                📥 Export Invoice (Single Sheet)
              </button>
              <button onClick={exportInvoiceToExcelTabbed} disabled={loading} className="btn-secondary">
                📑 Export Invoice (Tabbed)
              </button>
            </>
          )}
          {reportData && selectedReport !== 'invoice' && (
            <button onClick={exportToExcel} className="btn-secondary">
              📥 Export to Excel
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reportData && (
        <div className="report-results">
          <div className="report-results-header">
            <h3>{currentReportOption.label}</h3>
            {Array.isArray(reportData) && (
              <span className="record-count">{reportData.length} records</span>
            )}
          </div>
          {renderReportTable()}
        </div>
      )}
    </div>
  );
}
