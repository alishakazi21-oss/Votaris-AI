import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FileDropzoneProps {
  onFileSelect?: (file: File) => void;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileSelect,
  acceptedFormats = ['.csv', '.parquet'],
  maxSizeMB = 25,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [validationReport, setValidationReport] = useState<{
    status: 'success' | 'warning' | 'error';
    messages: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setSelectedFile(file);
    if (onFileSelect) onFileSelect(file);

    // Read and parse sample lines for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.split('\n').filter((l) => l.trim().length > 0).slice(0, 5);
        const parsed = lines.map((line) => line.split(',').map((c) => c.trim().replace(/^"|"$/g, '')));
        setPreviewRows(parsed);
      }
    };
    reader.readAsText(file);

    // Mock validation report
    setValidationReport({
      status: 'success',
      messages: [
        `File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB (within ${maxSizeMB} MB limit)`,
        'Schema format verified: Valid ISO-8601 timestamps and numeric telemetry columns.',
        'Zero missing null values detected in target columns.',
      ],
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setValidationReport(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={twMerge('space-y-4', className)}>
      {/* Drop Zone Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center',
          isDragging
            ? 'border-accent-cyan bg-accent-cyan/10'
            : 'border-border bg-base hover:border-border/80 hover:bg-elevated/20'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-12 h-12 rounded-full bg-elevated border border-border flex items-center justify-center text-accent-cyan mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-primary">
          Click to upload or drag & drop telemetry file
        </h4>
        <p className="text-xs text-secondary mt-1">
          Supports {acceptedFormats.join(', ')} up to {maxSizeMB} MB. Time resolution 15-min or 1-hour.
        </p>
      </div>

      {/* Selected File & Validation Report */}
      {selectedFile && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4 text-accent-cyan" />
              <span className="font-semibold text-primary font-mono">{selectedFile.name}</span>
              <span className="text-muted">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-muted hover:text-accent-red transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Validation Checklist */}
          {validationReport && (
            <div className="rounded-lg bg-base border border-border/80 p-3 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-accent-green mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Validation Checklist Passed</span>
              </div>
              {validationReport.messages.map((msg, i) => (
                <div key={i} className="text-[11px] text-secondary flex items-start gap-1.5">
                  <span className="text-accent-green">•</span>
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}

          {/* Sample rows preview */}
          {previewRows.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                First {previewRows.length} Rows Preview
              </div>
              <div className="overflow-x-auto border border-border rounded-lg bg-base">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-elevated border-b border-border text-secondary">
                    <tr>
                      {previewRows[0].map((h, i) => (
                        <th key={i} className="p-2 font-mono whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-mono text-primary">
                    {previewRows.slice(1).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} className="p-2 whitespace-nowrap text-secondary">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
