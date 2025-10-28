import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { agencyService } from '@/services/agencyService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import ProfileCompletionGate from '@/components/agency/ProfileCompletionGate';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, DownloadCloud, Play, Loader2 } from 'lucide-react';

// Minimal CSV parser that supports quoted values and commas within quotes
function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ',') {
      row.push(field.trim());
      field = '';
      i++;
      continue;
    }
    if (char === '\n') {
      row.push(field.trim());
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }
    if (char === '\r') {
      i++;
      continue;
    }
    field += char;
    i++;
  }
  // push last field/row
  row.push(field.trim());
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) rows.push(row);
  return rows;
}

const CSV_HEADERS = [
  'full_name',
  'date_of_birth',
  'nationality',
  'current_location',
  'marital_status',
  'children_count',
  'experience_years',
  'skills', // semicolon separated
  'languages', // semicolon separated
  'previous_countries', // semicolon separated
  'availability_status',
  'salary_expectation',
  'visa_status',
  'passport_number',
];

const templateCsv = () => [CSV_HEADERS.join(','),
  'Jane Doe,1995-07-12,Ethiopia,Addis Ababa,Single,0,3,"Cooking;Cleaning;Childcare","Amharic;English","UAE","available",1200,Visit Visa,ET1234567'
].join('\n');

const AgencyBulkUploadMaidsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agency-maids-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed || parsed.length === 0) {
      toast({ title: 'Invalid CSV', description: 'No data found in file', variant: 'destructive' });
      return;
    }
    const hdrs = parsed[0].map((h) => h.trim());
    const body = parsed.slice(1);

    // Basic header validation
    const missing = CSV_HEADERS.filter((h) => !hdrs.includes(h));
    if (missing.length > 0) {
      setErrors([`Missing required header(s): ${missing.join(', ')}`]);
      setHeaders(hdrs);
      setRows([]);
      return;
    }

    // Convert rows to objects keyed by headers
    const objects = body.map((r) => {
      const obj = {};
      hdrs.forEach((h, idx) => {
        obj[h] = r[idx] ?? '';
      });
      return obj;
    });

    // Validate required fields
    const rowErrors = [];
    const valid = objects.filter((obj, index) => {
      const e = [];
      if (!obj.full_name) e.push('full_name');
      if (!obj.nationality) e.push('nationality');
      if (e.length > 0) {
        rowErrors.push(`Row ${index + 2}: missing ${e.join(', ')}`); // +2 accounts for header and 1-based index
        return false;
      }
      return true;
    });

    setErrors(rowErrors);
    setHeaders(hdrs);
    setRows(valid);
  };

  const handleImport = async () => {
    if (!rows.length) {
      toast({ title: 'No rows to import', description: 'Upload a valid CSV first.', variant: 'destructive' });
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      // Transform semi-colon separated lists into arrays
      const payload = rows.map((r) => ({
        ...r,
        skills: r.skills ? r.skills.split(';').map((s) => s.trim()).filter(Boolean) : [],
        languages: r.languages ? r.languages.split(';').map((s) => s.trim()).filter(Boolean) : [],
        previous_countries: r.previous_countries ? r.previous_countries.split(';').map((s) => s.trim()).filter(Boolean) : [],
        salaryExpectation: r.salary_expectation ? Number(r.salary_expectation) : null,
      }));

      const { summary } = await agencyService.bulkCreateMaidProfiles(payload, user?.id);

      setResult(summary);
      if (summary.failed === 0) {
        toast({ title: 'Import complete', description: `Imported ${summary.success} maid profiles.` });
        navigate('/dashboard/agency/maids');
      } else {
        toast({
          title: 'Import finished with errors',
          description: `Success: ${summary.success}, Failed: ${summary.failed}`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Import failed', description: err.message || 'Unexpected error', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <ProfileCompletionGate feature="maid management" description="Bulk uploading maid profiles">
      <div className='space-y-6'>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => navigate('/dashboard/agency/maids')}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Back to Maids
          </Button>
          <h1 className='text-3xl font-bold text-gray-800'>Bulk Upload Maids</h1>
        </div>

        <Card className='border-0 shadow-lg'>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Use the template to prepare your data. Required columns: full_name, nationality. Lists use semicolons.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Button variant='secondary' onClick={handleDownloadTemplate}>
                <DownloadCloud className='mr-2 h-4 w-4' /> Download CSV template
              </Button>
              <div className='flex items-center gap-3'>
                <Label htmlFor='csvFile' className='text-sm'>Select CSV</Label>
                <Input id='csvFile' type='file' accept='.csv' onChange={(e) => handleFile(e.target.files?.[0])} />
              </div>
            </div>

            {fileName && (
              <p className='text-sm text-gray-600'>Selected file: <span className='font-medium'>{fileName}</span></p>
            )}

            {errors.length > 0 && (
              <Alert className='border-red-200 bg-red-50'>
                <AlertDescription>
                  <ul className='list-disc ml-5 text-sm text-red-700'>
                    {errors.map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {rows.length > 0 && (
              <div className='space-y-2'>
                <h3 className='font-semibold text-gray-800'>Preview ({Math.min(rows.length, 5)} of {rows.length})</h3>
                <div className='border rounded-md overflow-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {CSV_HEADERS.map((h) => (
                          <TableHead key={h} className='whitespace-nowrap'>{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.slice(0, 5).map((r, idx) => (
                        <TableRow key={idx}>
                          {CSV_HEADERS.map((h) => (
                            <TableCell key={h} className='whitespace-nowrap text-sm'>{String(r[h] ?? '')}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className='flex justify-end'>
              <Button onClick={handleImport} disabled={importing || rows.length === 0}>
                {importing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Importing...
                  </>
                ) : (
                  <>
                    <Play className='mr-2 h-4 w-4' /> Start Import ({rows.length})
                  </>
                )}
              </Button>
            </div>

            {result && (
              <div className='text-sm text-gray-700'>
                <p>Imported: <span className='font-semibold text-green-700'>{result.success}</span></p>
                <p>Failed: <span className='font-semibold text-red-700'>{result.failed}</span></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProfileCompletionGate>
  );
};

export default AgencyBulkUploadMaidsPage;

