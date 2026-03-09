import React, { useState, useRef } from 'react';
import { Upload, X, Image, FileText, Loader2, Check } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const FileUploadVPS = ({ 
  onUpload, 
  folder = 'general',
  accept = 'image/*,.pdf',
  label = 'Upload File',
  currentUrl = null,
  disabled = false,
  showPreview = false  // Only show preview if explicitly enabled
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(currentUrl ? { url: currentUrl, isImage: currentUrl?.match(/\.(jpg|jpeg|png|gif)$/i) } : null);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/upload?folder=${folder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          withCredentials: true
        }
      );

      const fileData = {
        url: `${API_URL}${response.data.url}`,
        isImage: response.data.is_image,
        filename: response.data.original_name
      };
      
      setUploadedFile(fileData);
      onUpload(fileData.url, response.data);
    } catch (err) {
      const message = err.response?.data?.detail || 'Upload failed';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    onUpload(null, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
        data-testid="file-input"
      />

      {uploadedFile ? (
        <div className="relative">
          {showPreview && uploadedFile.isImage ? (
            <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden group">
              <img
                src={uploadedFile.url}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid="remove-file-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">File uploaded successfully</p>
                <p className="text-xs text-green-600 truncate">{uploadedFile.filename || 'File ready'}</p>
              </div>
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  data-testid="remove-file-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="w-full h-24 border-dashed border-2 hover:border-brand-blue hover:bg-brand-blue-50/50"
          data-testid="upload-btn"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
              <span className="text-sm text-slate-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-600">{label}</span>
            </div>
          )}
        </Button>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUploadVPS;
