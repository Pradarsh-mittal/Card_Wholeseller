import React, { useState, useRef } from 'react';
import { Upload, X, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const FileUpload = ({ 
  onUpload, 
  folder = 'card_wholesale',
  resourceType = 'image',
  accept = 'image/*',
  label = 'Upload File',
  currentUrl = null,
  disabled = false 
}) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const getSignature = async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/api/cloudinary/signature?resource_type=${resourceType}&folder=${folder}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true
      }
    );
    return response.data;
  };

  const uploadToCloudinary = async (file, signature) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.api_key);
    formData.append('timestamp', signature.timestamp);
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${resourceType}/upload`,
      { method: 'POST', body: formData }
    );

    return response.json();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    try {
      // Show local preview
      if (resourceType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => setPreview(e.target.result);
        reader.readAsDataURL(file);
      }

      // Get signature and upload
      const signature = await getSignature();
      const result = await uploadToCloudinary(file, signature);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setPreview(result.secure_url);
      onUpload(result.secure_url, result.public_id);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setPreview(currentUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
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

      {preview ? (
        <div className="relative group">
          {resourceType === 'image' ? (
            <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden">
              <img
                src={preview}
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
            <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
              <FileText className="w-8 h-8 text-slate-500" />
              <span className="text-sm text-slate-700 truncate flex-1">File uploaded</span>
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
          className="w-full h-32 border-dashed border-2 hover:border-brand-blue hover:bg-brand-blue-50/50"
          data-testid="upload-btn"
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
              <span className="text-sm text-slate-600">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {resourceType === 'image' ? (
                <Image className="w-8 h-8 text-slate-400" />
              ) : (
                <Upload className="w-8 h-8 text-slate-400" />
              )}
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

export default FileUpload;
