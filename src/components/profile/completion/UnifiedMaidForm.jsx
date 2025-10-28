import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import MultiSelect from '@/components/ui/multi-select';
import SingleSelect from '@/components/ui/single-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Save,
  Plus,
  AlertTriangle,
  CheckCircle,
  Upload,
  Video,
  X,
  Calendar,
  User,
  Briefcase,
  Globe,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { getStatesByCountry } from '@/data/countryStateData';
import ImageGalleryManager from '@/components/ImageGalleryManager';
import { DropdownDatePicker } from '@/components/ui/date-picker';
import { differenceInYears } from 'date-fns';
import {
  gccCountries,
  positions,
  skills,
  languages,
  religions,
  maritalStatuses,
  visaStatuses,
  nationalities,
  workPreferences as workPreferenceOptions,
} from '@/data/maidProfileData';

// Dropdown option sets
const KEY_RESPONSIBILITIES = [
  'Housekeeping',
  'Cooking',
  'Childcare',
  'Infant Care',
  'Elderly Care',
  'Laundry',
  'Ironing',
  'Grocery Shopping',
  'Pet Care',
  'Driving',
  'Tutoring',
  'Cleaning',
  'Gardening',
];

const REASONS_FOR_LEAVING = [
  'Contract Completed',
  'Family Relocated',
  'End of Visa/Residency',
  'Employer No Longer Needed Help',
  'Better Opportunity',
  'Salary/Benefits',
  'Personal/Family Reasons',
  'Health Reasons',
  'Returned to Home Country',
  'Other',
];

const SPECIAL_SKILLS = [
  'First Aid / CPR',
  'Food Safety / Hygiene',
  'Infant Care Training',
  'Elderly Care Training',
  'Housekeeping Certification',
  'Professional Nanny Training',
  'Driving License',
  'Cooking: Ethiopian Cuisine',
  'Cooking: Middle Eastern Cuisine',
  'Cooking: Indian Cuisine',
  'COVID-19 Vaccinated',
  'Basic Computer Skills',
  'Fluent in English',
  'Arabic Basics',
  'Amharic (Native)',
  'Swimming',
];

const ADDITIONAL_SERVICES = [
  'Pet Care',
  'Garden Maintenance',
  'Car Washing',
  'Grocery Shopping',
  'Laundry & Ironing',
  'Meal Preparation',
  'Tutoring Children',
  'Elderly Companionship',
  'Event Assistance',
  'House Sitting',
];

/**
 * UnifiedMaidForm - A comprehensive maid registration form
 * Used for both independent maid self-registration and agency-managed maid registration
 * Based on the agency's "Add New Maid" form for consistency
 */
const UnifiedMaidForm = ({
  onUpdate,
  initialData = {},
  mode = 'self-registration', // 'self-registration' or 'agency-managed'
  onSubmit = null,
}) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [submitting, setSubmitting] = useState(false);
  const [isGeneratingAboutMe, setIsGeneratingAboutMe] = useState(false);

  const formatList = useCallback((items) => {
    if (!items) return '';
    const values = items.filter(Boolean);
    if (values.length === 0) return '';
    if (values.length === 1) return values[0];
    if (values.length === 2) return `${values[0]} and ${values[1]}`;
    return `${values.slice(0, -1).join(', ')}, and ${values[values.length - 1]}`;
  }, []);

  const gentleCase = useCallback((value) => {
    if (!value) return '';
    return value
      .toString()
      .split(' ')
      .map((word) => {
        if (!word) return word;
        return word[0].toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }, []);

  const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
  const MAX_VIDEO_DURATION_SECONDS = 60;

  const canvasRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const passportFileInputRef = useRef(null);
  const referenceFileInputRef = useRef(null);
  const medicalFileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const recordingDurationRef = useRef(0);

  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [formData, setFormData] = useState({
    // Personal Information
    images: initialData.images || [],
    full_name:
      (initialData.full_name ||
        initialData.name ||
        [initialData.firstName, initialData.middleName, initialData.lastName]
          .filter(Boolean)
          .join(' ') ||
        '').trim(),
    firstName: initialData.firstName || initialData.name?.split(' ')[0] || '',
    middleName: initialData.middleName || '',
    lastName:
      initialData.lastName ||
      initialData.name?.split(' ').slice(1).join(' ') ||
      '',
    passportNumber: initialData.passportNumber || '',
    passportIssueDate: initialData.passportIssueDate || '',
    passportExpiryDate: initialData.passportExpiryDate || '',
    dateOfBirth: initialData.dateOfBirth || '',
    maritalStatus: initialData.maritalStatus || '',
    country: initialData.country || '',
    streetAddress: initialData.streetAddress || '',
    stateProvince: initialData.stateProvince || '',
    religion: initialData.religion || '',
    religionOther: initialData.religionOther || '',

    // Professional Details
    primaryProfession: initialData.primaryProfession || '',
    primaryProfessionOther: initialData.primaryProfessionOther || '',
    currentVisaStatus:
      initialData.currentVisaStatus || initialData.visaStatus || '',
    currentVisaStatusOther: initialData.currentVisaStatusOther || '',
    languagesSpoken: initialData.languagesSpoken || [],
    languagesOther: initialData.languagesOther || '',
    nationality: initialData.nationality || '',

    // Work Experience
    workExperiences:
      (initialData.workExperiences || []).map((exp) => ({
        ...exp,
        // Normalize responsibilities to array
        responsibilities: Array.isArray(exp?.responsibilities)
          ? exp.responsibilities
          : (typeof exp?.responsibilities === 'string'
              ? exp.responsibilities.split(',').map((s) => s.trim()).filter(Boolean)
              : []),
        reasonForLeavingOther: exp?.reasonForLeavingOther || '',
      })),
    totalExperienceYears: initialData.totalExperienceYears || '',
    previousCountries: initialData.previousCountries || [],

    // Skills & Additional Info
    skills: initialData.skills || [],
    salaryExpectations: initialData.salaryExpectations || '',
    aboutMe: initialData.aboutMe || '',

    // Additional Information
    videoCv: initialData.videoCv
      ? {
          ...initialData.videoCv,
          file: null,
          previewUrl: initialData.videoCv.previewUrl || '',
          method: initialData.videoCv.method || null,
          duration: initialData.videoCv.duration || null,
        }
      : { file: null, previewUrl: '', method: null, duration: null },

    availability: initialData.availability || '',
    additionalServices: initialData.additionalServices || [],
    specialSkills: Array.isArray(initialData.specialSkills)
      ? initialData.specialSkills
      : (initialData.specialSkills
          ? String(initialData.specialSkills)
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : []),
    specialSkillsInput: '',
    workPreferences: initialData.workPreferences || [],

    // Documents Upload (images will be auto-watermarked)
    passportPhotoPage: initialData.passportPhotoPage
      ? {
          ...initialData.passportPhotoPage,
          file: null,
          previewUrl: initialData.passportPhotoPage.previewUrl || '',
          watermarked: !!initialData.passportPhotoPage.watermarked,
        }
      : { file: null, previewUrl: '', watermarked: false },
    referenceLetter: initialData.referenceLetter
      ? {
          ...initialData.referenceLetter,
          file: null,
          previewUrl: initialData.referenceLetter.previewUrl || '',
          watermarked: !!initialData.referenceLetter.watermarked,
        }
      : { file: null, previewUrl: '', watermarked: false },
    medicalCertificate: initialData.medicalCertificate
      ? {
          ...initialData.medicalCertificate,
          file: null,
          previewUrl: initialData.medicalCertificate.previewUrl || '',
          watermarked: !!initialData.medicalCertificate.watermarked,
        }
      : { file: null, previewUrl: '', watermarked: false },
    
    // Consent & Agreements
    consentPrivacyTerms: initialData.consentPrivacyTerms || false,
    consentShareProfile: initialData.consentShareProfile || false,
    consentTruthfulness: initialData.consentTruthfulness || false,
  });

  const [formErrors, setFormErrors] = useState({});

  // --- Draft autosave/restore (localStorage) ---
  const draftKey = React.useMemo(() => {
    const id = initialData?.id || 'anonymous';
    return `maidFormDraft:${id}`;
  }, [initialData?.id]);

  // Restore draft on mount
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const normalized = { ...parsed };
        // Normalize specialSkills to array
        if (
          typeof normalized.specialSkills === 'string' &&
          normalized.specialSkills.trim()
        ) {
          normalized.specialSkills = normalized.specialSkills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        }
        if (Array.isArray(normalized.workExperiences)) {
          normalized.workExperiences = normalized.workExperiences.map((exp) => ({
            ...exp,
            responsibilities: Array.isArray(exp?.responsibilities)
              ? exp.responsibilities
              : (typeof exp?.responsibilities === 'string'
                  ? exp.responsibilities
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : []),
            reasonForLeavingOther: exp?.reasonForLeavingOther || '',
          }));
        }
        setFormData((prev) => ({ ...prev, ...normalized }));
      }
    } catch (_) {
      // ignore restore errors
    }
     
  }, []);

  // Debounced autosave when data changes
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
        setLastSavedAt(new Date());
      } catch (_) {
        // storage full or unavailable
      }
    }, 800);
    return () => clearTimeout(t);
  }, [formData, draftKey]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch (e) {
      console.warn('UnifiedMaidForm: unable to clear draft');
    }
  };
  // Saved timestamp for autosave indicator
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const savedLabel = React.useMemo(() => {
    if (!lastSavedAt) return '';
    const diff = Math.floor((Date.now() - lastSavedAt.getTime()) / 1000);
    if (diff < 5) return 'Saved just now';
    if (diff < 60) return `Saved ${diff}s ago`;
    const mins = Math.floor(diff / 60);
    return `Saved ${mins}m ago`;
  }, [lastSavedAt]);

  // Provide sensible defaults for Ethiopian maids to reduce friction
  const didInitDefaultsRef = useRef(false);
  React.useEffect(() => {
    if (didInitDefaultsRef.current) return;
    didInitDefaultsRef.current = true;

    const isEthiopianByInitial =
      (initialData?.nationality || '').toLowerCase() === 'ethiopian';
    const needsNationality = !formData.nationality;
    const needsCountry = !formData.country;
    const needsLanguage = !formData.languagesSpoken || formData.languagesSpoken.length === 0;

    // If nationality suggests Ethiopian, apply helpful defaults
    if (isEthiopianByInitial || needsNationality || needsCountry || needsLanguage) {
      setFormData((prev) => ({
        ...prev,
        nationality: prev.nationality || (isEthiopianByInitial ? 'Ethiopian' : prev.nationality),
        country: prev.country || (isEthiopianByInitial ? 'Ethiopia' : prev.country),
        languagesSpoken:
          needsLanguage && (isEthiopianByInitial || prev.nationality === 'Ethiopian')
            ? ['Amharic']
            : prev.languagesSpoken,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watermarking utility for images
  const WATERMARK_TEXT = 'Ethiopian Maids  For screening only.';

  const watermarkImage = useCallback(async (file, text = WATERMARK_TEXT) => {
    if (!file || !file.type?.startsWith('image/')) return null;
    const bitmap = await createImageBitmap(file);
    // Scale down very large images for file size efficiency
    const maxDim = 1600;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);

    // Draw repeating diagonal watermark text
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-Math.PI / 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.max(18, Math.floor(Math.min(width, height) / 18));
    ctx.font = `${fontSize}px sans-serif`;
    const step = fontSize * 4;
    for (let y = -height; y <= height; y += step) {
      for (let x = -width; x <= width; x += step * 2) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
    if (!blob) return null;
    const watermarkedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '-wm.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
    return watermarkedFile;
  }, []);

  const handleDocUpload = useCallback(
    async (field, file) => {
      if (!file) return;
      if (!file.type?.startsWith('image/')) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: 'Please upload an image file (JPG, PNG, or WEBP).',
        }));
        return;
      }
      // 15MB limit for documents
      if (file.size > 15 * 1024 * 1024) {
        setFormErrors((prev) => ({
          ...prev,
          [field]: 'File must be 15MB or smaller.',
        }));
        return;
      }

      const wm = await watermarkImage(file);
      if (!wm) return;
      const previewUrl = URL.createObjectURL(wm);

      setFormData((prev) => {
        const prevUrl = prev?.[field]?.previewUrl;
        if (prevUrl && prevUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(prevUrl);
          } catch (e) {
            console.warn('UnifiedMaidForm: failed to revoke blob URL');
          }
        }
        return {
          ...prev,
          [field]: { file: wm, previewUrl, watermarked: true },
        };
      });
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [watermarkImage]
  );

  const removeDoc = useCallback((field) => {
    setFormData((prev) => {
      const prevUrl = prev?.[field]?.previewUrl;
      if (prevUrl && prevUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prevUrl);
        } catch (e) {
          console.warn('UnifiedMaidForm: failed to revoke blob URL');
        }
      }
      return { ...prev, [field]: { file: null, previewUrl: '', watermarked: false } };
    });
  }, []);

  // Handle form data changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }, []);

  // Handle date changes
  const handleDateChange = useCallback((name, date) => {
    setFormData((prev) => ({
      ...prev,
      [name]: date,
    }));
  }, []);

  // Handle array changes (skills, languages, etc.)
  const handleArrayChange = useCallback((name, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked
        ? [...prev[name], value]
        : prev[name].filter((item) => item !== value),
    }));
  }, []);

  // Count completed steps to align with CompleteProfilePage's expected step model (0..4)
  const buildAboutMeSummary = useCallback(() => {
    const nameParts = [formData.firstName, formData.middleName, formData.lastName]
      .filter(Boolean)
      .map(gentleCase);
    const partsName = nameParts.join(' ');
    const fullName = gentleCase(formData.full_name) || partsName;
    const nationality = gentleCase(formData.nationality);
    const profession = gentleCase(formData.primaryProfession) || 'household professional';

    const segments = [];
    if (fullName) {
      segments.push(`Hi, I'm ${fullName}.`);
    } else {
      segments.push('Hi there!');
    }

    let roleSentence = 'I am a ' + (nationality ? `${nationality} ` : '') + profession;
    const years = Number(formData.totalExperienceYears);
    if (!Number.isNaN(years) && years > 0) {
      roleSentence += ` with ${years} ${years === 1 ? 'year' : 'years'} of experience`;
    } else if (formData.totalExperienceYears) {
      roleSentence += ' with hands-on experience';
    }
    roleSentence += '.';
    segments.push(roleSentence);

    if (Array.isArray(formData.previousCountries) && formData.previousCountries.length > 0) {
      segments.push(`I have supported families in ${formatList(formData.previousCountries.map(gentleCase))}.`);
    }

    if (Array.isArray(formData.languagesSpoken) && formData.languagesSpoken.length > 0) {
      segments.push(`I speak ${formatList(formData.languagesSpoken.map(gentleCase))}.`);
    }

    if (Array.isArray(formData.skills) && formData.skills.length > 0) {
      const topSkills = formData.skills.slice(0, 5).map(gentleCase);
      segments.push(`My strengths include ${formatList(topSkills)}.`);
    }

    if (Array.isArray(formData.workPreferences) && formData.workPreferences.length > 0) {
      segments.push(`I'm looking for ${formatList(formData.workPreferences.map(gentleCase))} opportunities.`);
    }

    if (formData.availability) {
      segments.push(`I'm available ${formData.availability.toLowerCase()}.`);
    }

    segments.push('I am dedicated, trustworthy, and committed to creating a safe, happy home.');
    return segments.join(' ');
  }, [formData, formatList, gentleCase]);

  const handleGenerateAboutMe = useCallback(() => {
    if (isGeneratingAboutMe) return;
    setIsGeneratingAboutMe(true);
    window.setTimeout(() => {
      const generated = buildAboutMeSummary();
      const sanitized = generated ? generated.replace(/\s+/g, ' ').trim().slice(0, 500) : '';
      setFormData((prev) => ({
        ...prev,
        aboutMe: sanitized,
      }));
      setFormErrors((prev) => ({
        ...prev,
        aboutMe: undefined,
      }));
      setIsGeneratingAboutMe(false);
    }, 150);
  }, [buildAboutMeSummary, isGeneratingAboutMe, setFormData, setFormErrors]);

  const clearRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }
  }, []);

  const formatRecordingDuration = useCallback((seconds) => {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  const resetVideoCv = useCallback(() => {
    setFormData((prev) => {
      if (prev.videoCv?.previewUrl && prev.videoCv.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(prev.videoCv.previewUrl);
      }
      return {
        ...prev,
        videoCv: { file: null, previewUrl: '', method: null, duration: null },
      };
    });
    setFormErrors((prev) => ({
      ...prev,
      videoCv: undefined,
    }));
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  }, [setFormData, setFormErrors]);

  const handleVideoUploadClick = useCallback(() => {
    videoFileInputRef.current?.click();
  }, []);

  const handleVideoUpload = useCallback(
    (event) => {
      const file = event.target?.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        setFormErrors((prev) => ({ ...prev, videoCv: 'Please choose a video file.' }));
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        setFormErrors((prev) => ({ ...prev, videoCv: 'Video must be 50MB or smaller.' }));
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => {
        if (prev.videoCv?.previewUrl && prev.videoCv.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.videoCv.previewUrl);
        }
        return {
          ...prev,
          videoCv: { file, previewUrl, method: 'upload', duration: null },
        };
      });
      setFormErrors((prev) => ({ ...prev, videoCv: undefined }));
      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }

      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      tempVideo.src = previewUrl;
      tempVideo.onloadedmetadata = () => {
        const duration = Math.round(tempVideo.duration || 0);
        setFormData((prev) => ({
          ...prev,
          videoCv: {
            ...prev.videoCv,
            duration: duration || prev.videoCv?.duration || null,
          },
        }));
      };
    },
    [setFormData, setFormErrors]
  );

  const stopVideoRecording = useCallback(() => {
    clearRecordingTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, [clearRecordingTimer]);

  const finishRecording = useCallback(
    () => {
      clearRecordingTimer();
      const chunks = recordingChunksRef.current;
      if (!chunks || chunks.length === 0) {
        setIsRecordingVideo(false);
        stopStream();
        mediaRecorderRef.current = null;
        return;
      }
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `video-cv-${Date.now()}.webm`, { type: 'video/webm' });
      const previewUrl = URL.createObjectURL(blob);
      const duration = recordingDurationRef.current;
      recordingChunksRef.current = [];
      recordingDurationRef.current = 0;
      mediaRecorderRef.current = null;
      setFormData((prev) => {
        if (prev.videoCv?.previewUrl && prev.videoCv.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(prev.videoCv.previewUrl);
        }
        return {
          ...prev,
          videoCv: {
            file,
            previewUrl,
            method: 'record',
            duration: duration || null,
          },
        };
      });
      setFormErrors((prev) => ({ ...prev, videoCv: undefined }));
      setIsRecordingVideo(false);
      stopStream();
    },
    [clearRecordingTimer, setFormData, setFormErrors, stopStream]
  );

  const startVideoRecording = useCallback(async () => {
    if (isRecordingVideo) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        await videoPreviewRef.current.play().catch(() => undefined);
      }
      recordingChunksRef.current = [];
      recordingDurationRef.current = 0;
      setRecordingDuration(0);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = finishRecording;
      recorder.start(1000);
      setIsRecordingVideo(true);
      clearRecordingTimer();
      recordingTimerRef.current = window.setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
        if (recordingDurationRef.current >= MAX_VIDEO_DURATION_SECONDS) {
          stopVideoRecording();
        }
      }, 1000);
    } catch (error) {
      console.error('Unable to access camera/microphone:', error);
      setFormErrors((prev) => ({
        ...prev,
        videoCv: 'Unable to access camera or microphone. Please allow permissions or upload a video instead.',
      }));
      stopStream();
      setIsRecordingVideo(false);
    }
  }, [MAX_VIDEO_DURATION_SECONDS, clearRecordingTimer, finishRecording, isRecordingVideo, setFormErrors, stopStream, stopVideoRecording]);

  const cancelVideoRecording = useCallback(() => {
    clearRecordingTimer();
    recordingChunksRef.current = [];
    recordingDurationRef.current = 0;
    setRecordingDuration(0);
    setIsRecordingVideo(false);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    mediaRecorderRef.current = null;
    stopStream();
  }, [clearRecordingTimer, stopStream]);

  useEffect(() => {
    return () => {
      clearRecordingTimer();
      stopStream();
    };
  }, [clearRecordingTimer, stopStream]);

  useEffect(() => {
    return () => {
      if (formData.videoCv?.previewUrl && formData.videoCv.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formData.videoCv.previewUrl);
      }
    };
  }, [formData.videoCv?.previewUrl]);

  // Cleanup preview URLs for uploaded documents
  React.useEffect(() => {
    return () => {
      const urls = [
        formData.passportPhotoPage?.previewUrl,
        formData.referenceLetter?.previewUrl,
        formData.medicalCertificate?.previewUrl,
      ].filter((u) => typeof u === 'string' && u.startsWith('blob:'));
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch (e) {
          console.warn('UnifiedMaidForm: failed to revoke blob URL');
        }
      });
    };
  }, [formData.passportPhotoPage?.previewUrl, formData.referenceLetter?.previewUrl, formData.medicalCertificate?.previewUrl]);

  const countCompletedSteps = useCallback(() => {
    let steps = 0;

    // Step 1: Personal
    const personalOk =
      ((mode === 'agency-managed' && formData.full_name?.trim()) ||
        (mode !== 'agency-managed' && formData.firstName?.trim() && formData.lastName?.trim())) &&
      formData.dateOfBirth &&
      formData.nationality &&
      formData.country &&
      formData.stateProvince?.trim() &&
      formData.streetAddress?.trim() &&
      Array.isArray(formData.languagesSpoken) &&
      formData.languagesSpoken.length > 0;
    if (personalOk) steps++;

    // Step 2: Professional (includes languages and skills)
    const professionalOk =
      !!formData.primaryProfession &&
      !!formData.currentVisaStatus &&
      Array.isArray(formData.skills) &&
      formData.skills.length > 0;
    if (professionalOk) steps++;

    // Step 3: Experience
    const exp = Number(formData.totalExperienceYears);
    const experienceOk = !Number.isNaN(exp) && exp >= 0 && exp <= 50;
    if (experienceOk) steps++;

    // Step 4: Overall readiness (full form validity)
    if (
      personalOk &&
      professionalOk &&
      experienceOk &&
      // final validity checks (age, salary bounds)
      (function () {
        if (!formData.dateOfBirth) return false;
        const age = differenceInYears(new Date(), new Date(formData.dateOfBirth));
        if (age < 21 || age > 55) return false;
        if (
          formData.salaryExpectations &&
          (formData.salaryExpectations < 1000 || formData.salaryExpectations > 10000)
        )
          return false;
        return true;
      })()
    ) {
      steps++;
    }

    return steps;
  }, [formData]);

  // Validate form without side effects
  const isFormValid = useCallback(() => {
    // Personal Information - Required fields validation
    if (mode === 'agency-managed') {
      if (!formData.full_name?.trim()) return false;
    } else {
      if (!formData.firstName.trim()) return false;
      if (!formData.lastName.trim()) return false;
    }
    if (!formData.dateOfBirth) return false;
    if (!formData.nationality) return false;
    if (!formData.country) return false;

    // Professional Information - Required fields
    if (!formData.primaryProfession) return false;
    if (!formData.currentVisaStatus) return false;
    if (formData.languagesSpoken.length === 0) return false;
    if (formData.skills.length === 0) return false;

    // Experience validation
    if (!formData.totalExperienceYears) return false;
    if (formData.totalExperienceYears < 0 || formData.totalExperienceYears > 50)
      return false;
    // Each experience should include at least one responsibility if any experiences are added
    if (
      Array.isArray(formData.workExperiences) &&
      formData.workExperiences.length > 0 &&
      formData.workExperiences.some(
        (exp) => !Array.isArray(exp.responsibilities) || exp.responsibilities.length === 0
      )
    )
      return false;

    // Age validation (must be 21-55 to match UI picker)
    if (formData.dateOfBirth) {
      const age = differenceInYears(new Date(), new Date(formData.dateOfBirth));
      if (age < 21 || age > 55) return false;
    }

    // Salary validation
    if (
      formData.salaryExpectations &&
      (formData.salaryExpectations < 1000 ||
        formData.salaryExpectations > 10000)
    ) {
      return false;
    }

    return true;
  }, [formData]);

  // Update parent component when form data changes
  React.useEffect(() => {
    if (onUpdate) {
      const isValid = isFormValid();
      const stepsCompleted = countCompletedSteps();
      onUpdate(formData, isValid, stepsCompleted);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Validate form
  const validateForm = () => {
    const errors = {};

    // Personal Information - Required fields validation
    if (mode === 'agency-managed') {
      if (!formData.full_name?.trim()) errors.full_name = 'Full name is required';
    } else {
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    }
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.nationality) errors.nationality = 'Nationality is required';
    if (!formData.country) errors.country = 'Country is required';
    if (!formData.stateProvince?.trim())
      errors.stateProvince = 'City or state is required';
    if (!formData.streetAddress?.trim())
      errors.streetAddress = 'Street address is required';
    if (formData.languagesSpoken.length === 0)
      errors.languagesSpoken = 'Please select at least one language';
    if (!formData.aboutMe?.trim())
      errors.aboutMe = 'About Me is required';

    // Professional Information - Required fields
    if (!formData.primaryProfession)
      errors.primaryProfession = 'Primary profession is required';
    if (!formData.currentVisaStatus)
      errors.currentVisaStatus = 'Visa status is required';
    if (formData.skills.length === 0)
      errors.skills = 'Please select at least one skill';

    // Experience validation
    if (!formData.totalExperienceYears) {
      errors.totalExperienceYears = 'Total experience years is required';
    } else if (
      formData.totalExperienceYears < 0 ||
      formData.totalExperienceYears > 50
    ) {
      errors.totalExperienceYears = 'Experience must be between 0 and 50 years';
    }
    if (
      Array.isArray(formData.workExperiences) &&
      formData.workExperiences.length > 0 &&
      formData.workExperiences.some(
        (exp) => !Array.isArray(exp.responsibilities) || exp.responsibilities.length === 0
      )
    ) {
      errors.workExperiences = 'Please select at least one responsibility for each experience';
    }

    // Age validation (must be 21-55 to match UI picker)
    if (formData.dateOfBirth) {
      const age = differenceInYears(new Date(), new Date(formData.dateOfBirth));
      if (age < 21 || age > 55) {
        errors.dateOfBirth = 'Age must be between 21 and 55 years';
      }
    }

    // Salary validation
    if (
      formData.salaryExpectations &&
      (formData.salaryExpectations < 1000 ||
        formData.salaryExpectations > 10000)
    ) {
      errors.salaryExpectations =
        'Salary expectations must be between 1000 and 10000 AED';
    }

    // Documents validation
    if (!formData.passportPhotoPage?.file) {
      errors.passportPhotoPage = 'Passport photo page is required';
    }

    // Consent validation
    if (!formData.consentPrivacyTerms) {
      errors.consentPrivacyTerms = 'You must accept the Privacy Policy and Terms of Service';
    }
    if (!formData.consentShareProfile) {
      errors.consentShareProfile = 'You must agree to share your profile';
    }
    if (!formData.consentTruthfulness) {
      errors.consentTruthfulness = 'You must confirm the information is true';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      setActiveTab('personal'); // Go to first tab with errors
      return;
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(formData);
      }
    } catch (error) {
      console.error('Error submitting maid form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate age
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    return differenceInYears(new Date(), new Date(birthDate));
  };

  // Get completion percentage
  const getCompletionPercentage = () => {
    let totalFields = 0;
    let completedFields = 0;

    // Personal Information (required fields)
    const personalFields = (
      mode === 'agency-managed'
        ? [
            'full_name',
            'dateOfBirth',
            'nationality',
            'country',
            'stateProvince',
            'streetAddress',
            'maritalStatus',
            'religion',
          ]
        : [
            'firstName',
            'lastName',
            'dateOfBirth',
            'nationality',
            'country',
            'stateProvince',
            'streetAddress',
            'maritalStatus',
            'religion',
          ]
    );
    totalFields += personalFields.length;
    completedFields += personalFields.filter((field) => formData[field]).length;

    // Professional Information (required fields)
    const professionalFields = ['primaryProfession', 'currentVisaStatus'];
    totalFields += professionalFields.length;
    completedFields += professionalFields.filter(
      (field) => formData[field]
    ).length;

    // Skills and Languages (required)
    totalFields += 2; // skills and languages
    if (formData.skills && formData.skills.length > 0) completedFields++;
    if (formData.languagesSpoken && formData.languagesSpoken.length > 0)
      completedFields++;

    // Experience (required)
    totalFields += 1;
    if (formData.totalExperienceYears) completedFields++;

    // Optional fields that boost completion
    const optionalFields = [
      'salaryExpectations',
      'aboutMe',
      'availability',
      'specialSkills',
    ];
    totalFields += optionalFields.length;
    completedFields += optionalFields.filter((field) => formData[field]).length;

    // Array fields
    if (formData.additionalServices && formData.additionalServices.length > 0)
      completedFields++;
    if (formData.workPreferences && formData.workPreferences.length > 0)
      completedFields++;
    // Profile photos are optional and do not affect completion score
    totalFields += 2;

    return Math.round((completedFields / totalFields) * 100);
  };

  const completionPercentage = getCompletionPercentage();

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='text-center'>
        <h2 className='text-2xl font-bold text-gray-900'>
          {mode === 'agency-managed'
            ? 'Add New Maid'
            : 'Complete Your Maid Profile'}
        </h2>
        <p className='text-gray-600 mt-2'>
          {mode === 'agency-managed'
            ? 'Create a comprehensive profile for your maid'
            : 'Fill out your professional details to attract employers'}
        </p>

        {/* Progress indicator */}
        <div className='mt-4 bg-gray-200 rounded-full h-2 max-w-md mx-auto'>
          <div
            className='bg-blue-600 h-2 rounded-full transition-all duration-300'
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
        <p className='text-sm text-gray-600 mt-2'>
          {completionPercentage}% Complete
        </p>
      </div>

      {/* Form Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='personal' className='flex items-center gap-2'>
            <User className='h-4 w-4' />
            Personal
          </TabsTrigger>
          <TabsTrigger value='professional' className='flex items-center gap-2'>
            <Briefcase className='h-4 w-4' />
            Professional
          </TabsTrigger>
          <TabsTrigger value='experience' className='flex items-center gap-2'>
            <Globe className='h-4 w-4' />
            Experience
          </TabsTrigger>
          <TabsTrigger value='additional' className='flex items-center gap-2'>
            <Sparkles className='h-4 w-4' />
            Additional
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value='personal' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Basic personal details and identification information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Image Upload */}
              <div>
                <Label>Profile Photos <span className='text-gray-500'>(optional)</span></Label>
                <p className='text-xs text-gray-500 mt-1'>Upload up to 5 photos to showcase yourself. You can skip this for now and add images later.</p>
                <ImageGalleryManager
                  images={formData.images}
                  onImagesChange={(images) =>
                    setFormData((prev) => ({ ...prev, images }))
                  }
                  maxImages={5}
                />
              </div>

              {/* Name Fields */}
              {mode === 'agency-managed' ? (
                <div className='grid grid-cols-1 gap-4'>
                  <div>
                    <Label htmlFor='full_name'>
                      Full Name <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='full_name'
                      name='full_name'
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder='Enter full name'
                    />
                    {formErrors.full_name && (
                      <p className='text-sm text-red-500 mt-1'>
                        {formErrors.full_name}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div>
                    <Label htmlFor='firstName'>
                      First Name <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='firstName'
                      name='firstName'
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder='Enter first name'
                    />
                    {formErrors.firstName && (
                      <p className='text-sm text-red-500 mt-1'>
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor='middleName'>Father's Name (optional)</Label>
                    <Input
                      id='middleName'
                      name='middleName'
                      value={formData.middleName}
                      onChange={handleInputChange}
                      placeholder='Enter middle name'
                    />
                  </div>
                  <div>
                    <Label htmlFor='lastName'>
                      Last Name <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='lastName'
                      name='lastName'
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder='Enter last name'
                    />
                    {formErrors.lastName && (
                      <p className='text-sm text-red-500 mt-1'>
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className='flex items-center justify-between'>
                <span className='text-xs text-gray-500'>{savedLabel}</span>
                <Button type='button' variant='ghost' size='sm' onClick={clearDraft}>
                  Clear Draft
                </Button>
              </div>

              {/* Date of Birth */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label>
                    Date of Birth <span className='text-red-500'>*</span>
                  </Label>
                  <DropdownDatePicker
                    selected={
                      formData.dateOfBirth
                        ? new Date(formData.dateOfBirth)
                        : null
                    }
                    onSelect={(date) => handleDateChange('dateOfBirth', date)}
                    fromYear={new Date().getFullYear() - 70}
                    toYear={new Date().getFullYear() - 18}
                    minAge={21}
                    maxAge={55}
                    placeholder='Select date of birth'
                    className='w-full'
                  />
                  {formData.dateOfBirth && (
                    <p className='text-sm text-gray-600 mt-1'>
                      Age: {calculateAge(formData.dateOfBirth)} years
                    </p>
                  )}
                  {formErrors.dateOfBirth && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.dateOfBirth}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor='maritalStatus'>Marital Status</Label>
                  <Select
                    value={formData.maritalStatus}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, maritalStatus: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select marital status' />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className='my-6' />

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='nationality'>
                    Nationality <span className='text-red-500'>*</span>
                  </Label>

                  <Select
                    value={formData.nationality}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, nationality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select nationality' />
                    </SelectTrigger>

                    <SelectContent className='max-h-64'>
                      {nationalities.map((nation) => (
                        <SelectItem key={nation} value={nation}>
                          {nation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {formErrors.nationality && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.nationality}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='country'>
                    Current Country <span className='text-red-500'>*</span>
                  </Label>

                  <Input
                    id='country'
                    name='country'
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder='Enter current country of residence'
                  />

                  {formErrors.country && (
                    <p className='text-sm text-red-500 mt-1'>{formErrors.country}</p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='stateProvince'>
                    City / State <span className='text-red-500'>*</span>
                  </Label>

                  <Input
                    id='stateProvince'
                    name='stateProvince'
                    value={formData.stateProvince}
                    onChange={handleInputChange}
                    placeholder='Enter city or state'
                  />

                  {formErrors.stateProvince && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.stateProvince}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='streetAddress'>
                    Street Address <span className='text-red-500'>*</span>
                  </Label>

                  <Textarea
                    id='streetAddress'
                    name='streetAddress'
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    placeholder='Enter full street address'
                    rows={3}
                  />

                  {formErrors.streetAddress && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.streetAddress}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Languages Spoken <span className='text-red-500'>*</span></Label>

                <MultiSelect
                  options={languages}
                  selected={formData.languagesSpoken}
                  onChange={(next) =>
                    setFormData((prev) => ({ ...prev, languagesSpoken: next }))
                  }
                  placeholder='Select languages'
                />

                {formData.languagesSpoken.includes('Other') && (
                  <Input
                    className='mt-2'
                    placeholder='Please specify other languages'
                    value={formData.languagesOther}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        languagesOther: e.target.value,
                      }))
                    }
                  />
                )}

                {formErrors.languagesSpoken && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors.languagesSpoken}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Information Tab */}
        <TabsContent value='professional' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Briefcase className='h-5 w-5' />
                Professional Details
              </CardTitle>
              <CardDescription>
                Your professional skills and qualifications
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Primary Profession */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='primaryProfession'>
                    Primary Profession *
                  </Label>
                  <Select
                    value={formData.primaryProfession}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        primaryProfession: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select your primary profession' />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((position) => (
                        <SelectItem key={position} value={position}>
                          {position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.primaryProfession === 'Other' && (
                    <Input
                      className='mt-2'
                      placeholder='Please specify'
                      value={formData.primaryProfessionOther}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          primaryProfessionOther: e.target.value,
                        }))
                      }
                    />
                  )}
                  {formErrors.primaryProfession && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.primaryProfession}
                    </p>
                  )}
                </div>

                {/* Current Visa Status */}
                <div>
                  <Label htmlFor='currentVisaStatus'>
                    Current Visa Status *
                  </Label>
                  <Select
                    value={formData.currentVisaStatus}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentVisaStatus: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select visa status' />
                    </SelectTrigger>
                    <SelectContent>
                      {visaStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.currentVisaStatus === 'Other' && (
                    <Input
                      className='mt-2'
                      placeholder='Please specify'
                      value={formData.currentVisaStatusOther}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          currentVisaStatusOther: e.target.value,
                        }))
                      }
                    />
                  )}
                  {formErrors.currentVisaStatus && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.currentVisaStatus}
                    </p>
                  )}
                </div>
              </div>

              {/* Skills */}
              <div>
                <Label>Professional Skills *</Label>
                <MultiSelect
                  options={skills}
                  selected={formData.skills}
                  onChange={(next) =>
                    setFormData((prev) => ({ ...prev, skills: next }))
                  }
                  placeholder='Select skills'
                />
                {formErrors.skills && (
                  <p className='text-sm text-red-500 mt-1'>
                    {formErrors.skills}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value='experience' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='h-5 w-5' />
                Work Experience
              </CardTitle>
              <CardDescription>
                Your professional work history and experience
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Years of Experience */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='totalExperienceYears'>
                    Total Years of Experience *
                  </Label>
                  <Input
                    id='totalExperienceYears'
                    type='number'
                    min='0'
                    max='50'
                    value={formData.totalExperienceYears}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        totalExperienceYears: e.target.value,
                      }))
                    }
                    placeholder='e.g., 5'
                  />
                  {formErrors.totalExperienceYears && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.totalExperienceYears}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='previousCountries'>Countries Worked In</Label>
                  <MultiSelect
                    options={gccCountries}
                    selected={formData.previousCountries}
                    onChange={(next) =>
                      setFormData((prev) => ({
                        ...prev,
                        previousCountries: next,
                      }))
                    }
                    placeholder='Select countries worked in'
                  />
                  <p className='text-sm text-gray-500 mt-2'>
                    Selected: {formData.previousCountries.length}
                  </p>
                </div>
              </div>

              {/* Work Experience Entries */}
              <div>
                <div className='flex items-center justify-between mb-4'>
                  <Label className='text-base font-medium'>
                    Work Experience Details
                  </Label>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        workExperiences: [
                          ...prev.workExperiences,
                          {
                            position: '',
                            employer: '',
                            country: '',
                            responsibilities: [],
                            reasonForLeaving: '',
                            reasonForLeavingOther: '',
                          },
                        ],
                      }));
                  }}
                  >
                    <Plus className='h-4 w-4 mr-1' />
                    Add Experience
                  </Button>
                </div>

                {formData.workExperiences.map((experience, index) => (
                  <Card
                    key={index}
                    className='mb-4 border-l-4 border-l-blue-500'
                  >
                    <CardHeader className='pb-3'>
                      <div className='flex items-center justify-between'>
                        <CardTitle className='text-lg'>
                          Experience {index + 1}
                        </CardTitle>
                        {formData.workExperiences.length > 1 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                workExperiences: prev.workExperiences.filter(
                                  (_, i) => i !== index
                                ),
                              }));
                            }}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div>
                          <Label>Position *</Label>
                          <Select
                            value={experience.position}
                            onValueChange={(value) => {
                              const newExperiences = [
                                ...formData.workExperiences,
                              ];
                              newExperiences[index].position = value;
                              setFormData((prev) => ({
                                ...prev,
                                workExperiences: newExperiences,
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder='Select position' />
                            </SelectTrigger>
                            <SelectContent>
                              {positions.map((position) => (
                                <SelectItem key={position} value={position}>
                                  {position}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {experience.position === 'Other' && (
                            <Input
                              className='mt-2'
                              placeholder='Please specify'
                              value={experience.otherPosition || ''}
                              onChange={(e) => {
                                const newExperiences = [
                                  ...formData.workExperiences,
                                ];
                                newExperiences[index].otherPosition = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  workExperiences: newExperiences,
                                }));
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <Label>Employer/Family Name *</Label>
                          <Input
                            value={experience.employer}
                            onChange={(e) => {
                              const newExperiences = [
                                ...formData.workExperiences,
                              ];
                              newExperiences[index].employer = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                workExperiences: newExperiences,
                              }));
                            }}
                            placeholder='Employer name'
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Country *</Label>
                        <Select
                          value={experience.country}
                          onValueChange={(value) => {
                            const newExperiences = [
                              ...formData.workExperiences,
                            ];
                            newExperiences[index].country = value;
                            setFormData((prev) => ({
                              ...prev,
                              workExperiences: newExperiences,
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select country' />
                          </SelectTrigger>
                          <SelectContent>
                            {gccCountries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Key Responsibilities</Label>
                        <MultiSelect
                          options={KEY_RESPONSIBILITIES}
                          selected={Array.isArray(experience.responsibilities) ? experience.responsibilities : []}
                          onChange={(next) => {
                            const newExperiences = [...formData.workExperiences];
                            newExperiences[index].responsibilities = next;
                            setFormData((prev) => ({
                              ...prev,
                              workExperiences: newExperiences,
                            }));
                          }}
                          placeholder='Select responsibilities'
                        />
                        {Array.isArray(experience.responsibilities) && experience.responsibilities.length === 0 && (
                          <p className='text-xs text-gray-500 mt-1'>Select at least one responsibility.</p>
                        )}
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                        <div>
                          <Label>Reason for Leaving</Label>
                          <SingleSelect
                            options={REASONS_FOR_LEAVING}
                            value={experience.reasonForLeaving || ''}
                            onChange={(value) => {
                              const newExperiences = [...formData.workExperiences];
                              newExperiences[index].reasonForLeaving = value;
                              if (value !== 'Other') newExperiences[index].reasonForLeavingOther = '';
                              setFormData((prev) => ({
                                ...prev,
                                workExperiences: newExperiences,
                              }));
                            }}
                            placeholder='Select reason'
                          />
                        </div>
                        {experience.reasonForLeaving === 'Other' && (
                          <div>
                            <Label>Please specify</Label>
                            <Input
                              value={experience.reasonForLeavingOther || ''}
                              onChange={(e) => {
                                const newExperiences = [...formData.workExperiences];
                                newExperiences[index].reasonForLeavingOther = e.target.value;
                                setFormData((prev) => ({
                                  ...prev,
                                  workExperiences: newExperiences,
                                }));
                              }}
                              placeholder='Enter reason'
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {formData.workExperiences.length === 0 && (
                  <div className='text-center py-8 border-2 border-dashed border-gray-300 rounded-lg'>
                    <Globe className='h-12 w-12 mx-auto text-gray-400 mb-2' />
                    <p className='text-gray-500 mb-2'>
                      No work experience added yet
                    </p>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          workExperiences: [
                            {
                              position: '',
                              employer: '',
                              country: '',
                              responsibilities: [],
                              reasonForLeaving: '',
                              reasonForLeavingOther: '',
                            },
                          ],
                        }));
                      }}
                    >
                      <Plus className='h-4 w-4 mr-1' />
                      Add Your First Experience
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Additional Information Tab */}
        <TabsContent value='additional' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Sparkles className='h-5 w-5' />
                Additional Information
              </CardTitle>
              <CardDescription>
                Optional details to enhance your profile
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Salary Expectations */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='salaryExpectations'>
                    Monthly Salary Expectations (AED)
                  </Label>
                  <Input
                    id='salaryExpectations'
                    type='number'
                    min='1000'
                    max='10000'
                    value={formData.salaryExpectations}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        salaryExpectations: e.target.value,
                      }))
                    }
                    placeholder='e.g., 2000'
                  />
                  {formErrors.salaryExpectations && (
                    <p className='text-sm text-red-500 mt-1'>
                      {formErrors.salaryExpectations}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor='availability'>Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, availability: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select availability' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='immediately'>
                        Available Immediately
                      </SelectItem>
                      <SelectItem value='1-week'>Within 1 Week</SelectItem>
                      <SelectItem value='2-weeks'>Within 2 Weeks</SelectItem>
                      <SelectItem value='1-month'>Within 1 Month</SelectItem>
                      <SelectItem value='negotiable'>Negotiable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* About Me */}
              <div>
                <Label htmlFor='aboutMe'>About Me</Label>

                <div className='mt-2 flex flex-wrap items-center gap-3'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleGenerateAboutMe}
                    disabled={isGeneratingAboutMe}
                  >
                    {isGeneratingAboutMe ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className='mr-2 h-4 w-4' />
                        Generate with AI
                      </>
                    )}
                  </Button>
                  <span className='text-xs text-gray-500'>Feel free to edit the generated summary.</span>
                </div>

                <Textarea
                  id='aboutMe'
                  value={formData.aboutMe}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      aboutMe: e.target.value,
                    }))
                  }
                  placeholder='Tell employers about yourself, your personality, and what makes you special...'
                  rows={4}
                  maxLength={500}
                  className='mt-3'
                />
                <p className='text-sm text-gray-500 mt-1'>
                  {formData.aboutMe.length}/500 characters
                </p>
              </div>

              {/* Additional Services */}
              <div>
                <Label>Additional Services I Can Provide</Label>
                <MultiSelect
                  options={ADDITIONAL_SERVICES}
                  selected={formData.additionalServices}
                  onChange={(next) =>
                    setFormData((prev) => ({ ...prev, additionalServices: next }))
                  }
                  placeholder='Select additional services'
                />
                <p className='text-sm text-gray-500 mt-2'>
                  Selected: {formData.additionalServices.length}
                </p>
              </div>

              {/* Special Skills / Certifications */}
              <div>
                <Label>Special Skills or Certifications</Label>
                <MultiSelect
                  options={SPECIAL_SKILLS}
                  selected={formData.specialSkills}
                  onChange={(next) => setFormData((prev) => ({ ...prev, specialSkills: next }))}
                  placeholder='Select special skills'
                />
                <div className='mt-3 grid grid-cols-1 md:grid-cols-3 gap-2'>
                  <div className='md:col-span-2'>
                    <Input
                      placeholder='Add a custom skill or certification'
                      value={formData.specialSkillsInput || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          specialSkillsInput: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => {
                        const val = (formData.specialSkillsInput || '').trim();
                        if (!val) return;
                        if (!formData.specialSkills.includes(val)) {
                          setFormData((prev) => ({
                            ...prev,
                            specialSkills: [...prev.specialSkills, val],
                            specialSkillsInput: '',
                          }));
                        } else {
                          setFormData((prev) => ({ ...prev, specialSkillsInput: '' }));
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <p className='text-sm text-gray-500 mt-2'>
                  Selected: {formData.specialSkills.length}
                </p>
              </div>

              {/* Work Preferences */}
              <div>
                <Label>Work Preferences</Label>
                <MultiSelect
                  options={workPreferenceOptions}
                  selected={formData.workPreferences}
                  onChange={(next) =>
                    setFormData((prev) => ({ ...prev, workPreferences: next }))
                  }
                  placeholder='Select work preferences'
                />
              <p className='text-sm text-gray-500 mt-2'>
                Selected: {formData.workPreferences.length}
              </p>
            </div>

              {/* Video CV (moved to end of Additional Info) */}
              <div className='space-y-3'>
                <Label>
                  Video CV (30-60 seconds) <span className='text-red-500'>*</span>
                </Label>

                <p className='text-sm text-gray-500'>
                  Record or upload a short introduction video (MP4, MOV, or WEBM - max 50MB).
                </p>

                <div className='flex flex-wrap items-center gap-3'>
                  <Button
                    type='button'
                    variant={isRecordingVideo ? 'destructive' : 'outline'}
                    onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                  >
                    <Video className='mr-2 h-4 w-4' />
                    {isRecordingVideo ? 'Stop Recording' : 'Record Video'}
                  </Button>

                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleVideoUploadClick}
                    disabled={isRecordingVideo}
                  >
                    <Upload className='mr-2 h-4 w-4' /> Upload Video
                  </Button>

                  {formData.videoCv?.previewUrl && (
                    <Button type='button' variant='ghost' onClick={resetVideoCv}>
                      <X className='mr-2 h-4 w-4' /> Remove
                    </Button>
                  )}
                </div>

                <input
                  ref={videoFileInputRef}
                  type='file'
                  accept='video/mp4,video/quicktime,video/webm'
                  className='hidden'
                  onChange={handleVideoUpload}
                />

                {isRecordingVideo && (
                  <div className='mt-4 space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-4'>
                    <div className='flex items-center justify-between'>
                      <h4 className='font-medium text-purple-900'>Recording in progress</h4>
                      <span className='text-sm font-semibold text-purple-700'>
                        {formatRecordingDuration(recordingDuration)} / {formatRecordingDuration(MAX_VIDEO_DURATION_SECONDS)}
                      </span>
                    </div>
                    <video
                      ref={videoPreviewRef}
                      className='w-full max-h-64 rounded-md bg-black'
                      autoPlay
                      muted
                      playsInline
                    />
                    <div className='flex gap-2'>
                      <Button type='button' variant='outline' onClick={cancelVideoRecording}>
                        Cancel
                      </Button>
                      <Button type='button' onClick={stopVideoRecording}>
                        Save Recording
                      </Button>
                    </div>
                  </div>
                )}

                {formData.videoCv?.previewUrl && !isRecordingVideo && (
                  <div className='mt-4 space-y-2 rounded-lg border border-gray-200 p-4'>
                    <video
                      src={formData.videoCv.previewUrl}
                      controls
                      className='w-full max-h-72 rounded-md bg-black'
                    />
                    <div className='flex flex-wrap gap-3 text-xs text-gray-500'>
                      <span>
                        {formData.videoCv.method === 'record' ? 'Recorded via camera' : 'Uploaded video'}
                      </span>
                      {formData.videoCv.duration ? (
                        <span>Duration: {formatRecordingDuration(formData.videoCv.duration)}</span>
                      ) : null}
                      {formData.videoCv.file ? (
                        <span>
                          Size: {((formData.videoCv.file?.size || 0) / 1024 / 1024).toFixed(2)} MB
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {formErrors.videoCv && (
                  <p className='text-sm text-red-500'>{formErrors.videoCv}</p>
                )}
              </div>

              {/* Documents Upload */}
              <div className='space-y-4'>
                <div>
                  <Label>
                    Documents Upload <span className='text-xs text-gray-500'>(images are auto-watermarked)</span>
                  </Label>
                </div>

                {/* Passport Photo Page (Required) */}
                <div className='space-y-2'>
                  <Label>
                    Passport photo page <span className='text-red-500'>*</span>
                  </Label>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => passportFileInputRef.current?.click()}
                    >
                      <Upload className='mr-2 h-4 w-4' /> Upload Image
                    </Button>
                    {formData.passportPhotoPage?.previewUrl && (
                      <Button type='button' variant='ghost' onClick={() => removeDoc('passportPhotoPage')}>
                        <X className='mr-2 h-4 w-4' /> Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={passportFileInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='hidden'
                    onChange={(e) => handleDocUpload('passportPhotoPage', e.target.files?.[0])}
                  />
                  {formData.passportPhotoPage?.previewUrl && (
                    <div className='mt-3'>
                      <img
                        src={formData.passportPhotoPage.previewUrl}
                        alt='Passport page preview'
                        className='max-h-64 rounded-md border'
                      />
                      <p className='text-xs text-gray-500 mt-1'>Watermark applied: "{WATERMARK_TEXT}"</p>
                    </div>
                  )}
                  {formErrors.passportPhotoPage && (
                    <p className='text-sm text-red-500'>{formErrors.passportPhotoPage}</p>
                  )}
                </div>

                {/* Reference Letter (Optional) */}
                <div className='space-y-2'>
                  <Label>Reference letter (optional)</Label>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => referenceFileInputRef.current?.click()}
                    >
                      <Upload className='mr-2 h-4 w-4' /> Upload Image
                    </Button>
                    {formData.referenceLetter?.previewUrl && (
                      <Button type='button' variant='ghost' onClick={() => removeDoc('referenceLetter')}>
                        <X className='mr-2 h-4 w-4' /> Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={referenceFileInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='hidden'
                    onChange={(e) => handleDocUpload('referenceLetter', e.target.files?.[0])}
                  />
                  {formData.referenceLetter?.previewUrl && (
                    <div className='mt-3'>
                      <img
                        src={formData.referenceLetter.previewUrl}
                        alt='Reference letter preview'
                        className='max-h-64 rounded-md border'
                      />
                      <p className='text-xs text-gray-500 mt-1'>Watermark applied: "{WATERMARK_TEXT}"</p>
                    </div>
                  )}
                </div>

                {/* Medical/Fitness certificate (optional at first, required before hire) */}
                <div className='space-y-2'>
                  <Label>Medical/Fitness certificate <span className='text-gray-500'>(optional now; required before hire)</span></Label>
                  <div className='flex flex-wrap items-center gap-3'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={() => medicalFileInputRef.current?.click()}
                    >
                      <Upload className='mr-2 h-4 w-4' /> Upload Image
                    </Button>
                    {formData.medicalCertificate?.previewUrl && (
                      <Button type='button' variant='ghost' onClick={() => removeDoc('medicalCertificate')}>
                        <X className='mr-2 h-4 w-4' /> Remove
                      </Button>
                    )}
                  </div>
                  <input
                    ref={medicalFileInputRef}
                    type='file'
                    accept='image/jpeg,image/png,image/webp'
                    className='hidden'
                    onChange={(e) => handleDocUpload('medicalCertificate', e.target.files?.[0])}
                  />
                  {formData.medicalCertificate?.previewUrl && (
                    <div className='mt-3'>
                      <img
                        src={formData.medicalCertificate.previewUrl}
                        alt='Medical certificate preview'
                        className='max-h-64 rounded-md border'
                      />
                      <p className='text-xs text-gray-500 mt-1'>Watermark applied: "{WATERMARK_TEXT}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Consent & Agreements */}
              <div className='space-y-3 pt-2'>
                <Label>Consent & Agreements</Label>
                <p className='text-sm text-gray-500'>Please read and accept each agreement to continue.</p>
                <div className='space-y-2'>
                  <div className='flex items-start gap-3'>
                    <Checkbox
                      id='consent-privacy-terms'
                      checked={!!formData.consentPrivacyTerms}
                      onCheckedChange={(v) =>
                        setFormData((prev) => ({ ...prev, consentPrivacyTerms: v === true }))
                      }
                    />
                    <label htmlFor='consent-privacy-terms' className='text-sm text-gray-700'>
                      I agree to the Privacy Policy and Terms of Service.
                    </label>
                  </div>
                  {formErrors.consentPrivacyTerms && (
                    <p className='text-xs text-red-500'>{formErrors.consentPrivacyTerms}</p>
                  )}

                  <div className='flex items-start gap-3'>
                    <Checkbox
                      id='consent-share-profile'
                      checked={!!formData.consentShareProfile}
                      onCheckedChange={(v) =>
                        setFormData((prev) => ({ ...prev, consentShareProfile: v === true }))
                      }
                    />
                    <label htmlFor='consent-share-profile' className='text-sm text-gray-700'>
                      I agree to share my profile with agencies and sponsors.
                    </label>
                  </div>
                  {formErrors.consentShareProfile && (
                    <p className='text-xs text-red-500'>{formErrors.consentShareProfile}</p>
                  )}

                  <div className='flex items-start gap-3'>
                    <Checkbox
                      id='consent-truthfulness'
                      checked={!!formData.consentTruthfulness}
                      onCheckedChange={(v) =>
                        setFormData((prev) => ({ ...prev, consentTruthfulness: v === true }))
                      }
                    />
                    <label htmlFor='consent-truthfulness' className='text-sm text-gray-700'>
                      I confirm all information provided is true.
                    </label>
                  </div>
                  {formErrors.consentTruthfulness && (
                    <p className='text-xs text-red-500'>{formErrors.consentTruthfulness}</p>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className='flex justify-between'>
        <Button
          variant='outline'
          onClick={() => {
            const tabs = [
              'personal',
              'professional',
              'experience',
              'additional',
            ];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex > 0) {
              setActiveTab(tabs[currentIndex - 1]);
            }
          }}
          disabled={activeTab === 'personal'}
        >
          Previous
        </Button>

        {activeTab === 'additional' ? (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <div className='animate-spin mr-2 h-4 w-4 border-2 border-b-transparent rounded-full' />
                Submitting...
              </>
            ) : (
              <>
                <Save className='mr-2 h-4 w-4' />
                {mode === 'agency-managed' ? 'Add Maid' : 'Complete Profile'}
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() => {
              const tabs = [
                'personal',
                'professional',
                'experience',
                'additional',
              ];
              const currentIndex = tabs.indexOf(activeTab);
              if (currentIndex < tabs.length - 1) {
                setActiveTab(tabs[currentIndex + 1]);
              }
            }}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};

export default UnifiedMaidForm;
