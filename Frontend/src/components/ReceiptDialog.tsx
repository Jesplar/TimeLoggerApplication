import React, { useState, useEffect } from 'react';
import { createReceipt, updateReceipt, getProjects, getReceiptTypes, getCustomers } from '../api';
import type { Receipt, CreateReceiptDto, UpdateReceiptDto, Project, ReceiptType, Customer } from '../types';

interface ReceiptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editReceipt?: Receipt | null;
}

export const ReceiptDialog: React.FC<ReceiptDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  editReceipt,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [receiptTypes, setReceiptTypes] = useState<ReceiptType[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedReceiptTypeId, setSelectedReceiptTypeId] = useState<number | null>(null);
  const [date, setDate] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [cost, setCost] = useState<string>('');
  const [currency, setCurrency] = useState<string>('EUR');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCustomers();
      loadProjects();
      loadReceiptTypes();
      
      if (editReceipt) {
        setSelectedProjectId(editReceipt.projectId);
        setSelectedReceiptTypeId(editReceipt.receiptTypeId);
        setDate(editReceipt.date.split('T')[0]);
        setFileName(editReceipt.fileName);
        setCost(editReceipt.cost.toString());
        setCurrency(editReceipt.currency);
        setFile(null);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editReceipt]);

  // Generate filename when project, type, or date changes
  useEffect(() => {
    if (!editReceipt && selectedProjectId && selectedReceiptTypeId && date && file) {
      const project = projects.find(p => p.id === selectedProjectId);
      const receiptType = receiptTypes.find(rt => rt.id === selectedReceiptTypeId);
      const customer = project ? customers.find(c => c.id === project.customerId) : null;
      
      if (project && receiptType && customer) {
        const fileExt = file.name.split('.').pop() || 'png';
        const formattedDate = date.replace(/-/g, '');
        const generatedName = `${customer.name}-${project.projectNumber}-${receiptType.name}-${formattedDate}.${fileExt}`;
        setFileName(generatedName);
      }
    }
  }, [selectedProjectId, selectedReceiptTypeId, date, file, projects, customers, receiptTypes, editReceipt]);

  const loadCustomers = async () => {
    try {
      const data = await getCustomers(false);
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers', err);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await getProjects(undefined, false);
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
      setError('Failed to load projects');
    }
  };

  const loadReceiptTypes = async () => {
    try {
      const data = await getReceiptTypes();
      setReceiptTypes(data);
    } catch (err) {
      console.error('Failed to load receipt types', err);
      setError('Failed to load receipt types');
    }
  };

  const resetForm = () => {
    setSelectedProjectId(null);
    setSelectedReceiptTypeId(null);
    setDate(new Date().toISOString().split('T')[0]);
    setFileName('');
    setCost('');
    setCurrency('EUR');
    setFile(null);
    setError('');
    setCustomers([]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!fileName) {
        setFileName(droppedFile.name);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!fileName) {
        setFileName(selectedFile.name);
      }
    }
  };

  const handleSave = async () => {
    setError('');

    // Validation
    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    if (!selectedReceiptTypeId) {
      setError('Please select a receipt type');
      return;
    }

    if (!date) {
      setError('Please select a date');
      return;
    }

    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }

    const costNum = parseFloat(cost);
    if (isNaN(costNum) || costNum <= 0) {
      setError('Please enter a valid cost');
      return;
    }

    if (!editReceipt && !file) {
      setError('Please select a file to upload');
      return;
    }

    setIsLoading(true);

    try {
      if (editReceipt) {
        const updateData: UpdateReceiptDto = {
          projectId: selectedProjectId,
          receiptTypeId: selectedReceiptTypeId,
          date: date,
          fileName: fileName.trim(),
          cost: costNum,
          currency: currency,
        };
        await updateReceipt(editReceipt.id, updateData);
      } else {
        const createData: CreateReceiptDto = {
          projectId: selectedProjectId,
          receiptTypeId: selectedReceiptTypeId,
          date: date,
          fileName: fileName.trim(),
          cost: costNum,
          currency: currency,
        };
        await createReceipt(createData, file || undefined);
      }

      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error('Failed to save receipt', err);
      setError(err.response?.data?.title || err.message || 'Failed to save receipt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editReceipt ? 'Edit Receipt' : 'Add Receipt'}</h2>

        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Project *</label>
          <select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : null)}
            disabled={isLoading}
          >
            <option value="">Select Project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.projectNumber} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Receipt Type *</label>
          <select
            value={selectedReceiptTypeId || ''}
            onChange={(e) => setSelectedReceiptTypeId(e.target.value ? parseInt(e.target.value) : null)}
            disabled={isLoading}
          >
            <option value="">Select Type</option>
            {receiptTypes.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {!editReceipt && (
          <div className="form-group">
            <label>Receipt File *</label>
            <div
              className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="file-info">
                  <p>📄 {file.name}</p>
                  <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="secondary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <>
                  <p>Drag and drop a file here</p>
                  <p style={{ margin: '0.5rem 0' }}>or</p>
                  <label className="file-input-label">
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      disabled={isLoading}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="secondary"
                      onClick={(e) => {
                        e.preventDefault();
                        e.currentTarget.previousElementSibling?.dispatchEvent(new MouseEvent('click'));
                      }}
                    >
                      Choose File
                    </button>
                  </label>
                </>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>File Name *</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            disabled={isLoading}
            placeholder="Enter file name"
          />
        </div>

        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Cost *</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              disabled={isLoading}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="form-group" style={{ flex: 1 }}>
            <label>Currency *</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isLoading}
            >
              <option value="EUR">EUR</option>
              <option value="SEK">SEK</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleCancel} className="secondary" disabled={isLoading}>
            Cancel
          </button>
          <button onClick={handleSave} className="primary" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
