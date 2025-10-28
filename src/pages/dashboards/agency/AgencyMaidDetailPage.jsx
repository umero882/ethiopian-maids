import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Flag,
  Briefcase,
  Award,
  Star,
  Edit,
  Trash,
  CheckCircle,
  Clock,
  ArrowLeft,
  MessageSquare,
  FileText,
  AlertTriangle,
  Upload,
  X,
  FileIcon,
  File,
  Paperclip,
} from 'lucide-react';

// Status badge component
const StatusBadge = ({ status }) => {
  let colorClasses = '';
  switch (status.toLowerCase()) {
    case 'active':
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
      break;
    case 'pending':
      colorClasses = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      break;
    case 'placed':
      colorClasses = 'bg-blue-100 text-blue-700 border-blue-300';
      break;
    case 'rejected':
      colorClasses = 'bg-red-100 text-red-700 border-red-300';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
  }
  return (
    <Badge variant='outline' className={`capitalize ${colorClasses}`}>
      {status}
    </Badge>
  );
};

// Skill badge component
const SkillBadge = ({ skill }) => (
  <Badge
    variant='secondary'
    className='mr-2 mb-2 bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200'
  >
    {skill}
  </Badge>
);

// Helper functions for data compatibility
import { getMaidDisplayName } from '@/lib/displayName';

const getMaidCountry = (maid) => {
  if (!maid) return 'Unknown';
  if (maid.country && typeof maid.country === 'string') return maid.country;
  if (maid.nationality && typeof maid.nationality === 'string')
    return maid.nationality;
  return 'Unknown';
};

const AgencyMaidDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [maid, setMaid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [documentType, setDocumentType] = useState('passport');
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const fetchMaid = async () => {
      try {
        const { data, error } = await agencyService.getAgencyMaidById(id);

        if (error) {
          setError(error);
          toast({
            title: 'Error loading maid details',
            description:
              error.message || 'An error occurred while loading maid details.',
            variant: 'destructive',
          });
        } else if (!data) {
          setError(new Error('Maid not found'));
          toast({
            title: 'Maid not found',
            description: 'The requested maid profile could not be found.',
            variant: 'destructive',
          });
        } else {
          setMaid(data);

          // Initialize documents if they exist in the maid data
          if (data.documents) {
            setDocuments(data.documents);
          }
        }
      } catch (err) {
        setError(err);
        toast({
          title: 'Error loading maid details',
          description: 'An unexpected error occurred.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaid();
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      toast({
        title: 'Please select a status',
        description: 'You must select a status to update.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await agencyService.updateAgencyMaid(id, {
        status: newStatus,
      });

      if (error) {
        toast({
          title: 'Error updating status',
          description:
            error.message || 'An error occurred while updating the status.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Status updated',
          description: `Maid status has been updated to ${newStatus}.`,
        });
        setMaid({ ...maid, status: newStatus });
        setStatusUpdateOpen(false);
      }
    } catch (err) {
      toast({
        title: 'Error updating status',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { data, error } = await agencyService.removeAgencyMaid(id);

      if (error) {
        toast({
          title: 'Error removing maid',
          description:
            error.message || 'An error occurred while removing the maid.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Maid removed',
          description: 'The maid has been removed from your listings.',
        });
        navigate('/dashboard/agency/maids');
      }
    } catch (err) {
      toast({
        title: 'Error removing maid',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setConfirmDeleteOpen(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      toast({
        title: 'Cannot add empty note',
        description: 'Please enter a note.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In a real implementation, we'd add this to the database
      // For now, we'll just update the local state to simulate it
      const updatedMaid = {
        ...maid,
        agencyNotes: maid.agencyNotes
          ? `${maid.agencyNotes}; ${noteText}`
          : noteText,
      };

      const { data, error } = await agencyService.updateAgencyMaid(
        id,
        updatedMaid
      );

      if (error) {
        toast({
          title: 'Error adding note',
          description:
            error.message || 'An error occurred while adding the note.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Note added',
          description: "Your note has been added to this maid's profile.",
        });
        setMaid(updatedMaid);
        setNotesDialogOpen(false);
        setNoteText('');
      }
    } catch (err) {
      toast({
        title: 'Error adding note',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // Document handling functions
  const handleFileSelect = (e) => {
    if (e.target.files.length > 0) {
      handleUploadDocument(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadDocument = async (file) => {
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 200);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create document object
      const newDocument = {
        id: Date.now().toString(),
        name: file.name,
        type: documentType,
        uploadDate: new Date().toISOString(),
        size: file.size,
        status: 'verified',
      };

      // Add document to state
      const updatedDocuments = [...documents, newDocument];
      setDocuments(updatedDocuments);

      // Update maid data with documents
      const updatedMaid = {
        ...maid,
        documents: updatedDocuments,
      };

      const { data, error } = await agencyService.updateAgencyMaid(
        id,
        updatedMaid
      );

      if (error) {
        toast({
          title: 'Error uploading document',
          description:
            error.message || 'An error occurred while uploading the document.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Document uploaded',
          description: `${file.name} has been uploaded successfully.`,
        });
        setMaid(updatedMaid);
        setDocumentDialogOpen(false);
      }
    } catch (err) {
      toast({
        title: 'Error uploading document',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      clearInterval(progressInterval);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveDocument = async (documentId) => {
    try {
      // Filter out the document to remove
      const updatedDocuments = documents.filter((doc) => doc.id !== documentId);

      // Update maid data with new documents array
      const updatedMaid = {
        ...maid,
        documents: updatedDocuments,
      };

      const { data, error } = await agencyService.updateAgencyMaid(
        id,
        updatedMaid
      );

      if (error) {
        toast({
          title: 'Error removing document',
          description:
            error.message || 'An error occurred while removing the document.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Document removed',
          description: 'The document has been removed successfully.',
        });
        setDocuments(updatedDocuments);
        setMaid(updatedMaid);
      }
    } catch (err) {
      toast({
        title: 'Error removing document',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading maid details...</p>
        </div>
      </div>
    );
  }

  if (error || !maid) {
    return (
      <div className='flex flex-col items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='bg-red-100 text-red-700 p-4 rounded-lg max-w-md'>
            <AlertTriangle className='mx-auto h-10 w-10 mb-2' />
            <p className='font-semibold'>Error loading maid details</p>
            <p>{error?.message || 'The requested maid could not be found.'}</p>
          </div>
          <Button
            onClick={() => navigate('/dashboard/agency/maids')}
            variant='outline'
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Maids
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => navigate('/dashboard/agency/maids')}
          >
            <ArrowLeft className='mr-2 h-4 w-4' /> Back
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>Maid Profile</h1>
        </div>
        <div className='flex space-x-2'>
          <Button
            variant='outline'
            onClick={() => navigate(`/dashboard/agency/maids/${id}/edit`)}
          >
            <Edit className='mr-2 h-4 w-4' /> Edit Profile
          </Button>
          <Button
            variant='destructive'
            onClick={() => setConfirmDeleteOpen(true)}
          >
            <Trash className='mr-2 h-4 w-4' /> Remove
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-1'>
          <Card className='shadow-lg border-0'>
            <CardHeader className='pb-2'>
              <div className='flex justify-between items-start'>
                <div>
                  <CardTitle className='text-2xl font-semibold text-gray-800'>
                    {getMaidDisplayName(maid)}
                  </CardTitle>
                  <CardDescription className='flex items-center mt-1'>
                    <Flag className='h-4 w-4 mr-1' /> {getMaidCountry(maid)}
                  </CardDescription>
                </div>
                <StatusBadge status={maid.status} />
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center text-gray-600'>
                <Calendar className='h-5 w-5 mr-2 text-gray-400' />
                <div>
                  <p className='text-sm font-medium'>Posted Date</p>
                  <p>{maid.postedDate}</p>
                </div>
              </div>
              <div className='flex items-center text-gray-600'>
                <Briefcase className='h-5 w-5 mr-2 text-gray-400' />
                <div>
                  <p className='text-sm font-medium'>Experience</p>
                  <p>{maid.experience}</p>
                </div>
              </div>
              <div>
                <h3 className='text-sm font-medium mb-2 text-gray-600'>
                  Skills
                </h3>
                <div className='flex flex-wrap'>
                  {maid.skills &&
                    maid.skills.map((skill, index) => (
                      <SkillBadge key={index} skill={skill} />
                    ))}
                </div>
              </div>
              <div className='pt-2'>
                <Button
                  className='w-full'
                  onClick={() => {
                    setNewStatus(maid.status);
                    setStatusUpdateOpen(true);
                  }}
                >
                  <Clock className='mr-2 h-4 w-4' /> Update Status
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className='shadow-lg border-0 mt-6'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-lg font-semibold text-gray-800'>
                Agency Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maid.agencyNotes ? (
                <div className='text-gray-700 whitespace-pre-wrap'>
                  {maid.agencyNotes.split(';').map((note, index) => (
                    <p
                      key={index}
                      className='mb-2 pb-2 border-b border-gray-100 last:border-0'
                    >
                      {note.trim()}
                    </p>
                  ))}
                </div>
              ) : (
                <p className='text-gray-500 italic'>No notes added yet.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => setNotesDialogOpen(true)}
              >
                <FileText className='mr-2 h-4 w-4' /> Add Note
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className='lg:col-span-2'>
          <Card className='shadow-lg border-0'>
            <CardHeader className='pb-2'>
              <Tabs
                defaultValue='details'
                value={activeTab}
                onValueChange={setActiveTab}
                className='w-full'
              >
                <TabsList className='grid w-full grid-cols-3'>
                  <TabsTrigger value='details'>Details</TabsTrigger>
                  <TabsTrigger value='documents'>Documents</TabsTrigger>
                  <TabsTrigger value='inquiries'>Inquiries</TabsTrigger>
                </TabsList>
                <CardContent>
                  <TabsContent value='details' className='space-y-6 mt-4'>
                    <div>
                      <h3 className='text-lg font-medium mb-3'>
                        Personal Information
                      </h3>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='space-y-1'>
                          <p className='text-sm text-gray-500'>Full Name</p>
                          <p className='font-medium'>
                            {getMaidDisplayName(maid)}
                          </p>
                        </div>
                        <div className='space-y-1'>
                          <p className='text-sm text-gray-500'>Nationality</p>
                          <p className='font-medium'>{maid.country}</p>
                        </div>
                        <div className='space-y-1'>
                          <p className='text-sm text-gray-500'>Experience</p>
                          <p className='font-medium'>{maid.experience}</p>
                        </div>
                        <div className='space-y-1'>
                          <p className='text-sm text-gray-500'>Status</p>
                          <StatusBadge status={maid.status} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-lg font-medium mb-3'>
                        Skills and Qualifications
                      </h3>
                      <div className='flex flex-wrap'>
                        {maid.skills &&
                          maid.skills.map((skill, index) => (
                            <SkillBadge key={index} skill={skill} />
                          ))}
                      </div>
                      <div className='mt-4 text-gray-700'>
                        <p className='italic'>
                          {getMaidDisplayName(maid)} has {maid.experience} of
                          experience and is skilled in{' '}
                          {maid.skills
                            ? maid.skills.join(', ')
                            : 'various areas'}
                          .
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className='text-lg font-medium mb-3'>Availability</h3>
                      <div className='bg-green-50 border border-green-200 rounded p-4 text-green-700'>
                        {maid.status === 'active' ? (
                          <p className='flex items-center'>
                            <CheckCircle className='h-5 w-5 mr-2' />
                            Available for placement
                          </p>
                        ) : maid.status === 'pending' ? (
                          <p className='flex items-center text-yellow-700'>
                            <Clock className='h-5 w-5 mr-2' />
                            Pending verification
                          </p>
                        ) : maid.status === 'placed' ? (
                          <p className='flex items-center text-blue-700'>
                            <Briefcase className='h-5 w-5 mr-2' />
                            Already placed with a sponsor
                          </p>
                        ) : (
                          <p className='flex items-center'>
                            <Clock className='h-5 w-5 mr-2' />
                            Status: {maid.status}
                          </p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value='documents' className='space-y-6 mt-4'>
                    <div className='flex justify-between items-center'>
                      <h3 className='text-lg font-medium'>Documents</h3>
                      <Button onClick={() => setDocumentDialogOpen(true)}>
                        <Upload className='h-4 w-4 mr-2' /> Upload Document
                      </Button>
                    </div>

                    {documents.length === 0 ? (
                      <div className='bg-gray-50 border border-gray-200 rounded p-8 text-center'>
                        <FileIcon className='h-12 w-12 mx-auto mb-3 text-gray-400' />
                        <h4 className='text-lg font-medium text-gray-700'>
                          No documents uploaded
                        </h4>
                        <p className='text-gray-500 max-w-md mx-auto mt-2 mb-4'>
                          Upload important documents like passport, visa,
                          medical certificates, and contracts.
                        </p>
                        <Button
                          variant='outline'
                          onClick={() => setDocumentDialogOpen(true)}
                        >
                          <Upload className='h-4 w-4 mr-2' /> Upload First
                          Document
                        </Button>
                      </div>
                    ) : (
                      <div className='space-y-4'>
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className='flex items-center justify-between p-4 border rounded-md'
                          >
                            <div className='flex items-center space-x-3'>
                              <div className='p-2 rounded-full bg-blue-100'>
                                <File className='h-6 w-6 text-blue-600' />
                              </div>
                              <div>
                                <p className='font-medium'>{doc.name}</p>
                                <div className='flex items-center text-sm text-gray-500'>
                                  <Badge variant='outline' className='mr-2'>
                                    {doc.type}
                                  </Badge>
                                  <span>
                                    {new Date(
                                      doc.uploadDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Badge
                                variant='outline'
                                className={
                                  doc.status === 'verified'
                                    ? 'bg-green-100 text-green-700 border-green-300'
                                    : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                }
                              >
                                {doc.status === 'verified'
                                  ? 'Verified'
                                  : 'Pending'}
                              </Badge>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => handleRemoveDocument(doc.id)}
                              >
                                <X className='h-4 w-4 text-gray-500' />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <h3 className='text-lg font-medium mb-3'>
                        Required Documents
                      </h3>
                      <ul className='space-y-2'>
                        <li className='flex items-center justify-between text-gray-600'>
                          <div className='flex items-center'>
                            <div className='h-2 w-2 rounded-full bg-gray-400 mr-2'></div>
                            Passport
                          </div>
                          {documents.some((doc) => doc.type === 'passport') ? (
                            <Badge
                              variant='outline'
                              className='bg-green-100 text-green-700 border-green-300'
                            >
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='bg-yellow-100 text-yellow-700 border-yellow-300'
                            >
                              Required
                            </Badge>
                          )}
                        </li>
                        <li className='flex items-center justify-between text-gray-600'>
                          <div className='flex items-center'>
                            <div className='h-2 w-2 rounded-full bg-gray-400 mr-2'></div>
                            Visa
                          </div>
                          {documents.some((doc) => doc.type === 'visa') ? (
                            <Badge
                              variant='outline'
                              className='bg-green-100 text-green-700 border-green-300'
                            >
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='bg-yellow-100 text-yellow-700 border-yellow-300'
                            >
                              Required
                            </Badge>
                          )}
                        </li>
                        <li className='flex items-center justify-between text-gray-600'>
                          <div className='flex items-center'>
                            <div className='h-2 w-2 rounded-full bg-gray-400 mr-2'></div>
                            Medical Certificate
                          </div>
                          {documents.some((doc) => doc.type === 'medical') ? (
                            <Badge
                              variant='outline'
                              className='bg-green-100 text-green-700 border-green-300'
                            >
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='bg-yellow-100 text-yellow-700 border-yellow-300'
                            >
                              Required
                            </Badge>
                          )}
                        </li>
                        <li className='flex items-center justify-between text-gray-600'>
                          <div className='flex items-center'>
                            <div className='h-2 w-2 rounded-full bg-gray-400 mr-2'></div>
                            Employment Contract
                          </div>
                          {documents.some((doc) => doc.type === 'contract') ? (
                            <Badge
                              variant='outline'
                              className='bg-green-100 text-green-700 border-green-300'
                            >
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='bg-yellow-100 text-yellow-700 border-yellow-300'
                            >
                              Required
                            </Badge>
                          )}
                        </li>
                        <li className='flex items-center justify-between text-gray-600'>
                          <div className='flex items-center'>
                            <div className='h-2 w-2 rounded-full bg-gray-400 mr-2'></div>
                            Training Certificates
                          </div>
                          {documents.some((doc) => doc.type === 'training') ? (
                            <Badge
                              variant='outline'
                              className='bg-green-100 text-green-700 border-green-300'
                            >
                              Uploaded
                            </Badge>
                          ) : (
                            <Badge
                              variant='outline'
                              className='bg-yellow-100 text-yellow-700 border-yellow-300'
                            >
                              Required
                            </Badge>
                          )}
                        </li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value='inquiries' className='space-y-6 mt-4'>
                    <div className='bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-700'>
                      <p className='flex items-center'>
                        <AlertTriangle className='h-5 w-5 mr-2' />
                        No sponsor inquiries found for this maid.
                      </p>
                    </div>

                    <div className='text-center py-8'>
                      <MessageSquare className='h-12 w-12 text-gray-300 mx-auto mb-3' />
                      <h3 className='text-lg font-medium text-gray-700'>
                        No Inquiries Yet
                      </h3>
                      <p className='text-gray-500 max-w-md mx-auto mt-2'>
                        When sponsors inquire about this maid, you'll see their
                        messages and contact information here.
                      </p>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Update Maid Status</DialogTitle>
            <DialogDescription>
              Change the current status of {getMaidDisplayName(maid)}.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='flex items-center space-x-4'>
              <Button
                variant={newStatus === 'active' ? 'default' : 'outline'}
                className={
                  newStatus === 'active'
                    ? 'bg-green-600 hover:bg-green-700'
                    : ''
                }
                onClick={() => setNewStatus('active')}
              >
                Active
              </Button>
              <Button
                variant={newStatus === 'pending' ? 'default' : 'outline'}
                className={
                  newStatus === 'pending'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : ''
                }
                onClick={() => setNewStatus('pending')}
              >
                Pending
              </Button>
              <Button
                variant={newStatus === 'placed' ? 'default' : 'outline'}
                className={
                  newStatus === 'placed' ? 'bg-blue-600 hover:bg-blue-700' : ''
                }
                onClick={() => setNewStatus('placed')}
              >
                Placed
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setStatusUpdateOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>Update Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Remove Maid Listing</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {getMaidDisplayName(maid)} from
              your agency listings? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              Remove Listing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Add Agency Note</DialogTitle>
            <DialogDescription>
              Add an internal note about {getMaidDisplayName(maid)}. These notes
              are only visible to agency staff.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <Textarea
              placeholder='Enter your note here...'
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className='min-h-[100px]'
            />
          </div>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setNotesDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleAddNote}>Add Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Document Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Upload important documents for {getMaidDisplayName(maid)}'s
              profile.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='documentType'>Document Type</Label>
              <select
                id='documentType'
                className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <option value='passport'>Passport</option>
                <option value='visa'>Visa</option>
                <option value='medical'>Medical Certificate</option>
                <option value='contract'>Employment Contract</option>
                <option value='training'>Training Certificate</option>
                <option value='other'>Other Document</option>
              </select>
            </div>

            <div className='space-y-2'>
              <Label>Upload File</Label>

              {uploading ? (
                <div className='space-y-2'>
                  <Progress value={uploadProgress} className='h-2 w-full' />
                  <p className='text-sm text-gray-500 text-center'>
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              ) : (
                <div
                  className='border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:bg-gray-50'
                  onClick={handleUploadClick}
                >
                  <input
                    type='file'
                    ref={fileInputRef}
                    className='hidden'
                    onChange={handleFileSelect}
                  />
                  <Upload className='h-10 w-10 text-gray-400 mx-auto mb-3' />
                  <p className='text-sm font-medium text-gray-700'>
                    Click to upload
                  </p>
                  <p className='text-xs text-gray-500 mt-1'>
                    PDF, JPG, or PNG files
                  </p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='secondary'
              onClick={() => setDocumentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUploadClick} disabled={uploading}>
              {uploading ? (
                <>
                  <span className='mr-2'>Uploading...</span>
                  <Clock className='h-4 w-4 animate-spin' />
                </>
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-2' />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyMaidDetailPage;
