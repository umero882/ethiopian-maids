import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  User,
  Building2,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Calendar,
  Award,
  AlertCircle,
  Target,
  Users,
  BookOpen,
  FileCheck,
  Plus
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import AgencyDashboardService from '@/services/agencyDashboardService';
import { useAuth } from '@/contexts/AuthContext';

const AgencyDocumentsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [documents, setDocuments] = useState([]);
  const [complianceChecklist, setComplianceChecklist] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerTypeFilter, setOwnerTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Dialogs
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Form data
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: 'passport',
    owner_type: 'maid',
    owner_name: '',
    file: null
  });

  const [verifyForm, setVerifyForm] = useState({
    status: 'verified',
    notes: ''
  });

  const agencyId = user?.agency_id || 'mock_agency_001';

  useEffect(() => {
    loadData();
  }, [agencyId]);

  useEffect(() => {
    applyFilters();
  }, [documents, statusFilter, typeFilter, ownerTypeFilter, searchTerm]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [docsData, complianceData] = await Promise.all([
        AgencyDashboardService.getDocumentsWithFilters(agencyId),
        AgencyDashboardService.getComplianceChecklist(agencyId)
      ]);
      setDocuments(docsData || []);
      setComplianceChecklist(complianceData || []);
    } catch (error) {
      console.error('Failed to load documents data:', error);
      setDocuments([]);
      setComplianceChecklist([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = documents;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter);
    }

    if (ownerTypeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.owner_type === ownerTypeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.owner_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  };

  const handleUploadDocument = async () => {
    try {
      const document = await AgencyDashboardService.uploadDocument(uploadForm, agencyId);
      setDocuments(prev => [document, ...prev]);
      setIsUploadDialogOpen(false);
      setUploadForm({
        title: '',
        description: '',
        document_type: 'passport',
        owner_type: 'maid',
        owner_name: '',
        file: null
      });
    } catch (error) {
      console.error('Failed to upload document:', error);
    }
  };

  const handleVerifyDocument = async () => {
    if (!selectedDocument) return;

    try {
      await AgencyDashboardService.updateDocumentStatus(
        selectedDocument.id,
        verifyForm.status,
        verifyForm.notes,
        agencyId
      );

      setDocuments(prev => prev.map(doc =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              status: verifyForm.status,
              verification_status: verifyForm.status === 'rejected' ? 'rejected' : verifyForm.status === 'verified' ? 'approved' : 'pending',
              notes: verifyForm.notes,
              verified_at: verifyForm.status === 'verified' ? new Date().toISOString().split('T')[0] : null
            }
          : doc
      ));

      setIsVerifyDialogOpen(false);
      setSelectedDocument(null);
      setVerifyForm({ status: 'verified', notes: '' });
    } catch (error) {
      console.error('Failed to verify document:', error);
    }
  };

  const updateComplianceItem = async (itemId, status) => {
    try {
      await AgencyDashboardService.updateComplianceItem(itemId, status, agencyId);

      setComplianceChecklist(prev => prev.map(category => ({
        ...category,
        items: category.items.map(item =>
          item.id === itemId ? { ...item, status } : item
        ),
        completed_items: category.items.filter(item =>
          item.id === itemId ? status === 'completed' : item.status === 'completed'
        ).length,
        compliance_percentage: Math.round(
          (category.items.filter(item =>
            item.id === itemId ? status === 'completed' : item.status === 'completed'
          ).length / category.total_items) * 100
        )
      })));
    } catch (error) {
      console.error('Failed to update compliance item:', error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      expiring_soon: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      missing_info: { color: 'bg-purple-100 text-purple-800', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.pending_review;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getComplianceStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      in_progress: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle },
      overdue: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} px-2 py-1 text-xs font-medium`}>
        <IconComponent className="h-3 w-3 mr-1" />
        {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
      </Badge>
    );
  };

  const getDocumentTypeIcon = (type) => {
    const iconMap = {
      passport: Shield,
      medical_certificate: Award,
      sponsor_license: FileCheck,
      national_id: User,
      contract: BookOpen,
      agency_license: Building2,
      experience_letter: FileText
    };

    const IconComponent = iconMap[type] || FileText;
    return <IconComponent className="h-5 w-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysDiff = (expiry - today) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30 && daysDiff > 0;
  };

  const DocumentCard = ({ document }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              {getDocumentTypeIcon(document.document_type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{document.title}</h4>
              <p className="text-sm text-gray-500 capitalize">
                {document.document_type.replace('_', ' ')} • {document.owner_name}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setSelectedDocument(document);
                  setVerifyForm({
                    status: document.status === 'verified' ? 'rejected' : 'verified',
                    notes: document.notes || ''
                  });
                  setIsVerifyDialogOpen(true);
                }}
              >
                {document.status === 'verified' ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    <span className="text-red-600">Reject</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-green-600">Verify</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            {getStatusBadge(document.status)}
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {formatDate(document.uploaded_at)}
            </div>
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>File Size:</span>
              <span>{document.file_size}</span>
            </div>
            {document.expires_at && (
              <div className="flex items-center justify-between">
                <span>Expires:</span>
                <span className={isExpiringSoon(document.expires_at) ? 'text-orange-600 font-medium' : ''}>
                  {formatDate(document.expires_at)}
                </span>
              </div>
            )}
            {document.verified_by && (
              <div className="flex items-center justify-between">
                <span>Verified by:</span>
                <span>{document.verified_by.name}</span>
              </div>
            )}
          </div>

          {document.notes && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-700">
              {document.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ComplianceSection = ({ category }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{category.title}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{category.category}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2">
              <Badge variant={category.priority === 'critical' ? 'destructive' : 'outline'}>
                {category.priority}
              </Badge>
              <span className="text-2xl font-bold text-gray-900">
                {category.compliance_percentage}%
              </span>
            </div>
            <Progress value={category.compliance_percentage} className="w-20 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {category.items.map(item => (
            <div key={item.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h5 className="font-medium text-gray-900">{item.requirement}</h5>
                  {getComplianceStatusBadge(item.status)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Responsible: {item.responsible}</span>
                  {item.due_date && (
                    <span className={new Date(item.due_date) < new Date() ? 'text-red-600' : ''}>
                      Due: {formatDate(item.due_date)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-1 ml-3">
                {item.status !== 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateComplianceItem(item.id, 'completed')}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                {item.status === 'completed' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateComplianceItem(item.id, 'pending')}
                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  // Stats calculations
  const totalDocuments = documents.length;
  const pendingDocuments = documents.filter(d => d.status === 'pending_review').length;
  const verifiedDocuments = documents.filter(d => d.status === 'verified').length;
  const expiringDocuments = documents.filter(d => isExpiringSoon(d.expires_at)).length;
  const overallCompliance = Math.round(
    complianceChecklist.reduce((sum, category) => sum + category.compliance_percentage, 0) /
    (complianceChecklist.length || 1)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents & Compliance</h1>
        <p className="text-gray-600 mt-1">Manage documents and track regulatory compliance</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>

          <div className="flex space-x-2">
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
                <p className="text-sm text-gray-600">Total Documents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{pendingDocuments}</p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{verifiedDocuments}</p>
                <p className="text-sm text-gray-600">Verified</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold text-gray-900">{overallCompliance}%</p>
                <p className="text-sm text-gray-600">Compliance</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
                  Documents Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                {[...documents.filter(d => d.status === 'pending_review' || d.status === 'rejected' || d.status === 'missing_info')].slice(0, 5).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">All documents are up to date</p>
                ) : (
                  <div className="space-y-3">
                    {[...documents.filter(d => d.status === 'pending_review' || d.status === 'rejected' || d.status === 'missing_info')].slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                          <p className="text-sm text-gray-600">{doc.owner_name}</p>
                        </div>
                        {getStatusBadge(doc.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-red-600" />
                  Expiring Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expiringDocuments === 0 ? (
                  <p className="text-gray-500 text-center py-4">No documents expiring soon</p>
                ) : (
                  <div className="space-y-3">
                    {documents.filter(d => isExpiringSoon(d.expires_at)).slice(0, 5).map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{doc.title}</h4>
                          <p className="text-sm text-orange-600">
                            Expires: {formatDate(doc.expires_at)}
                          </p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-800">
                          Expiring Soon
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Compliance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {complianceChecklist.map(category => (
                  <div key={category.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{category.title}</h4>
                      <Badge variant={category.priority === 'critical' ? 'destructive' : 'outline'}>
                        {category.priority}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{category.compliance_percentage}%</span>
                      </div>
                      <Progress value={category.compliance_percentage} />
                      <p className="text-xs text-gray-500">
                        {category.completed_items} of {category.total_items} items completed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending_review">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expiring_soon">Expiring</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <FileText className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="medical_certificate">Medical</SelectItem>
                  <SelectItem value="sponsor_license">License</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>

              <Select value={ownerTypeFilter} onValueChange={setOwnerTypeFilter}>
                <SelectTrigger className="w-32">
                  <Users className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Owners</SelectItem>
                  <SelectItem value="maid">Maids</SelectItem>
                  <SelectItem value="sponsor">Sponsors</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                      <div className="h-3 w-full bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || ownerTypeFilter !== 'all'
                    ? 'No documents match your current filters.'
                    : 'Start by uploading your first document.'}
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map(document => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {complianceChecklist.map(category => (
            <ComplianceSection key={category.id} category={category} />
          ))}
        </TabsContent>
      </Tabs>

      {/* Upload Document Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload New Document</DialogTitle>
            <DialogDescription>
              Upload a new document for verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="doc-title">Document Title</Label>
              <Input
                id="doc-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-description">Description</Label>
              <Textarea
                id="doc-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter document description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="doc-type">Document Type</Label>
                <Select value={uploadForm.document_type} onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                    <SelectItem value="sponsor_license">Sponsor License</SelectItem>
                    <SelectItem value="national_id">National ID</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="experience_letter">Experience Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="owner-type">Owner Type</Label>
                <Select value={uploadForm.owner_type} onValueChange={(value) => setUploadForm(prev => ({ ...prev, owner_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maid">Maid</SelectItem>
                    <SelectItem value="sponsor">Sponsor</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner-name">Owner Name</Label>
              <Input
                id="owner-name"
                value={uploadForm.owner_name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, owner_name: e.target.value }))}
                placeholder="Enter owner name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-file">File</Label>
              <Input
                id="doc-file"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files[0] }))}
              />
              <p className="text-xs text-gray-500">
                Accepted formats: PDF, JPG, PNG. Max size: 10MB
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={!uploadForm.title || !uploadForm.owner_name}
            >
              Upload Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Document Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
            <DialogDescription>
              {selectedDocument?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verify-status">Status</Label>
              <Select value={verifyForm.status} onValueChange={(value) => setVerifyForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="missing_info">Missing Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-notes">Verification Notes</Label>
              <Textarea
                id="verify-notes"
                value={verifyForm.notes}
                onChange={(e) => setVerifyForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Enter verification notes or feedback..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyDocument}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgencyDocumentsPage;
