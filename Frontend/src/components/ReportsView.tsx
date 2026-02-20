import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
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
  getReceipts,
  deleteReceipt,
} from '../api';
import { getWeekStart } from '../utils/dateUtils';
import type { Customer, InvoiceExportProject, Receipt } from '../types';
import { ReceiptDialog } from './ReceiptDialog';

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

export function ReportsView({ receiptsOnly = false }: { receiptsOnly?: boolean }) {
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

  // Receipts management
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);

  const currentReportOption = reportOptions.find(r => r.value === selectedReport)!;

  useEffect(() => {
    loadCustomers();
    if (receiptsOnly) {
      loadReceipts();
    }
  }, [receiptsOnly]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers(true);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadReceipts = async () => {
    try {
      setLoading(true);
      const data = await getReceipts({ startDate, endDate });
      setReceipts(data);
    } catch (err) {
      console.error('Failed to load receipts:', err);
      setError('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReceipt = () => {
    setEditingReceipt(null);
    setIsReceiptDialogOpen(true);
  };

  const handleEditReceipt = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setIsReceiptDialogOpen(true);
  };

  const handleDeleteReceipt = async (id: number) => {
    if (!confirm('Are you sure you want to delete this receipt?')) return;
    
    try {
      await deleteReceipt(id);
      loadReceipts();
    } catch (err) {
      console.error('Failed to delete receipt:', err);
      setError('Failed to delete receipt');
    }
  };

  const handleSaveReceipt = () => {
    loadReceipts();
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

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Invoice');
      
      // Set column widths
      worksheet.columns = [
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 12 },
        { width: 15 },
      ];
      
      let currentRow = 1;
      
      for (let i = 0; i < invoiceData.length; i++) {
        const project = invoiceData[i];
        
        // Customer Header - BOLD
        worksheet.getCell(currentRow, 1).value = project.customer;
        worksheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        
        // Project Header - BOLD
        worksheet.getCell(currentRow, 1).value = `Project: ${project.projectNumber} - ${project.projectName}`;
        worksheet.getRow(currentRow).font = { bold: true };
        currentRow++;
        
        // Period
        worksheet.getCell(currentRow, 1).value = `Period: ${project.period}`;
        currentRow++;
        
        // Empty row
        currentRow++;
        
        // Cost breakdown header row - BOLD
        const headerRow = worksheet.getRow(currentRow);
        headerRow.values = ['', 'Regular Hours', 'On-Site Hours', 'Travel Time', 'Travel Distance'];
        headerRow.font = { bold: true };
        currentRow++;
        
        // Hours/Km row
        worksheet.getRow(currentRow).values = [
          'Hours/Km',
          project.regularHours,
          project.onSiteHours,
          project.travelHours,
          project.travelKm
        ];
        currentRow++;
        
        // Rate row
        worksheet.getRow(currentRow).values = [
          'Rate (€)',
          project.hourlyRate,
          project.hourlyRate,
          project.travelHourlyRate,
          project.kmCost
        ];
        currentRow++;
        
        // Total row with formulas - BOLD
        const totalRow = worksheet.getRow(currentRow);
        totalRow.getCell(1).value = 'Total (€)';
        totalRow.getCell(2).value = { formula: `B${currentRow-1}*B${currentRow}` };
        totalRow.getCell(3).value = { formula: `C${currentRow-1}*C${currentRow}` };
        totalRow.getCell(4).value = { formula: `D${currentRow-1}*D${currentRow}` };
        totalRow.getCell(5).value = { formula: `E${currentRow-1}*E${currentRow}` };
        totalRow.font = { bold: true };
        currentRow++;
        
        // Empty row
        currentRow++;
        
        // Detailed entries header - BOLD
        const detailHeaderRow = worksheet.getRow(currentRow);
        detailHeaderRow.values = ['Date', 'Description', 'Hours', 'On-Site', 'Travel Hrs', 'Travel Km'];
        detailHeaderRow.font = { bold: true };
        currentRow++;
        
        // Detailed entries
        project.entries.forEach(entry => {
          worksheet.getRow(currentRow).values = [
            format(new Date(entry.date), 'yyyy-MM-dd'),
            entry.description || '',
            entry.hours,
            entry.isOnSite ? 'Yes' : 'No',
            entry.travelHours || 0,
            entry.travelKm || 0
          ];
          currentRow++;
        });
        
        // Empty row
        currentRow++;
        
        // Project total - BOLD
        const projectTotalRow = worksheet.getRow(currentRow);
        projectTotalRow.getCell(1).value = `PROJECT TOTAL: €${project.grandTotal.toFixed(2)}`;
        projectTotalRow.font = { bold: true };
        currentRow++;
        
        // Separator between projects
        if (i < invoiceData.length - 1) {
          currentRow += 2;
        }
      }
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      const filename = `Invoice_${timestamp}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
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

      const workbook = new ExcelJS.Workbook();
      
      invoiceData.forEach(project => {
        const sheetName = `${project.customer}-${project.projectNumber}`.substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);
        
        // Set column widths
        worksheet.columns = [
          { width: 20 },
          { width: 25 },
          { width: 30 },
          { width: 10 },
          { width: 12 },
          { width: 12 },
          { width: 15 },
        ];
        
        let currentRow = 1;
        
        // Header - BOLD
        let row = worksheet.getRow(currentRow);
        row.values = ['Customer:', project.customer, '', '', '', ''];
        row.font = { bold: true };
        currentRow++;
        
        row = worksheet.getRow(currentRow);
        row.values = ['Project:', `${project.projectNumber} - ${project.projectName}`, '', '', '', ''];
        row.font = { bold: true };
        currentRow++;
        
        row = worksheet.getRow(currentRow);
        row.values = ['Period:', project.period, '', '', '', ''];
        currentRow++;
        
        // Empty row
        currentRow++;
        
        // Regular Hours Section with Time Code breakdown
        if (project.regularHours > 0) {
          row = worksheet.getRow(currentRow);
          row.values = ['═══ REGULAR HOURS ═══', '', '', '', '', ''];
          row.font = { bold: true };
          currentRow++;
          
          project.regularHoursByTimeCode.forEach(tc => {
            worksheet.getRow(currentRow).values = [
              `${tc.timeCode} - ${tc.timeCodeDescription}:`,
              `${tc.hours} hours`,
              'Rate:',
              `€${project.hourlyRate}`,
              'Total:',
              `€${tc.cost.toFixed(2)}`
            ];
            currentRow++;
          });
          
          row = worksheet.getRow(currentRow);
          row.values = ['REGULAR SUBTOTAL:', `${project.regularHours} hours`, '', '', 'Total:', `€${project.regularCost.toFixed(2)}`];
          row.font = { bold: true };
          currentRow++;
          
          currentRow++;
        }
        
        // On-Site Hours Section with Time Code breakdown
        if (project.onSiteHours > 0) {
          row = worksheet.getRow(currentRow);
          row.values = ['═══ ON-SITE HOURS ═══', '', '', '', '', ''];
          row.font = { bold: true };
          currentRow++;
          
          project.onSiteHoursByTimeCode.forEach(tc => {
            worksheet.getRow(currentRow).values = [
              `${tc.timeCode} - ${tc.timeCodeDescription}:`,
              `${tc.hours} hours`,
              'Rate:',
              `€${project.hourlyRate}`,
              'Total:',
              `€${tc.cost.toFixed(2)}`
            ];
            currentRow++;
          });
          
          row = worksheet.getRow(currentRow);
          row.values = ['ON-SITE SUBTOTAL:', `${project.onSiteHours} hours`, '', '', 'Total:', `€${project.onSiteCost.toFixed(2)}`];
          row.font = { bold: true };
          currentRow++;
          
          currentRow++;
        }
        
        // Travel Section
        if (project.travelHours > 0 || project.travelKm > 0) {
          row = worksheet.getRow(currentRow);
          row.values = ['═══ TRAVEL ═══', '', '', '', '', ''];
          row.font = { bold: true };
          currentRow++;
          
          if (project.travelHours > 0) {
            worksheet.getRow(currentRow).values = [
              'Travel Time:',
              `${project.travelHours} hours`,
              'Rate:',
              `€${project.travelHourlyRate}/hr`,
              'Total:',
              `€${project.travelTimeCost.toFixed(2)}`
            ];
            currentRow++;
          }
          if (project.travelKm > 0) {
            worksheet.getRow(currentRow).values = [
              'Travel Distance:',
              `${project.travelKm} km`,
              'Rate:',
              `€${project.kmCost}/km`,
              'Total:',
              `€${project.travelDistanceCost.toFixed(2)}`
            ];
            currentRow++;
          }
          currentRow++;
        }
        
        // Receipts Section
        if (project.receipts && project.receipts.length > 0) {
          row = worksheet.getRow(currentRow);
          row.values = ['═══ RECEIPTS ═══', '', '', '', '', ''];
          row.font = { bold: true };
          currentRow++;
          
          project.receipts.forEach(receipt => {
            const costDisplay = receipt.currency === 'EUR' 
              ? `€${receipt.cost.toFixed(2)}`
              : `${receipt.cost.toFixed(2)} SEK`;
            worksheet.getRow(currentRow).values = [
              format(new Date(receipt.date), 'MMM dd, yyyy'),
              receipt.fileName,
              costDisplay,
              '',
              'Total:',
              `€${receipt.costInEur.toFixed(2)}`
            ];
            currentRow++;
          });
          
          row = worksheet.getRow(currentRow);
          row.values = ['RECEIPTS SUBTOTAL:', '', '', '', 'Total:', `€${project.receiptsCost.toFixed(2)}`];
          row.font = { bold: true };
          currentRow++;
          
          currentRow++;
        }
        
        // Total - BOLD
        row = worksheet.getRow(currentRow);
        row.values = ['', '', '', '', 'PROJECT TOTAL:', `€${project.grandTotal.toFixed(2)}`];
        row.font = { bold: true };
        currentRow++;
        
        currentRow += 2;
        
        // Detailed entries
        row = worksheet.getRow(currentRow);
        row.values = ['═══ TIME ENTRY DETAILS ═══', '', '', '', '', '', ''];
        row.font = { bold: true };
        currentRow++;
        
        row = worksheet.getRow(currentRow);
        row.values = ['Date', 'Time Code', 'Description', 'Hours', 'Work Type', 'Travel Time', 'Travel Distance'];
        row.font = { bold: true };
        currentRow++;
        
        project.entries.forEach(entry => {
          worksheet.getRow(currentRow).values = [
            format(new Date(entry.date), 'EEE, MMM dd, yyyy'),
            `${entry.timeCode} - ${entry.timeCodeDescription}`,
            entry.description || '(no description)',
            entry.hours.toFixed(2),
            entry.isOnSite ? 'On-Site' : 'Regular',
            entry.travelHours ? `${entry.travelHours.toFixed(2)} hrs` : '-',
            entry.travelKm ? `${entry.travelKm.toFixed(0)} km` : '-'
          ];
          currentRow++;
        });
      });
      
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmmss');
      const filename = `Invoice_Detailed_${timestamp}.xlsx`;
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
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
        <h2>{receiptsOnly ? '🧾 Receipt Management' : '📊 Management Reports'}</h2>
      </div>

      {receiptsOnly ? (
        <div className="receipts-management">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Receipt Management</h3>
            <button onClick={handleAddReceipt} className="primary">
              + Add Receipt
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={loadReceipts} className="secondary">
                Load Receipts
              </button>
            </div>
          </div>

          {loading ? (
            <p>Loading receipts...</p>
          ) : receipts.length === 0 ? (
            <p>No receipts found for the selected period.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Customer</th>
                  <th>File Name</th>
                  <th>Cost</th>
                  <th>Currency</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(receipt => (
                  <tr key={receipt.id}>
                    <td>{format(new Date(receipt.date), 'MMM dd, yyyy')}</td>
                    <td>{receipt.projectNumber} - {receipt.projectName}</td>
                    <td>{receipt.customerName}</td>
                    <td>{receipt.fileName}</td>
                    <td>{receipt.cost.toFixed(2)}</td>
                    <td>{receipt.currency}</td>
                    <td>
                      <button 
                        onClick={() => handleEditReceipt(receipt)} 
                        className="secondary"
                        style={{ marginRight: '0.5rem', fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteReceipt(receipt.id)} 
                        className="danger"
                        style={{ fontSize: '0.85rem', padding: '0.3rem 0.6rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <>
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
        </>
      )}

      <ReceiptDialog
        isOpen={isReceiptDialogOpen}
        onClose={() => setIsReceiptDialogOpen(false)}
        onSave={handleSaveReceipt}
        editReceipt={editingReceipt}
      />
    </div>
  );
}
