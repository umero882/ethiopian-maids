import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Upload,
  Check,
  AlertTriangle,
  FileQuestion,
  Eye,
  Download,
  Info,
  UploadCloud,
  FilePlus,
  Calendar,
} from 'lucide-react';
import { format, differenceInDays, parseISO, addMonths } from 'date-fns';

// Mock document data
const mockDocuments = [
  {
    id: 1,
    name: 'Passport',
    type: 'identification',
    filename: 'passport.pdf',
    uploadDate: '2024-10-15T12:00:00Z',
    expiryDate: '2028-10-15T12:00:00Z',
    status: 'verified',
    required: true,
    verificationHistory: [
      {
        date: '2024-10-16T09:30:00Z',
        status: 'pending',
        comment: 'Document uploaded',
      },
      {
        date: '2024-10-17T14:20:00Z',
        status: 'verified',
        comment: 'Document verified successfully',
      },
    ],
  },
  {
    id: 2,
    name: 'Visa',
    type: 'identification',
    filename: 'work_visa.pdf',
    uploadDate: '2024-11-01T12:00:00Z',
    expiryDate: '2025-08-15T12:00:00Z',
    status: 'verified',
    required: true,
    verificationHistory: [
      {
        date: '2024-11-01T12:00:00Z',
        status: 'pending',
        comment: 'Document uploaded',
      },
      {
        date: '2024-11-02T10:15:00Z',
        status: 'verified',
        comment: 'All requirements met',
      },
    ],
  },
  {
    id: 3,
    name: 'Medical Certificate',
    type: 'health',
    filename: 'medical_certificate.pdf',
    uploadDate: '2024-09-20T12:00:00Z',
    expiryDate: '2025-03-20T12:00:00Z',
    status: 'verified',
    required: true,
    verificationHistory: [
      {
        date: '2024-09-20T12:00:00Z',
        status: 'pending',
        comment: 'Document uploaded',
      },
      {
        date: '2024-09-22T09:45:00Z',
        status: 'verified',
        comment: 'Medical certificate accepted',
      },
    ],
  },
  {
    id: 4,
    name: 'Cooking Certificate',
    type: 'skills',
    filename: 'cooking_cert.pdf',
    uploadDate: '2024-06-10T12:00:00Z',
    expiryDate: null,
    status: 'pending',
    required: false,
    verificationHistory: [
      {
        date: '2024-06-10T12:00:00Z',
        status: 'pending',
        comment: 'Document uploaded, awaiting review',
      },
    ],
  },
  {
    id: 5,
    name: 'Employment Contract',
    type: 'legal',
    filename: null,
    uploadDate: null,
    expiryDate: null,
    status: 'not_uploaded',
    required: false,
    verificationHistory: [],
  },
  {
    id: 6,
    name: 'Previous Experience Letter',
    type: 'employment',
    filename: 'experience_letter.pdf',
    uploadDate: '2024-05-15T12:00:00Z',
    expiryDate: null,
    status: 'verified',
    required: false,
    verificationHistory: [
      {
        date: '2024-05-15T12:00:00Z',
        status: 'pending',
        comment: 'Document uploaded',
      },
      {
        date: '2024-05-16T14:30:00Z',
        status: 'verified',
        comment: 'Experience verified with previous employer',
      },
    ],
  },
  {
    id: 7,
    name: 'Language Proficiency Certificate',
    type: 'skills',
    filename: 'language_cert.pdf',
    uploadDate: '2024-07-05T10:30:00Z',
    expiryDate: null,
    status: 'rejected',
    required: false,
    verificationHistory: [
      {
        date: '2024-07-05T10:30:00Z',
        status: 'pending',
        comment: 'Document uploaded',
      },
      {
        date: '2024-07-06T15:45:00Z',
        status: 'rejected',
        comment: 'Certificate expired. Please upload a valid certificate.',
      },
    ],
    rejectionReason: 'Certificate expired. Please upload a valid certificate.',
  },
];

// Required document types
const requiredDocumentTypes = ['Passport', 'Visa', 'Medical Certificate'];

const MaidDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newDocument, setNewDocument] = useState({
    name: '',
    file: null,
    expiryDate: null,
  });
  const [viewDocument, setViewDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [documentPreviewMode, setDocumentPreviewMode] = useState('view'); // 'view', 'verify'
  const [verificationComment, setVerificationComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [documentZoom, setDocumentZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  // Handle document download
  const handleDownloadDocument = (doc) => {
    if (!doc || !doc.filename) {
      toast({
        title: 'Error',
        description: 'Document cannot be downloaded',
        variant: 'destructive',
      });
      return;
    }

    // For demonstration purposes - use mock documents directly
    // In production, this would fetch from server
    const filename = doc.filename;
    const documentPath = `http://localhost:3001/mock-documents/${filename}`;

    try {

      // Create a direct download by opening the document URL in a new tab
      // This bypasses CORS issues for downloads since it's a direct browser request
      const link = document.createElement('a');
      link.href = documentPath;
      link.target = '_blank';
      link.download = filename; // Hint for the browser to download instead of navigate
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      toast({
        title: 'Download Started',
        description: `${doc.name} is being downloaded`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description:
          'There was an error downloading the document. Please try again.',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    // Fetch documents - in production this would come from an API
    // Using mock data for now
    const fetchData = async () => {
      try {
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load documents. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDocumentUpload = (documentId) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document) {
      setSelectedDocument(document);
      setShowUploadDialog(true);
      setNewDocument({
        name: document.name,
        file: null,
        expiryDate: document.expiryDate ? parseISO(document.expiryDate) : null,
      });
    }
  };

  const handleVerifyDocument = (documentId) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document && document.filename) {
      setViewDocument(document);
      setDocumentPreviewMode('verify');
    }
  };

  const handleAcceptDocument = () => {
    const updatedDocuments = documents.map((doc) => {
      if (doc.id === viewDocument.id) {
        const now = new Date().toISOString();
        const newHistory = [
          ...(doc.verificationHistory || []),
          {
            date: now,
            status: 'verified',
            comment: verificationComment || 'Document verified',
          },
        ];

        return {
          ...doc,
          status: 'verified',
          verificationHistory: newHistory,
        };
      }
      return doc;
    });

    setDocuments(updatedDocuments);

    toast({
      title: 'Document Accepted',
      description: `${viewDocument.name} has been verified successfully.`,
      variant: 'default',
    });

    setVerificationComment('');
    setDocumentPreviewMode('view');
  };

  const handleRejectDocument = () => {
    if (!rejectionReason) {
      toast({
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this document.',
        variant: 'destructive',
      });
      return;
    }

    const updatedDocuments = documents.map((doc) => {
      if (doc.id === viewDocument.id) {
        const now = new Date().toISOString();
        const newHistory = [
          ...(doc.verificationHistory || []),
          { date: now, status: 'rejected', comment: rejectionReason },
        ];

        return {
          ...doc,
          status: 'rejected',
          rejectionReason: rejectionReason,
          verificationHistory: newHistory,
        };
      }
      return doc;
    });

    setDocuments(updatedDocuments);

    toast({
      title: 'Document Rejected',
      description: `${viewDocument.name} was rejected. The user will be notified.`,
      variant: 'destructive',
    });

    setRejectionReason('');
    setDocumentPreviewMode('view');
  };

  const handleAddDocument = () => {
    setSelectedDocument(null);
    setShowUploadDialog(true);
    setNewDocument({
      name: '',
      file: null,
      expiryDate: null,
    });
  };

  // Handle file upload and try to extract expiry date
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // For demonstration purposes, attempt to extract expiry date from filename
      // In a real implementation, this could use OCR or other document scanning
      const extractExpiryDate = (fileName) => {
        // Look for patterns like "expires_2025-08-15" or "valid_until_20250815" in filename
        const datePatterns = [
          // YYYY-MM-DD format
          /expires?[_-]?(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
          /valid[_-]?until[_-]?(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
          /expiry[_-]?date[_-]?(\d{4}[-\/]\d{2}[-\/]\d{2})/i,
          // YYYYMMDD format
          /expires?[_-]?(\d{8})/i,
          /valid[_-]?until[_-]?(\d{8})/i,
          /expiry[_-]?date[_-]?(\d{8})/i,
        ];

        for (const pattern of datePatterns) {
          const match = fileName.match(pattern);
          if (match && match[1]) {
            try {
              // Handle YYYYMMDD format
              if (
                match[1].length === 8 &&
                !match[1].includes('-') &&
                !match[1].includes('/')
              ) {
                const year = match[1].substring(0, 4);
                const month = match[1].substring(4, 6);
                const day = match[1].substring(6, 8);
                return new Date(`${year}-${month}-${day}`);
              }
              // Handle YYYY-MM-DD or YYYY/MM/DD format
              return new Date(match[1]);
            } catch (e) {
              console.error('Failed to parse date from filename:', e);
              return null;
            }
          }
        }

        // If the document type suggests an expiry (like a visa or certificate)
        // Set a default expiry based on document type in the name
        if (
          /visa|passport|license|certificate|id/i.test(fileName) &&
          !newDocument.expiryDate &&
          (selectedDocument?.expiryDate !== undefined ||
            selectedDocument?.name?.match(
              /visa|passport|license|certificate|id/i
            ))
        ) {
          // Default to 1 year from now if it's a document that typically expires
          return addMonths(new Date(), 12);
        }

        return null;
      };

      const suggestedExpiry = extractExpiryDate(file.name);

      setNewDocument({
        ...newDocument,
        file: file,
        expiryDate: suggestedExpiry || newDocument.expiryDate,
      });

      if (suggestedExpiry && suggestedExpiry !== newDocument.expiryDate) {
        toast({
          title: 'Expiry Date Detected',
          description: `Expiry date set to ${format(suggestedExpiry, 'MMMM d, yyyy')}`,
          variant: 'default',
        });
      }
    }
  };

  const handleExpiryDateChange = (date) => {
    setNewDocument({
      ...newDocument,
      expiryDate: date,
    });
  };

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            completeUpload();
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const completeUpload = () => {
    setIsUploading(false);

    // Update document list with new/updated document
    if (selectedDocument) {
      // Update existing document
      const updatedDocuments = documents.map((doc) => {
        if (doc.id === selectedDocument.id) {
          return {
            ...doc,
            filename: newDocument.file ? newDocument.file.name : doc.filename,
            uploadDate: new Date().toISOString(),
            expiryDate: newDocument.expiryDate
              ? newDocument.expiryDate.toISOString()
              : doc.expiryDate,
            status: 'pending',
          };
        }
        return doc;
      });

      setDocuments(updatedDocuments);

      toast({
        title: 'Document Uploaded',
        description: `${selectedDocument.name} has been uploaded and is pending verification.`,
      });
    } else {
      // Add new document
      const newDoc = {
        id: documents.length + 1,
        name: newDocument.name,
        type: 'other',
        filename: newDocument.file ? newDocument.file.name : null,
        uploadDate: new Date().toISOString(),
        expiryDate: newDocument.expiryDate
          ? newDocument.expiryDate.toISOString()
          : null,
        status: 'pending',
        required: false,
      };

      setDocuments([...documents, newDoc]);

      toast({
        title: 'Document Added',
        description: `${newDocument.name} has been added and is pending verification.`,
      });
    }

    // Reset form and close dialog
    setNewDocument({
      name: '',
      file: null,
      expiryDate: null,
    });
    setShowUploadDialog(false);
  };

  const handleSubmitDocument = (e) => {
    e.preventDefault();

    if (!newDocument.name) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a document name.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedDocument && !newDocument.file) {
      toast({
        title: 'Missing File',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    simulateUpload();
  };

  const handleViewDocument = (documentId) => {
    const document = documents.find((doc) => doc.id === documentId);
    if (document && document.filename) {
      setViewDocument(document);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className='bg-green-500'>Verified</Badge>;
      case 'pending':
        return (
          <Badge
            variant='outline'
            className='border-yellow-400 text-yellow-700'
          >
            Pending Verification
          </Badge>
        );
      case 'rejected':
        return <Badge variant='destructive'>Rejected</Badge>;
      case 'expired':
        return <Badge variant='destructive'>Expired</Badge>;
      case 'not_uploaded':
        return (
          <Badge variant='outline' className='border-gray-400 text-gray-700'>
            Not Uploaded
          </Badge>
        );
      default:
        return <Badge variant='outline'>Unknown</Badge>;
    }
  };

  const getDocumentExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;

    const expiry = parseISO(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return {
        status: 'expired',
        message: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'expiring_soon',
        message: `Expires in ${daysUntilExpiry} days`,
      };
    } else {
      return {
        status: 'valid',
        message: `Valid for ${Math.floor(daysUntilExpiry / 30)} months`,
      };
    }
  };

  const getDocumentIcon = (type) => {
    switch (type) {
      case 'identification':
        return <FileText className='h-6 w-6 text-blue-500' />;
      case 'health':
        return <FileText className='h-6 w-6 text-green-500' />;
      case 'skills':
        return <FileText className='h-6 w-6 text-purple-500' />;
      case 'legal':
        return <FileText className='h-6 w-6 text-red-500' />;
      case 'employment':
        return <FileText className='h-6 w-6 text-yellow-500' />;
      default:
        return <FileQuestion className='h-6 w-6 text-gray-500' />;
    }
  };

  const filteredDocuments =
    activeTab === 'all'
      ? documents
      : activeTab === 'required'
        ? documents.filter((doc) => doc.required)
        : activeTab === 'expiring'
          ? documents.filter(
              (doc) =>
                doc.expiryDate &&
                getDocumentExpiryStatus(doc.expiryDate)?.status ===
                  'expiring_soon'
            )
          : documents.filter((doc) => doc.type === activeTab);

  const completionPercentage = () => {
    const requiredDocs = documents.filter((doc) => doc.required);
    const uploadedRequiredDocs = requiredDocs.filter(
      (doc) => doc.status !== 'not_uploaded'
    );
    return requiredDocs.length > 0
      ? Math.round((uploadedRequiredDocs.length / requiredDocs.length) * 100)
      : 100;
  };

  const sectionAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full'>
        <p>Loading documents...</p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='flex justify-between items-center flex-wrap gap-4'>
        <h1 className='text-3xl font-bold text-gray-800'>My Documents</h1>
        <Button onClick={handleAddDocument} className='gap-2'>
          <FilePlus className='h-4 w-4' />
          Add Document
        </Button>
      </div>

      <motion.div {...sectionAnimation}>
        <Card className='shadow-lg border-0'>
          <CardHeader>
            <CardTitle>Document Completion</CardTitle>
            <CardDescription>
              Upload all required documents to complete your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-4'>
                <div className='space-y-2 flex-1'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Required Documents
                    </span>
                    <span className='text-sm font-medium'>
                      {completionPercentage()}% Complete
                    </span>
                  </div>
                  <Progress value={completionPercentage()} className='h-2' />
                </div>

                <div className='flex gap-2'>
                  {completionPercentage() < 100 ? (
                    <div className='flex items-center gap-2 text-sm text-amber-600'>
                      <AlertTriangle className='h-4 w-4' />
                      <span>Required documents missing</span>
                    </div>
                  ) : (
                    <div className='flex items-center gap-2 text-sm text-green-600'>
                      <Check className='h-4 w-4' />
                      <span>All required documents uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-6'>
                {requiredDocumentTypes.map((docType, index) => {
                  const doc = documents.find((d) => d.name === docType);
                  const hasDoc = doc && doc.status !== 'not_uploaded';

                  return (
                    <Card
                      key={index}
                      className={`border ${hasDoc ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                    >
                      <CardContent className='p-4 flex justify-between items-center'>
                        <div className='flex items-center gap-3'>
                          {hasDoc ? (
                            <Check className='h-5 w-5 text-green-600' />
                          ) : (
                            <AlertTriangle className='h-5 w-5 text-red-600' />
                          )}
                          <span className='font-medium'>{docType}</span>
                        </div>

                        {doc && (
                          <Button
                            variant={hasDoc ? 'outline' : 'default'}
                            size='sm'
                            onClick={() => handleDocumentUpload(doc.id)}
                          >
                            {hasDoc ? 'Update' : 'Upload'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div {...sectionAnimation} transition={{ delay: 0.2 }}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid grid-cols-5 mb-6'>
            <TabsTrigger value='all'>All Documents</TabsTrigger>
            <TabsTrigger value='required'>Required</TabsTrigger>
            <TabsTrigger value='identification'>Identification</TabsTrigger>
            <TabsTrigger value='expiring'>Expiring Soon</TabsTrigger>
            <TabsTrigger value='health'>Health</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card className='shadow-lg border-0'>
              <CardContent className='p-6'>
                {filteredDocuments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDocuments.map((doc) => {
                        const expiryStatus = doc.expiryDate
                          ? getDocumentExpiryStatus(doc.expiryDate)
                          : null;

                        return (
                          <TableRow
                            key={doc.id}
                            className='group hover:bg-gray-50'
                          >
                            <TableCell>
                              <div className='flex items-center gap-3'>
                                {getDocumentIcon(doc.type)}
                                <div>
                                  <p className='font-medium'>{doc.name}</p>
                                  <p className='text-xs text-gray-500'>
                                    {doc.filename || 'No file uploaded'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(doc.status)}</TableCell>
                            <TableCell>
                              {doc.uploadDate
                                ? format(
                                    parseISO(doc.uploadDate),
                                    'MMM d, yyyy'
                                  )
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {doc.expiryDate ? (
                                <div
                                  className={`text-sm ${
                                    expiryStatus?.status === 'expired'
                                      ? 'text-red-600'
                                      : expiryStatus?.status === 'expiring_soon'
                                        ? 'text-amber-600'
                                        : 'text-green-600'
                                  }`}
                                >
                                  <div className='flex items-center gap-1'>
                                    {expiryStatus?.status === 'expired' && (
                                      <AlertTriangle className='h-3.5 w-3.5' />
                                    )}
                                    {expiryStatus?.status ===
                                      'expiring_soon' && (
                                      <AlertTriangle className='h-3.5 w-3.5' />
                                    )}
                                    {expiryStatus?.status === 'valid' && (
                                      <Check className='h-3.5 w-3.5' />
                                    )}
                                    <span>
                                      {format(
                                        parseISO(doc.expiryDate),
                                        'MMM d, yyyy'
                                      )}
                                    </span>
                                  </div>
                                  <p className='text-xs'>
                                    {expiryStatus?.message}
                                  </p>
                                </div>
                              ) : (
                                <span className='text-gray-500'>No expiry</span>
                              )}
                            </TableCell>
                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                                {doc.filename && (
                                  <>
                                    <Button
                                      variant='ghost'
                                      size='icon'
                                      onClick={() => handleViewDocument(doc.id)}
                                      title='View Document'
                                    >
                                      <Eye className='h-4 w-4 text-blue-600' />
                                    </Button>
                                    {doc.status === 'pending' && (
                                      <Button
                                        variant='ghost'
                                        size='icon'
                                        onClick={() =>
                                          handleVerifyDocument(doc.id)
                                        }
                                        title='Verify Document'
                                      >
                                        <Check className='h-4 w-4 text-amber-600' />
                                      </Button>
                                    )}
                                  </>
                                )}
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  onClick={() => handleDocumentUpload(doc.id)}
                                  title='Upload or Update'
                                >
                                  <Upload className='h-4 w-4 text-green-600' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className='text-center py-10'>
                    <FileQuestion className='h-16 w-16 text-gray-300 mx-auto mb-3' />
                    <h3 className='text-lg font-medium text-gray-700'>
                      No documents found
                    </h3>
                    <p className='text-gray-500 mt-1'>
                      {activeTab === 'all'
                        ? "You haven't uploaded any documents yet."
                        : activeTab === 'required'
                          ? 'You have uploaded all required documents.'
                          : activeTab === 'expiring'
                            ? "You don't have any documents expiring soon."
                            : `You don't have any ${activeTab} documents.`}
                    </p>
                    <Button onClick={handleAddDocument} className='mt-4'>
                      Upload Document
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>
              {selectedDocument
                ? `Update ${selectedDocument.name}`
                : 'Upload New Document'}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument
                ? `Upload a new version of your ${selectedDocument.name} document.`
                : 'Add a new document to your profile.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDocument}>
            <div className='grid gap-4 py-4'>
              {!selectedDocument && (
                <div className='space-y-2'>
                  <label
                    htmlFor='document-name'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Document Name
                  </label>
                  <input
                    id='document-name'
                    type='text'
                    className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                    value={newDocument.name}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, name: e.target.value })
                    }
                    placeholder='e.g. Passport, Visa, Certificate'
                    disabled={isUploading}
                  />
                </div>
              )}

              <div className='space-y-2'>
                <label
                  htmlFor='document-file'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  Document File
                </label>

                {isUploading ? (
                  <div className='space-y-2'>
                    <div className='flex justify-between text-sm'>
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className='h-2' />
                  </div>
                ) : (
                  <div className='flex items-center justify-center w-full'>
                    <label
                      htmlFor='document-file'
                      className='flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100'
                    >
                      <div className='flex flex-col items-center justify-center pt-5 pb-6'>
                        <UploadCloud className='w-8 h-8 mb-2 text-gray-500' />
                        <p className='mb-2 text-sm text-gray-500'>
                          <span className='font-semibold'>Click to upload</span>{' '}
                          or drag and drop
                        </p>
                        <p className='text-xs text-gray-500'>
                          PDF, JPG, or PNG (max. 10MB)
                        </p>
                      </div>
                      <input
                        id='document-file'
                        type='file'
                        className='hidden'
                        onChange={handleFileChange}
                        accept='.pdf,.jpg,.jpeg,.png'
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                )}

                {newDocument.file && (
                  <p className='text-sm text-gray-500 mt-2'>
                    Selected file: {newDocument.file.name}
                  </p>
                )}
              </div>

              {/* Only show for documents that can expire */}
              {selectedDocument?.expiryDate !== undefined && (
                <div className='space-y-2'>
                  <label
                    htmlFor='expiry-date'
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    Expiry Date
                  </label>
                  <div className='flex items-center gap-2'>
                    <input
                      id='expiry-date'
                      type='date'
                      className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                      value={
                        newDocument.expiryDate
                          ? format(newDocument.expiryDate, 'yyyy-MM-dd')
                          : ''
                      }
                      onChange={(e) =>
                        handleExpiryDateChange(
                          e.target.value ? new Date(e.target.value) : null
                        )
                      }
                      disabled={isUploading}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() =>
                        handleExpiryDateChange(addMonths(new Date(), 12))
                      }
                      disabled={isUploading}
                      title='Set to 1 year from now'
                    >
                      <Calendar className='h-4 w-4' />
                    </Button>
                  </div>
                  <p className='text-xs text-gray-500'>
                    Leave blank if the document doesn't expire
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setShowUploadDialog(false)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={
                  isUploading ||
                  (selectedDocument === null &&
                    (!newDocument.name || !newDocument.file))
                }
              >
                {isUploading ? 'Uploading...' : 'Upload Document'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      {viewDocument && (
        <Dialog
          open={!!viewDocument}
          onOpenChange={(open) => {
            if (!open) {
              setViewDocument(null);
              setDocumentPreviewMode('view');
              setVerificationComment('');
              setRejectionReason('');
              setDocumentZoom(100);
              setCurrentPage(1);
            }
          }}
        >
          <DialogContent
            className={
              documentPreviewMode === 'verify'
                ? 'sm:max-w-[800px] max-h-[90vh]'
                : 'sm:max-w-[600px]'
            }
          >
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2'>
                {getDocumentIcon(viewDocument.type)}
                <span>{viewDocument.name}</span>
                {documentPreviewMode === 'verify' && (
                  <Badge
                    variant='outline'
                    className='ml-2 border-amber-400 text-amber-700'
                  >
                    Verification Mode
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className='flex items-center justify-between'>
                <span>
                  Uploaded on{' '}
                  {format(parseISO(viewDocument.uploadDate), 'MMMM d, yyyy')}
                </span>
                {documentPreviewMode === 'view' &&
                  viewDocument.status === 'pending' && (
                    <Button
                      variant='outline'
                      size='sm'
                      className='gap-1'
                      onClick={() => setDocumentPreviewMode('verify')}
                    >
                      <Check className='h-3.5 w-3.5' />
                      Switch to Verification
                    </Button>
                  )}
              </DialogDescription>
            </DialogHeader>

            <div
              className={`py-4 ${documentPreviewMode === 'verify' ? 'flex flex-col md:flex-row gap-4' : ''}`}
            >
              {/* Document Preview */}
              <div
                className={
                  documentPreviewMode === 'verify'
                    ? 'w-full md:w-2/3'
                    : 'w-full'
                }
              >
                {/* Document Preview Controls - Always show controls */}
                <div className='bg-gray-100 rounded-t-lg p-2 flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setDocumentZoom(Math.max(documentZoom - 10, 50))
                      }
                      disabled={documentZoom <= 50}
                    >
                      -
                    </Button>
                    <span className='text-sm'>{documentZoom}%</span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setDocumentZoom(Math.min(documentZoom + 10, 200))
                      }
                      disabled={documentZoom >= 200}
                    >
                      +
                    </Button>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setCurrentPage(Math.max(currentPage - 1, 1))
                      }
                      disabled={currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className='text-sm'>Page {currentPage}</span>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>

                {/* Document Preview Area */}
                <div
                  className='bg-gray-100 rounded-b-lg p-4 flex flex-col items-center justify-center h-96 overflow-auto'
                  style={{ zoom: `${documentZoom}%` }}
                >
                  {viewDocument.filename?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    // Image preview
                    <div className='flex flex-col items-center justify-center h-full'>
                      <img
                        src={`http://localhost:3001/mock-documents/${viewDocument.filename}`}
                        alt={viewDocument.name}
                        className='max-w-full max-h-full object-contain'
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';

                          // Add fallback text
                          const fallbackDiv = document.createElement('div');
                          fallbackDiv.className =
                            'text-center mt-4 flex flex-col items-center';
                          fallbackDiv.innerHTML = `
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4">
                              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                              <polyline points="13 2 13 9 20 9"></polyline>
                            </svg>
                            <p class="text-amber-600 font-medium">Image preview not available</p>
                            <p class="text-sm text-gray-500 mt-2">The document can still be downloaded</p>
                          `;
                          e.target.parentNode.appendChild(fallbackDiv);
                        }}
                      />
                    </div>
                  ) : viewDocument.filename?.endsWith('.pdf') ? (
                    // Embed PDF directly using iframe for better compatibility
                    <div className='w-full h-full flex flex-col'>
                      <iframe
                        src={`http://localhost:3001/mock-documents/${viewDocument.filename}`}
                        title={viewDocument.name}
                        className='w-full h-full border-0'
                        onError={(e) => {
                          console.error('PDF loading error:', e);
                          // Fallback if iframe fails
                          const container = e.target.parentNode;
                          if (container) {
                            container.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                  <polyline points="14 2 14 8 20 8"></polyline>
                                  <path d="M9 15L15 15"></path>
                                  <path d="M9 11L15 11"></path>
                                </svg>
                                <h3 class="text-lg font-medium text-gray-800 mb-2">${viewDocument.filename}</h3>
                                <p class="text-sm text-gray-600 mb-4">PDF Document</p>
                                <p class="text-center text-sm text-gray-600 mb-6 max-w-md">
                                  PDF preview could not be loaded. You can still download the document to view it.
                                </p>
                                <button class="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 mb-4" onclick="handleDownloadDocument()">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                  </svg>
                                  Download Document
                                </button>
                              </div>
                            `;
                          }
                        }}
                      />
                      <Button
                        className='gap-2 my-2 mx-auto'
                        onClick={() => handleDownloadDocument(viewDocument)}
                      >
                        <Download className='h-4 w-4' />
                        Download Document
                      </Button>
                    </div>
                  ) : (
                    // Default document icon
                    <div className='flex flex-col items-center justify-center'>
                      <FileText className='w-16 h-16 text-gray-400 mb-4' />
                      <p className='text-gray-600 mb-2'>
                        {viewDocument.filename || 'No file available'}
                      </p>
                      {viewDocument.filename ? (
                        <p className='text-sm text-gray-500 mb-4'>
                          {viewDocument.filename
                            .split('.')
                            .pop()
                            ?.toUpperCase() || 'Unknown'}{' '}
                          Document
                        </p>
                      ) : (
                        <p className='text-sm text-amber-600 mb-4'>
                          No document file has been uploaded
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className='flex justify-center gap-3 mt-3'>
                  <Button
                    variant='outline'
                    className='gap-2'
                    onClick={() => {
                      const rotation = viewDocument.rotation || 0;
                      const updatedDocuments = documents.map((doc) =>
                        doc.id === viewDocument.id
                          ? { ...doc, rotation: (rotation - 90) % 360 }
                          : doc
                      );
                      setDocuments(updatedDocuments);
                      setViewDocument({
                        ...viewDocument,
                        rotation: (rotation - 90) % 360,
                      });
                    }}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'></path>
                      <path d='M3 3v5h5'></path>
                    </svg>
                    Rotate Left
                  </Button>

                  <Button
                    variant='outline'
                    className='gap-2'
                    onClick={() => {
                      const rotation = viewDocument.rotation || 0;
                      const updatedDocuments = documents.map((doc) =>
                        doc.id === viewDocument.id
                          ? { ...doc, rotation: (rotation + 90) % 360 }
                          : doc
                      );
                      setDocuments(updatedDocuments);
                      setViewDocument({
                        ...viewDocument,
                        rotation: (rotation + 90) % 360,
                      });
                    }}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='16'
                      height='16'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    >
                      <path d='M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8'></path>
                      <path d='M21 3v5h-5'></path>
                    </svg>
                    Rotate Right
                  </Button>

                  <Button
                    className='gap-2'
                    onClick={() => handleDownloadDocument(viewDocument)}
                    disabled={!viewDocument.filename}
                    title={
                      !viewDocument.filename
                        ? 'No file available to download'
                        : 'Download document'
                    }
                  >
                    <Download className='h-4 w-4' />
                    Download
                  </Button>
                </div>
              </div>

              {/* Verification Controls (only in verify mode) */}
              {documentPreviewMode === 'verify' && (
                <div className='w-full md:w-1/3 space-y-4'>
                  <Card>
                    <CardHeader className='pb-2'>
                      <CardTitle className='text-lg'>
                        Verification Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium'>Comments</label>
                        <textarea
                          className='w-full p-2 border rounded-md text-sm min-h-[80px]'
                          placeholder='Add verification comments...'
                          value={verificationComment}
                          onChange={(e) =>
                            setVerificationComment(e.target.value)
                          }
                        />
                      </div>

                      <div className='grid grid-cols-2 gap-2'>
                        <Button
                          variant='outline'
                          className='border-red-300 hover:border-red-500 hover:bg-red-50 text-red-700'
                          onClick={() =>
                            setRejectionReason(
                              window.document.getElementById('rejection-reason')
                                .value
                            )
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          className='bg-green-600 hover:bg-green-700'
                          onClick={handleAcceptDocument}
                        >
                          Accept
                        </Button>
                      </div>

                      {/* Rejection Reason Dialog */}
                      {rejectionReason !== '' && (
                        <div className='space-y-2 mt-4 border-t pt-3'>
                          <label className='text-sm font-medium text-red-700'>
                            Rejection Reason
                          </label>
                          <select
                            id='rejection-reason'
                            className='w-full p-2 border border-red-200 rounded-md text-sm'
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                          >
                            <option value=''>Select a reason...</option>
                            <option value='Document is expired'>
                              Document is expired
                            </option>
                            <option value='Document is unclear or illegible'>
                              Document is unclear or illegible
                            </option>
                            <option value='Document is incomplete'>
                              Document is incomplete
                            </option>
                            <option value='Information does not match records'>
                              Information does not match records
                            </option>
                            <option value='Document appears to be modified'>
                              Document appears to be modified
                            </option>
                            <option value='Wrong document type uploaded'>
                              Wrong document type uploaded
                            </option>
                          </select>

                          <div className='flex justify-end gap-2 mt-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setRejectionReason('')}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant='destructive'
                              size='sm'
                              onClick={handleRejectDocument}
                              disabled={!rejectionReason}
                            >
                              Confirm Rejection
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Document Metadata */}
              {documentPreviewMode === 'view' && (
                <div className='mt-4 space-y-2'>
                  <div className='flex justify-between py-2 border-b'>
                    <span className='text-sm font-medium text-gray-500'>
                      Document Type
                    </span>
                    <span className='text-sm text-gray-900 capitalize'>
                      {viewDocument.type}
                    </span>
                  </div>

                  <div className='flex justify-between py-2 border-b'>
                    <span className='text-sm font-medium text-gray-500'>
                      Status
                    </span>
                    <span>{getStatusBadge(viewDocument.status)}</span>
                  </div>

                  <div className='flex justify-between py-2 border-b'>
                    <span className='text-sm font-medium text-gray-500'>
                      Upload Date
                    </span>
                    <span className='text-sm text-gray-900'>
                      {format(
                        parseISO(viewDocument.uploadDate),
                        'MMMM d, yyyy'
                      )}
                    </span>
                  </div>

                  {viewDocument.expiryDate && (
                    <div className='flex justify-between py-2 border-b'>
                      <span className='text-sm font-medium text-gray-500'>
                        Expiry Date
                      </span>
                      <span className='text-sm text-gray-900'>
                        {format(
                          parseISO(viewDocument.expiryDate),
                          'MMMM d, yyyy'
                        )}
                      </span>
                    </div>
                  )}

                  {/* Verification History */}
                  {viewDocument.verificationHistory &&
                    viewDocument.verificationHistory.length > 0 && (
                      <div className='mt-4'>
                        <h4 className='text-sm font-medium text-gray-700 mb-2'>
                          Verification History
                        </h4>
                        <div className='space-y-3'>
                          {viewDocument.verificationHistory.map(
                            (history, index) => (
                              <div
                                key={index}
                                className='border-l-2 pl-3 pb-3 relative'
                                style={{
                                  borderColor:
                                    history.status === 'verified'
                                      ? '#22c55e'
                                      : history.status === 'rejected'
                                        ? '#ef4444'
                                        : '#f59e0b',
                                }}
                              >
                                <div
                                  className='absolute -left-1.5 top-0 w-3 h-3 rounded-full'
                                  style={{
                                    backgroundColor:
                                      history.status === 'verified'
                                        ? '#22c55e'
                                        : history.status === 'rejected'
                                          ? '#ef4444'
                                          : '#f59e0b',
                                  }}
                                ></div>
                                <p className='text-xs text-gray-500'>
                                  {format(
                                    parseISO(history.date),
                                    'MMM d, yyyy h:mm a'
                                  )}
                                </p>
                                <p className='text-sm font-medium capitalize'>
                                  Status: {history.status}
                                </p>
                                {history.comment && (
                                  <p className='text-sm text-gray-600 mt-1'>
                                    {history.comment}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {/* Rejection Reason */}
                  {viewDocument.status === 'rejected' &&
                    viewDocument.rejectionReason && (
                      <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                        <h4 className='text-sm font-medium text-red-700 mb-1'>
                          Rejection Reason
                        </h4>
                        <p className='text-sm text-red-600'>
                          {viewDocument.rejectionReason}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>

            <DialogFooter className='flex gap-2'>
              {documentPreviewMode === 'verify' ? (
                <Button
                  variant='outline'
                  onClick={() => setDocumentPreviewMode('view')}
                >
                  Cancel Verification
                </Button>
              ) : (
                <>
                  <DialogClose asChild>
                    <Button variant='outline'>Close</Button>
                  </DialogClose>
                  <Button
                    variant='default'
                    onClick={() => {
                      setViewDocument(null);
                      handleDocumentUpload(viewDocument.id);
                    }}
                  >
                    Update Document
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MaidDocumentsPage;
