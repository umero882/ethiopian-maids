import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAgencyMaids } from '@/hooks/useAgencyMaids';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getMaidDisplayName } from '@/lib/displayName';
import {
  FilePlus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal,
  User,
  MapPin,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  FileText,
  X,
  Upload,
  RefreshCw,
  Info,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

// Helper function to get initials from name for avatar fallback
const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'M';

  try {
    return (
      name
        .trim()
        .split(' ')
        .filter((part) => part && part.length > 0)
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'M'
    );
  } catch (error) {
    return 'M';
  }
};

// Helper function to get primary image URL for a maid
const getPrimaryImageUrl = (maid) => {
  if (!maid || typeof maid !== 'object') return null;

  // Check if maid has images array
  if (maid.images && Array.isArray(maid.images) && maid.images.length > 0) {
    // Find primary image
    const primaryImage = maid.images.find(
      (img) => img && typeof img === 'object' && img.is_primary === true
    );
    if (
      primaryImage &&
      typeof primaryImage.file_url === 'string' &&
      primaryImage.file_url.trim()
    ) {
      return primaryImage.file_url;
    }

    // If no primary image, return first image
    const firstImage = maid.images[0];
    if (
      firstImage &&
      typeof firstImage === 'object' &&
      typeof firstImage.file_url === 'string' &&
      firstImage.file_url.trim()
    ) {
      return firstImage.file_url;
    }
  }

  // Check for legacy profileImageUrl field
  if (typeof maid.profileImageUrl === 'string' && maid.profileImageUrl.trim()) {
    return maid.profileImageUrl;
  }

  // Check for legacy image field
  if (typeof maid.image === 'string' && maid.image.trim()) {
    return maid.image;
  }

  return null;
};

// Use shared getMaidDisplayName from displayName util

// Helper function to get maid country
const getMaidCountry = (maid) => {
  if (!maid) return 'Unknown';
  if (maid.country && typeof maid.country === 'string') return maid.country;
  if (maid.nationality && typeof maid.nationality === 'string')
    return maid.nationality;
  return 'Unknown';
};

// Re-use the StatusBadge component
const StatusBadge = ({ status }) => {
  // Handle undefined/null status and ensure it's a string
  const safeStatus = status && typeof status === 'string' ? status : 'unknown';
  let colorClasses = '';

  switch (safeStatus.toLowerCase()) {
    case 'active':
      colorClasses = 'bg-green-100 text-green-700 border-green-300';
      break;
    case 'pending':
      colorClasses = 'bg-yellow-100 text-yellow-700 border-yellow-300';
      break;
    case 'placed':
      colorClasses = 'bg-blue-100 text-blue-700 border-blue-300';
      break;
    case 'new':
      colorClasses = 'bg-purple-100 text-purple-700 border-purple-300';
      break;
    case 'contacted':
      colorClasses = 'bg-indigo-100 text-indigo-700 border-indigo-300';
      break;
    case 'rejected':
      colorClasses = 'bg-red-100 text-red-700 border-red-300';
      break;
    default:
      colorClasses = 'bg-gray-100 text-gray-700 border-gray-300';
  }
  return (
    <Badge variant='outline' className={`capitalize ${colorClasses}`}>
      {safeStatus}
    </Badge>
  );
};

const AgencyMaidsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Use the new hook with Clean Architecture
  const {
    maids: maidListings,
    loading,
    error: hookError,
    pagination,
    filters,
    updateFilters,
    deleteMaid: deleteMaidUseCase,
    refresh,
    nextPage,
    prevPage,
    goToPage
  } = useAgencyMaids();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nationalityFilter, setNationalityFilter] = useState([]);
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [selectedMaid, setSelectedMaid] = useState(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);

  // Local pagination for client-side filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [maidToDelete, setMaidToDelete] = useState(null);

  // Show toast for hook errors
  useEffect(() => {
    if (hookError) {
      toast({
        title: 'Error loading maid listings',
        description: hookError,
        variant: 'destructive',
      });
    }
  }, [hookError]);

  const fetchMaids = useCallback(async (showToast = false) => {
    try {
      await refresh();

      if (showToast) {
        const count = maidListings?.length || 0;
        toast({
          title: 'Refreshed maid listings',
          description: `${count} maid${count === 1 ? '' : 's'} loaded.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error loading maid listings',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  }, [refresh, maidListings]);

  // Remove this useEffect since the hook already loads maids on mount
  // useEffect(() => {
  //   fetchMaids();
  // }, [fetchMaids]);

  const handleMaidAction = async (action, maidId, maid = null) => {
    try {
      switch (action) {
        case 'View':
          if (maid) {
            setSelectedMaid(maid);
            setDetailDrawerOpen(true);
          } else {
            navigate(`/dashboard/agency/maids/${maidId}`);
          }
          break;

        case 'QuickView':
          if (maid) {
            setSelectedMaid(maid);
            setDetailDrawerOpen(true);
          }
          break;

        case 'Edit':
          navigate(`/dashboard/agency/maids/${maidId}/edit`);
          break;

        case 'Remove':
          setMaidToDelete({ id: maidId, maid });
          setDeleteDialogOpen(true);
          break;

        default:
          toast({
            title: `${action} Maid (ID: ${maidId})`,
            description: 'This specific action is still under development.',
          });
      }
    } catch (error) {
      toast({
        title: 'Error processing action',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  // Handle delete confirmation - using Clean Architecture use-case
  const confirmDeleteMaid = async () => {
    if (!maidToDelete) return;

    try {
      const success = await deleteMaidUseCase(
        maidToDelete.id,
        'Removed from agency dashboard',
        false // Soft delete (archive)
      );

      if (success) {
        toast({
          title: 'Maid removed successfully',
          description: 'The maid has been archived from your listings.',
        });
      } else {
        toast({
          title: 'Error removing maid',
          description: 'Failed to remove the maid. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error removing maid',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setMaidToDelete(null);
    }
  };

  // Export maids to CSV
  const exportToCSV = () => {
    if (filteredMaids.length === 0) {
      toast({
        title: 'No data to export',
        description: 'There are no maids to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Name',
      'Country',
      'Status',
      'Verification',
      'Experience (Years)',
      'Skills',
      'Documents Status',
      'Phone',
      'Passport Number',
    ];

    const csvData = filteredMaids.map((maid) => [
      getMaidDisplayName(maid),
      getMaidCountry(maid),
      maid.status || maid.availability_status || '',
      maid.verification_status || '',
      maid.experience_years || maid.experience || 0,
      maid.skills ? maid.skills.join('; ') : '',
      maid.documentsStatus || '',
      maid.phone_number || '',
      maid.passport_number || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `agency-maids-${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export successful',
      description: `${filteredMaids.length} maid records exported to CSV.`,
    });
  };

  // Helper function to get available nationalities
  const getAvailableNationalities = () => {
    const nationalities = new Set();
    maidListings.forEach(maid => {
      const nationality = getMaidCountry(maid);
      if (nationality && nationality !== 'Unknown') {
        nationalities.add(nationality);
      }
    });
    return Array.from(nationalities).sort();
  };

  // Sort newest first (by created_at, then updated_at, then id)
  const sortedMaids = useMemo(() => {
    const list = Array.isArray(maidListings) ? [...maidListings] : [];
    return list.sort((a, b) => {
      const ac = a?.created_at ? Date.parse(a.created_at) : 0;
      const bc = b?.created_at ? Date.parse(b.created_at) : 0;
      if (bc !== ac) return bc - ac;
      const au = a?.updated_at ? Date.parse(a.updated_at) : 0;
      const bu = b?.updated_at ? Date.parse(b.updated_at) : 0;
      if (bu !== au) return bu - au;
      const ai = typeof a?.id === 'number' ? a.id : 0;
      const bi = typeof b?.id === 'number' ? b.id : 0;
      return bi - ai;
    });
  }, [maidListings]);

  // Enhanced filter and search logic
  const filteredMaids = sortedMaids.filter((maid) => {
    // Ensure maid object exists
    if (!maid) return false;

    const displayName = getMaidDisplayName(maid);
    const country = getMaidCountry(maid);

    // Safe search term handling - ensure all values are strings
    const safeSearchTerm =
      searchTerm && typeof searchTerm === 'string'
        ? searchTerm.toLowerCase()
        : '';
    const safeDisplayName =
      displayName && typeof displayName === 'string'
        ? displayName.toLowerCase()
        : '';
    const safeCountry =
      country && typeof country === 'string' ? country.toLowerCase() : '';

    const matchesSearch =
      safeSearchTerm === '' ||
      safeDisplayName.includes(safeSearchTerm) ||
      safeCountry.includes(safeSearchTerm) ||
      (maid.skills && maid.skills.some(skill =>
        skill.toLowerCase().includes(safeSearchTerm)
      ));

    // Status filtering
    const safeStatus =
      maid.status && typeof maid.status === 'string'
        ? maid.status.toLowerCase()
        : maid.availability_status && typeof maid.availability_status === 'string'
        ? maid.availability_status.toLowerCase()
        : '';
    const safeStatusFilter =
      statusFilter && typeof statusFilter === 'string'
        ? statusFilter.toLowerCase()
        : 'all';

    const matchesStatus =
      safeStatusFilter === 'all' || safeStatus === safeStatusFilter;

    // Nationality filtering
    const matchesNationality =
      nationalityFilter.length === 0 ||
      nationalityFilter.includes(country);

    // Verification filtering
    const safeVerificationStatus =
      maid.verification_status && typeof maid.verification_status === 'string'
        ? maid.verification_status.toLowerCase()
        : '';
    const matchesVerification =
      verificationFilter === 'all' ||
      safeVerificationStatus === verificationFilter;

    // Experience filtering
    const experienceYears = maid.experience_years || maid.experience || 0;
    const matchesExperience = (() => {
      switch (experienceFilter) {
        case 'entry': return experienceYears < 2;
        case 'experienced': return experienceYears >= 2 && experienceYears < 5;
        case 'senior': return experienceYears >= 5;
        case 'all':
        default: return true;
      }
    })();

    return matchesSearch && matchesStatus && matchesNationality &&
           matchesVerification && matchesExperience;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMaids.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMaids = filteredMaids.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, nationalityFilter, verificationFilter, experienceFilter]);

  if (loading) {
    return (
      <div className='flex items-center justify-center h-full p-10'>
        <div className='text-center space-y-4'>
          <div className='animate-spin rounded-full h-10 w-10 border-b-2 border-purple-700 mx-auto'></div>
          <p className='text-gray-600'>Loading maid listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <h1 className='text-3xl font-bold text-gray-800'>
          Maid Listings <span className='ml-2 text-gray-500 text-xl'>({maidListings.length})</span>
        </h1>
        <div className='flex items-center gap-2 flex-wrap'>
          <Button
            variant='outline'
            size='lg'
            className='text-gray-700 border-gray-300 hover:bg-gray-50'
            onClick={() => fetchMaids(true)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span className='hidden sm:inline'>Refresh</span>
          </Button>
          <Button
            variant='outline'
            size='lg'
            className='text-gray-700 border-gray-300 hover:bg-gray-50'
            onClick={exportToCSV}
            disabled={filteredMaids.length === 0}
          >
            <Download className='mr-2 h-5 w-5' />
            <span className='hidden sm:inline'>Export</span>
          </Button>
          <Button
            asChild
            variant='outline'
            size='lg'
            className='text-gray-700 border-gray-300 hover:bg-gray-50'
          >
            <Link to='/dashboard/agency/maids/bulk-upload'>
              <Upload className='mr-2 h-5 w-5' />
              <span className='hidden sm:inline'>Bulk Upload</span>
            </Link>
          </Button>
          <Button
            asChild
            size='lg'
            className='bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all'
          >
            <Link to='/dashboard/agency/maids/add'>
              <FilePlus className='mr-2 h-5 w-5' /> Add New Maid
            </Link>
          </Button>
        </div>
      </div>

      <Card className='shadow-lg border-0'>
        <CardHeader className='pb-2'>
          <CardTitle className='text-xl font-semibold text-gray-800'>
            All Maids
          </CardTitle>
          <CardDescription>Manage all your maid profiles.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Enhanced Search and Filters */}
          <div className='space-y-4 mb-6'>
            <div className='flex flex-col lg:flex-row gap-4'>
              <div className='relative flex-1'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                <Input
                  placeholder='Search by name, country, or skills...'
                  className='pl-9'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className='flex flex-wrap gap-2'>
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='available'>Available</SelectItem>
                    <SelectItem value='placed'>Placed</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Verification Filter */}
                <Select value={verificationFilter} onValueChange={setVerificationFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Verification' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Verification</SelectItem>
                    <SelectItem value='verified'>Verified</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='rejected'>Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Experience Filter */}
                <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                  <SelectTrigger className='w-40'>
                    <SelectValue placeholder='Experience' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Experience</SelectItem>
                    <SelectItem value='entry'>Entry Level (&lt;2y)</SelectItem>
                    <SelectItem value='experienced'>Experienced (2-5y)</SelectItem>
                    <SelectItem value='senior'>Senior (5y+)</SelectItem>
                  </SelectContent>
                </Select>

                {/* Nationality Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant='outline' className='w-40'>
                      <Filter className='mr-2 h-4 w-4' />
                      Nationality {nationalityFilter.length > 0 && `(${nationalityFilter.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-48'>
                    {getAvailableNationalities().map((nationality) => (
                      <DropdownMenuCheckboxItem
                        key={nationality}
                        checked={nationalityFilter.includes(nationality)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNationalityFilter([...nationalityFilter, nationality]);
                          } else {
                            setNationalityFilter(nationalityFilter.filter(n => n !== nationality));
                          }
                        }}
                      >
                        {nationality}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clear Filters */}
                {(searchTerm || statusFilter !== 'all' || verificationFilter !== 'all' ||
                  experienceFilter !== 'all' || nationalityFilter.length > 0) && (
                  <Button
                    variant='ghost'
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setVerificationFilter('all');
                      setExperienceFilter('all');
                      setNationalityFilter([]);
                    }}
                    className='text-gray-500 hover:text-gray-700'
                  >
                    <X className='mr-2 h-4 w-4' />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters Display */}
            {(nationalityFilter.length > 0 || statusFilter !== 'all' ||
              verificationFilter !== 'all' || experienceFilter !== 'all') && (
              <div className='flex flex-wrap gap-2'>
                {nationalityFilter.map(nationality => (
                  <Badge key={nationality} variant='secondary' className='pr-1'>
                    {nationality}
                    <button
                      onClick={() => setNationalityFilter(nationalityFilter.filter(n => n !== nationality))}
                      className='ml-1 hover:bg-gray-300 rounded-full p-0.5'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  </Badge>
                ))}
                {statusFilter !== 'all' && (
                  <Badge variant='secondary'>Status: {statusFilter}</Badge>
                )}
                {verificationFilter !== 'all' && (
                  <Badge variant='secondary'>Verification: {verificationFilter}</Badge>
                )}
                {experienceFilter !== 'all' && (
                  <Badge variant='secondary'>
                    Experience: {experienceFilter === 'entry' ? 'Entry Level' :
                                experienceFilter === 'experienced' ? 'Experienced' : 'Senior'}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {(maidListings.length > 0) && (
            (searchTerm || statusFilter !== 'all' || verificationFilter !== 'all' ||
             experienceFilter !== 'all' || nationalityFilter.length > 0) && (
              <div className='text-sm text-gray-600 mb-3'>
                Showing {filteredMaids.length} of {maidListings.length}
              </div>
            )
          )}

          {filteredMaids.length === 0 ? (
            <div className='text-center py-12'>
              <User className='mx-auto h-12 w-12 text-gray-300 mb-4' />
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>No maids found</h3>
              <p className='text-gray-500 mb-4'>
                {maidListings.length === 0
                  ? 'No maid profiles have been added yet.'
                  : 'No maids match your current filters.'}
              </p>
              {(searchTerm || statusFilter !== 'all' || verificationFilter !== 'all' ||
                experienceFilter !== 'all' || nationalityFilter.length > 0) && (
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setVerificationFilter('all');
                    setExperienceFilter('all');
                    setNationalityFilter([]);
                  }}
                  className='mt-2'
                >
                  <X className='mr-2 h-4 w-4' />
                  Clear all filters
                </Button>
              )}
              {maidListings.length === 0 && (
                <div className='mt-4 flex items-center justify-center gap-2'>
                  <Button asChild variant='outline'>
                    <Link to='/dashboard/agency/maids/bulk-upload'>
                      <Upload className='mr-2 h-4 w-4' />
                      Bulk Upload CSV
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link to='/dashboard/agency/maids/add'>
                      <FilePlus className='mr-2 h-4 w-4' />
                      Add Your First Maid
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className='hidden sm:table-cell'>
                      Country
                    </TableHead>
                    <TableHead className='hidden lg:table-cell'>
                      Skills
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='hidden md:table-cell'>
                      Verification
                    </TableHead>
                    <TableHead className='hidden md:table-cell'>
                      Experience
                    </TableHead>
                    <TableHead className='hidden lg:table-cell'>
                      Documents
                    </TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMaids.map((maid) => {
                    const primaryImageUrl = getPrimaryImageUrl(maid);
                    const displayName = getMaidDisplayName(maid);
                    const country = getMaidCountry(maid);

                    return (
                      <TableRow
                        key={maid.id}
                        className='hover:bg-gray-50 transition-colors'
                      >
                        <TableCell>
                          <div className='flex items-center space-x-3'>
                            <Avatar className='w-12 h-12 border-2 border-gray-100'>
                              {primaryImageUrl ? (
                                <AvatarImage
                                  src={primaryImageUrl}
                                  alt={displayName}
                                  className='object-cover'
                                />
                              ) : (
                                <div className='w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center'>
                                  <User className='w-6 h-6 text-purple-600' />
                                </div>
                              )}
                              <AvatarFallback className='bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-semibold'>
                                {getInitials(displayName)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </TableCell>
                        <TableCell className='font-medium text-gray-700'>
                          <div className='flex items-center gap-2'>
                            <span className='cursor-pointer hover:text-blue-600'
                                  onClick={() => handleMaidAction('QuickView', maid.id, maid)}>
                              {displayName}
                            </span>
                            <Badge className='bg-purple-100 text-purple-700 border border-purple-200 text-xs'>
                              Agency
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className='hidden sm:table-cell text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <MapPin className='h-3 w-3' />
                            {country}
                          </div>
                        </TableCell>
                        <TableCell className='hidden lg:table-cell text-gray-600'>
                          <div className='flex flex-wrap gap-1 max-w-32'>
                            {maid.skills && maid.skills.slice(0, 2).map((skill, idx) => (
                              <Badge key={idx} variant='outline' className='text-xs'>
                                {skill}
                              </Badge>
                            ))}
                            {maid.skills && maid.skills.length > 2 && (
                              <Badge variant='outline' className='text-xs'>
                                +{maid.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={maid.status || maid.availability_status} />
                        </TableCell>
                        <TableCell className='hidden md:table-cell'>
                          <div className='flex items-center gap-1'>
                            {maid.verification_status === 'verified' ? (
                              <CheckCircle className='h-4 w-4 text-green-500' />
                            ) : maid.verification_status === 'pending' ? (
                              <Clock className='h-4 w-4 text-yellow-500' />
                            ) : (
                              <XCircle className='h-4 w-4 text-red-500' />
                            )}
                            <span className='text-sm capitalize'>
                              {maid.verification_status || 'pending'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='hidden md:table-cell text-gray-600'>
                          <div className='flex items-center gap-1'>
                            <Star className='h-3 w-3' />
                            {maid.experience_years || maid.experience || 0} years
                          </div>
                        </TableCell>
                        <TableCell className='hidden lg:table-cell'>
                          <div className='flex items-center gap-1'>
                            {maid.documentsStatus === 'valid' ? (
                              <CheckCircle className='h-4 w-4 text-green-500' />
                            ) : maid.documentsStatus === 'expiring' ? (
                              <AlertTriangle className='h-4 w-4 text-yellow-500' />
                            ) : maid.documentsStatus === 'expired' ? (
                              <XCircle className='h-4 w-4 text-red-500' />
                            ) : (
                              <FileText className='h-4 w-4 text-gray-400' />
                            )}
                            <span className='text-sm capitalize'>
                              {maid.documentsStatus || 'missing'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <span className='sr-only'>Open menu</span>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMaidAction('QuickView', maid.id, maid)
                                }
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                Quick View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMaidAction('View', maid.id)
                                }
                              >
                                <FileText className='mr-2 h-4 w-4' />
                                Full Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMaidAction('Edit', maid.id)
                                }
                              >
                                <Edit3 className='mr-2 h-4 w-4' />
                                Edit Listing
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleMaidAction('Remove', maid.id)
                                }
                                className='text-red-600 focus:text-red-600 focus:bg-red-50'
                              >
                                <Trash2 className='mr-2 h-4 w-4' />
                                Remove Listing
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {filteredMaids.length > 0 && (
                <div className='flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t'>
                  <div className='flex items-center gap-2 text-sm text-gray-600'>
                    <span>Showing</span>
                    <Select
                      value={String(itemsPerPage)}
                      onValueChange={(value) => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className='w-20 h-8'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='5'>5</SelectItem>
                        <SelectItem value='10'>10</SelectItem>
                        <SelectItem value='25'>25</SelectItem>
                        <SelectItem value='50'>50</SelectItem>
                        <SelectItem value='100'>100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>of {filteredMaids.length} entries</span>
                  </div>

                  {totalPages > 1 && (
                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronsLeft className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </Button>

                      <div className='flex items-center gap-1 text-sm'>
                        <span className='font-medium'>{currentPage}</span>
                        <span className='text-gray-500'>of</span>
                        <span className='font-medium'>{totalPages}</span>
                      </div>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronsRight className='h-4 w-4' />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{' '}
              <span className='font-semibold'>
                {maidToDelete?.maid ? getMaidDisplayName(maidToDelete.maid) : 'this maid'}
              </span>{' '}
              from your listings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setMaidToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMaid}
              className='bg-red-600 hover:bg-red-700 focus:ring-red-600'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className='w-full sm:max-w-lg overflow-y-auto'>
          <SheetHeader>
            <SheetTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              {selectedMaid ? getMaidDisplayName(selectedMaid) : 'Maid Profile'}
            </SheetTitle>
            <SheetDescription>
              View detailed information about this maid profile
            </SheetDescription>
          </SheetHeader>

          {selectedMaid && (
            <div className='mt-6 space-y-6'>
              {/* Profile Image and Basic Info */}
              <div className='text-center'>
                <Avatar className='w-24 h-24 mx-auto mb-4 border-4 border-gray-100'>
                  {getPrimaryImageUrl(selectedMaid) ? (
                    <AvatarImage
                      src={getPrimaryImageUrl(selectedMaid)}
                      alt={getMaidDisplayName(selectedMaid)}
                      className='object-cover'
                    />
                  ) : (
                    <div className='w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center'>
                      <User className='w-12 h-12 text-purple-600' />
                    </div>
                  )}
                  <AvatarFallback className='bg-gradient-to-br from-purple-100 to-blue-100 text-purple-700 font-semibold text-lg'>
                    {getInitials(getMaidDisplayName(selectedMaid))}
                  </AvatarFallback>
                </Avatar>
                <h3 className='text-xl font-semibold text-gray-900'>
                  {getMaidDisplayName(selectedMaid)}
                </h3>
                <div className='flex items-center justify-center gap-2 mt-2'>
                  <MapPin className='h-4 w-4 text-gray-400' />
                  <span className='text-gray-600'>{getMaidCountry(selectedMaid)}</span>
                </div>
              </div>

              <Separator />

              {/* Status and Verification */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-1 block'>
                    Status
                  </label>
                  <StatusBadge status={selectedMaid.status || selectedMaid.availability_status} />
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-1 block'>
                    Verification
                  </label>
                  <div className='flex items-center gap-1'>
                    {selectedMaid.verification_status === 'verified' ? (
                      <CheckCircle className='h-4 w-4 text-green-500' />
                    ) : selectedMaid.verification_status === 'pending' ? (
                      <Clock className='h-4 w-4 text-yellow-500' />
                    ) : (
                      <XCircle className='h-4 w-4 text-red-500' />
                    )}
                    <span className='text-sm capitalize'>
                      {selectedMaid.verification_status || 'pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Experience and Skills */}
              <div>
                <label className='text-sm font-medium text-gray-500 mb-2 block'>
                  Experience & Skills
                </label>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2 text-sm'>
                    <Star className='h-4 w-4 text-gray-400' />
                    <span>{selectedMaid.experience_years || selectedMaid.experience || 0} years of experience</span>
                  </div>
                  {selectedMaid.skills && selectedMaid.skills.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-2'>
                      {selectedMaid.skills.map((skill, idx) => (
                        <Badge key={idx} variant='outline' className='text-xs'>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              {selectedMaid.languages && selectedMaid.languages.length > 0 && (
                <div>
                  <label className='text-sm font-medium text-gray-500 mb-2 block'>
                    Languages
                  </label>
                  <div className='flex flex-wrap gap-1'>
                    {selectedMaid.languages.map((language, idx) => (
                      <Badge key={idx} variant='secondary' className='text-xs'>
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Status */}
              <div>
                <label className='text-sm font-medium text-gray-500 mb-2 block'>
                  Documents
                </label>
                <div className='flex items-center gap-2'>
                  {selectedMaid.documentsStatus === 'valid' ? (
                    <CheckCircle className='h-4 w-4 text-green-500' />
                  ) : selectedMaid.documentsStatus === 'expiring' ? (
                    <AlertTriangle className='h-4 w-4 text-yellow-500' />
                  ) : selectedMaid.documentsStatus === 'expired' ? (
                    <XCircle className='h-4 w-4 text-red-500' />
                  ) : (
                    <FileText className='h-4 w-4 text-gray-400' />
                  )}
                  <span className='text-sm capitalize'>
                    {selectedMaid.documentsStatus || 'missing'}
                  </span>
                </div>
              </div>

              {/* Contact Information (Masked) */}
              <div>
                <label className='text-sm font-medium text-gray-500 mb-2 block'>
                  Contact Information (Masked)
                </label>
                <div className='space-y-2 text-sm'>
                  {selectedMaid.phone_number && (
                    <div className='flex items-center gap-2'>
                      <Phone className='h-4 w-4 text-gray-400' />
                      <span>{selectedMaid.phone_number}</span>
                    </div>
                  )}
                  {selectedMaid.passport_number && (
                    <div className='flex items-center gap-2'>
                      <FileText className='h-4 w-4 text-gray-400' />
                      <span>Passport: {selectedMaid.passport_number}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-2 pt-4'>
                <Button
                  onClick={() => handleMaidAction('View', selectedMaid.id)}
                  className='flex-1'
                >
                  <FileText className='mr-2 h-4 w-4' />
                  Full Profile
                </Button>
                <Button
                  variant='outline'
                  onClick={() => handleMaidAction('Edit', selectedMaid.id)}
                  className='flex-1'
                >
                  <Edit3 className='mr-2 h-4 w-4' />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgencyMaidsPage;
