import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Upload,
  FileText,
  Image,
  File,
  X,
  Download,
  Calendar,
  Award,
  Shield,
  Heart,
  CheckCircle,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCUMENT_TYPES = [
  { value: 'medical_certificate', label: 'Medical Certificate', icon: Heart, color: 'text-red-500' },
  { value: 'training_certificate', label: 'Training Certificate', icon: Award, color: 'text-blue-500' },
  { value: 'reference_letter', label: 'Reference Letter', icon: FileText, color: 'text-green-500' },
  { value: 'police_clearance', label: 'Police Clearance', icon: Shield, color: 'text-purple-500' },
  { value: 'vaccination_record', label: 'Vaccination Record', icon: Calendar, color: 'text-orange-500' },
  { value: 'skill_certificate', label: 'Skill Certificate (First Aid, CPR, etc.)', icon: Award, color: 'text-indigo-500' },
  { value: 'language_certificate', label: 'Language Certificate', icon: FileText, color: 'text-teal-500' },
  { value: 'experience_letter', label: 'Experience Letter', icon: FileText, color: 'text-gray-500' },
  { value: 'other', label: 'Other Document', icon: File, color: 'text-gray-500' }
];

const AdditionalDocuments = ({
  documents = [],
  onDocumentsChange,
  maxDocuments = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  className
}) => {
  const [isAddingDocument, setIsAddingDocument] = useState(false);
  const [newDocument, setNewDocument] = useState({
    type: '',
    customTypeName: '',
    file: null,
    title: '',
    description: ''
  });
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = useCallback((file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload JPG, PNG, PDF, or WebP files only');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setUploadError(`File size must be less than ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    setUploadError('');
    setNewDocument(prev => ({
      ...prev,
      file,
      title: prev.title || file.name.split('.')[0].replace(/[_-]/g, ' ')
    }));
  }, [maxFileSize]);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  // Add new document
  const addDocument = () => {
    if (!newDocument.type || !newDocument.file) {
      setUploadError('Please select document type and upload a file');
      return;
    }

    if (newDocument.type === 'other' && !newDocument.customTypeName.trim()) {
      setUploadError('Please specify the document type');
      return;
    }

    const documentToAdd = {
      id: Date.now().toString(),
      type: newDocument.type,
      customTypeName: newDocument.customTypeName,
      file: newDocument.file,
      title: newDocument.title || newDocument.file.name,
      description: newDocument.description,
      uploadDate: new Date().toISOString(),
      fileSize: newDocument.file.size,
      fileType: newDocument.file.type
    };

    const updatedDocuments = [...documents, documentToAdd];
    onDocumentsChange(updatedDocuments);

    // Reset form
    setNewDocument({
      type: '',
      customTypeName: '',
      file: null,
      title: '',
      description: ''
    });
    setIsAddingDocument(false);
    setUploadError('');
  };

  // Remove document
  const removeDocument = (documentId) => {
    const updatedDocuments = documents.filter(doc => doc.id !== documentId);
    onDocumentsChange(updatedDocuments);
  };

  // Get document type info
  const getDocumentTypeInfo = (type) => {
    return DOCUMENT_TYPES.find(docType => docType.value === type) || DOCUMENT_TYPES.find(docType => docType.value === 'other');
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    const type = (fileType || '').toString();
    if (type.startsWith('image/')) return Image;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Additional Documents (Optional)</h3>
        <p className='text-sm text-gray-600 mb-4'>
          Upload supporting documents like medical certificates, training certificates, reference letters, etc. to strengthen your profile.
        </p>
      </div>

      {/* Existing Documents */}
      {documents.length > 0 && (
        <div className='space-y-3'>
          {documents.map((doc) => {
            const typeInfo = getDocumentTypeInfo(doc.type);
            const IconComponent = typeInfo.icon;
            const FileIconComponent = getFileIcon(doc.fileType || doc.mimeType || (doc.file && doc.file.type));

            return (
              <div
                key={doc.id}
                className='flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className={`p-2 bg-white rounded-lg ${typeInfo.color}`}>
                    <IconComponent className='w-5 h-5' />
                  </div>
                  <div className='flex-1'>
                    <h4 className='font-medium text-gray-900'>
                      {doc.type === 'other' ? doc.customTypeName : typeInfo.label}
                    </h4>
                    <p className='text-sm text-gray-600'>{doc.title}</p>
                    {doc.description && (
                      <p className='text-xs text-gray-500 mt-1'>{doc.description}</p>
                    )}
                    <div className='flex items-center gap-4 mt-2 text-xs text-gray-500'>
                      <span className='flex items-center gap-1'>
                        <FileIconComponent className='w-3 h-3' />
                        {formatFileSize(doc.fileSize || doc.file?.size || 0)}
                      </span>
                      <span>Uploaded {new Date(doc.uploadDate || doc.uploaded_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      if (doc.file) {
                        const url = URL.createObjectURL(doc.file);
                        window.open(url, '_blank');
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                      } else if (doc.url) {
                        window.open(doc.url, '_blank');
                      }
                    }}
                    className='text-blue-600 hover:text-blue-800'
                  >
                    <Eye className='w-4 h-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      if (doc.file) {
                        const url = URL.createObjectURL(doc.file);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = doc.title;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } else if (doc.url) {
                        const a = document.createElement('a');
                        a.href = doc.url;
                        a.download = doc.title || 'document';
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }}
                    className='text-gray-600 hover:text-gray-800'
                  >
                    <Download className='w-4 h-4' />
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={(e) => { e.preventDefault(); removeDocument(doc.id); }}
                    className='text-red-600 hover:text-red-800'
                  >
                    <X className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Button */}
      {!isAddingDocument && documents.length < maxDocuments && (
        <Button
          type='button'
          variant='outline'
          onClick={() => setIsAddingDocument(true)}
          className='w-full border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors'
        >
          <Plus className='w-4 h-4 mr-2' />
          Add Document ({documents.length}/{maxDocuments})
        </Button>
      )}

      {/* Add Document Form */}
      {isAddingDocument && (
        <div className='border border-gray-200 rounded-lg p-4 space-y-4 bg-white'>
          <div className='flex items-center justify-between'>
            <h4 className='font-medium text-gray-900'>Add New Document</h4>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                setIsAddingDocument(false);
                setNewDocument({
                  type: '',
                  customTypeName: '',
                  file: null,
                  title: '',
                  description: ''
                });
                setUploadError('');
              }}
            >
              <X className='w-4 h-4' />
            </Button>
          </div>

          {/* Document Type Selection */}
          <div>
            <Label htmlFor='documentType'>Document Type *</Label>
            <Select
              value={newDocument.type}
              onValueChange={(value) =>
                setNewDocument(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Select document type' />
              </SelectTrigger>
              <SelectContent className='max-h-60'>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className='flex items-center gap-2'>
                      <type.icon className={`w-4 h-4 ${type.color}`} />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Type Name for "Other" */}
          {newDocument.type === 'other' && (
            <div>
              <Label htmlFor='customTypeName'>Document Type Name *</Label>
              <Input
                id='customTypeName'
                value={newDocument.customTypeName}
                onChange={(e) =>
                  setNewDocument(prev => ({ ...prev, customTypeName: e.target.value }))
                }
                placeholder='e.g., Driving License, Insurance Certificate'
                maxLength={50}
              />
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors',
              dragOver && 'border-blue-500 bg-blue-50',
              newDocument.file && 'border-green-500 bg-green-50'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {newDocument.file ? (
              <div className='space-y-2'>
                <CheckCircle className='w-8 h-8 text-green-600 mx-auto' />
                <p className='text-sm font-medium text-green-700'>File Selected</p>
                <p className='text-xs text-gray-600'>{newDocument.file.name}</p>
                <p className='text-xs text-gray-500'>{formatFileSize(newDocument.file.size)}</p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setNewDocument(prev => ({ ...prev, file: null, title: '' }))}
                >
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className='space-y-2'>
                <Upload className='w-8 h-8 text-gray-400 mx-auto' />
                <p className='text-sm font-medium text-gray-700'>
                  Drag and drop your file here, or click to browse
                </p>
                <p className='text-xs text-gray-500'>
                  Supported: JPG, PNG, PDF, WebP • Max {(maxFileSize / 1024 / 1024).toFixed(1)}MB
                </p>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='.jpg,.jpeg,.png,.pdf,.webp'
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className='hidden'
                  tabIndex={-1}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div>
            <Label htmlFor='documentTitle'>Document Title</Label>
            <Input
              id='documentTitle'
              value={newDocument.title}
              onChange={(e) =>
                setNewDocument(prev => ({ ...prev, title: e.target.value }))
              }
              placeholder='e.g., Medical Certificate 2024'
              maxLength={100}
            />
            <p className='text-xs text-gray-500 mt-1'>
              Leave blank to use filename • {newDocument.title.length}/100 characters
            </p>
          </div>

          {/* Document Description */}
          <div>
            <Label htmlFor='documentDescription'>Description (Optional)</Label>
            <Input
              id='documentDescription'
              value={newDocument.description}
              onChange={(e) =>
                setNewDocument(prev => ({ ...prev, description: e.target.value }))
              }
              placeholder='Brief description of the document content'
              maxLength={200}
            />
            <p className='text-xs text-gray-500 mt-1'>
              {newDocument.description.length}/200 characters
            </p>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className='flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700'>
              <AlertTriangle className='w-4 h-4 flex-shrink-0' />
              <p className='text-sm'>{uploadError}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex gap-3 pt-2'>
            <Button
              type='button' onClick={(e) => { e.preventDefault(); addDocument(); }}
              disabled={!newDocument.type || !newDocument.file}
              className='flex-1'
            >
              <Plus className='w-4 h-4 mr-2' />
              Add Document
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setIsAddingDocument(false);
                setNewDocument({
                  type: '',
                  customTypeName: '',
                  file: null,
                  title: '',
                  description: ''
                });
                setUploadError('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Document Limit Notice */}
      {documents.length >= maxDocuments && (
        <div className='flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700'>
          <CheckCircle className='w-4 h-4 flex-shrink-0' />
          <p className='text-sm'>
            You've reached the maximum of {maxDocuments} additional documents. Remove a document to add a new one.
          </p>
        </div>
      )}

      {/* Tips */}
      <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
        <h4 className='font-medium text-gray-900 mb-2'>💡 Document Tips:</h4>
        <ul className='text-sm text-gray-600 space-y-1'>
          <li>• Upload clear, high-quality scans or photos</li>
          <li>• Ensure all text is readable and not cut off</li>
          <li>• Medical certificates should be recent (within 6 months)</li>
          <li>• Training certificates help demonstrate your qualifications</li>
          <li>• Reference letters from previous employers are valuable</li>
        </ul>
      </div>
    </div>
  );
};

export default AdditionalDocuments;



