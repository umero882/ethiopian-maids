import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
  Award,
  FileCheck,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { agencyService } from '@/services/agencyService';
import { supabase } from '@/lib/databaseClient';

const AgencyDocuments = ({ profileData, onProfileUpdate }) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [user?.id]);

  const fetchDocuments = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agency_documents')
        .select('*')
        .eq('agency_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event, documentType) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${documentType}_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agency-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { data: docData, error: docError } = await supabase
        .from('agency_documents')
        .insert({
          agency_id: user.id,
          document_type: documentType,
          file_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          uploaded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (docError) throw docError;

      // Update documents list
      setDocuments((prev) => [docData, ...prev]);

      // Reset file input
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, filePath) => {
    try {
      // Delete from storage
      await supabase.storage.from('agency-documents').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('agency_documents')
        .delete()
        .eq('id', documentId);

      if (!error) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const getDocumentIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return Image;
    return FileText;
  };

  const getVerificationBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className='bg-green-100 text-green-700'>
            <CheckCircle className='w-3 h-3 mr-1' />
            Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className='bg-red-100 text-red-700'>
            <XCircle className='w-3 h-3 mr-1' />
            Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className='bg-yellow-100 text-yellow-700'>
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        );
    }
  };

  const documentTypes = [
    { key: 'business_license', label: 'Business License', required: true },
    { key: 'trade_license', label: 'Trade License', required: true },
    { key: 'labor_permit', label: 'Labor Permit', required: false },
    {
      key: 'insurance_certificate',
      label: 'Insurance Certificate',
      required: false,
    },
    {
      key: 'accreditation_certificate',
      label: 'Accreditation Certificate',
      required: false,
    },
    { key: 'other', label: 'Other Documents', required: false },
  ];

  const getDocumentsByType = (type) => {
    return documents.filter((doc) => doc.document_type === type);
  };

  const downloadDocument = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('agency-documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Document Upload Section */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Upload className='w-5 h-5 text-purple-600' />
            Document Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {documentTypes.map((docType) => {
              const typeDocuments = getDocumentsByType(docType.key);
              return (
                <Card key={docType.key} className='border border-gray-200'>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between mb-3'>
                      <h3 className='font-medium text-sm'>{docType.label}</h3>
                      {docType.required && (
                        <Badge variant='outline' className='text-xs'>
                          Required
                        </Badge>
                      )}
                    </div>

                    <div className='space-y-2'>
                      {typeDocuments.map((doc) => {
                        const IconComponent = getDocumentIcon(doc.mime_type);
                        return (
                          <div
                            key={doc.id}
                            className='flex items-center justify-between p-2 bg-gray-50 rounded'
                          >
                            <div className='flex items-center gap-2 flex-1 min-w-0'>
                              <IconComponent className='w-4 h-4 text-gray-500 flex-shrink-0' />
                              <span className='text-xs truncate'>
                                {doc.file_name}
                              </span>
                            </div>
                            <div className='flex items-center gap-1'>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() =>
                                  downloadDocument(doc.file_path, doc.file_name)
                                }
                                className='h-6 w-6 p-0'
                              >
                                <Download className='w-3 h-3' />
                              </Button>
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() =>
                                  handleDeleteDocument(doc.id, doc.file_path)
                                }
                                className='h-6 w-6 p-0 text-red-600 hover:text-red-700'
                              >
                                <Trash2 className='w-3 h-3' />
                              </Button>
                            </div>
                          </div>
                        );
                      })}

                      <div className='mt-2'>
                        <Label
                          htmlFor={`upload-${docType.key}`}
                          className='cursor-pointer'
                        >
                          <div className='border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-purple-400 transition-colors'>
                            <Upload className='w-4 h-4 mx-auto mb-1 text-gray-400' />
                            <span className='text-xs text-gray-600'>
                              {uploading ? 'Uploading...' : 'Upload Document'}
                            </span>
                          </div>
                        </Label>
                        <Input
                          id={`upload-${docType.key}`}
                          type='file'
                          className='hidden'
                          accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                          onChange={(e) => handleFileUpload(e, docType.key)}
                          disabled={uploading}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='w-5 h-5 text-purple-600' />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <FileCheck className='w-4 h-4 text-gray-600' />
                  <span className='text-sm font-medium'>
                    License Verification
                  </span>
                </div>
                {getVerificationBadge(
                  profileData.license_verified ? 'verified' : 'pending'
                )}
              </div>

              <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <Award className='w-4 h-4 text-gray-600' />
                  <span className='text-sm font-medium'>
                    Document Completeness
                  </span>
                </div>
                <Badge
                  className={`${
                    documents.length >= 2
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {documents.length >= 2 ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className='space-y-2'>
              <h4 className='font-medium text-sm'>Recent Document Activity</h4>
              {documents.slice(0, 3).map((doc) => (
                <div
                  key={doc.id}
                  className='flex items-center justify-between py-2'
                >
                  <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                    <span className='text-sm'>{doc.file_name}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    {getVerificationBadge(doc.verification_status)}
                    <span className='text-xs text-gray-500'>
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className='text-sm text-gray-500 py-4 text-center'>
                  No documents uploaded yet
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyDocuments;
