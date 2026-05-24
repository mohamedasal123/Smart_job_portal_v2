import { useCallback, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';
import { useToast } from '../../components/useToast';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { getParsedProfile, saveParsedProfile, uploadCv } from '../../services/jobSeekerDataService';
import { cvService } from '../../api/cvService';

const ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const POLL_INTERVAL_MS = 3000;   // poll every 3 seconds
const POLL_TIMEOUT_MS = 180000; // give up after 3 minutes

export default function JobSeekerCvUploadPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Upload State
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsed, setParsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Profile Data State (for editing)
  const [profileData, setProfileData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const pollingRef = useRef(null);
  const timeoutRef = useRef(null);
  const completionTimeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  // Edit Modes State
  const [editModes, setEditModes] = useState({
    personal: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
  });

  const [editPersonal, setEditPersonal] = useState({});
  const [editSummary, setEditSummary] = useState('');
  const [editExperience, setEditExperience] = useState([]);
  const [editEducation, setEditEducation] = useState([]);
  const [editSkills, setEditSkills] = useState({ hard: [], soft: [], tools: [] });
  const [newSkillText, setNewSkillText] = useState({ hard: '', soft: '', tools: '' });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
    if (completionTimeoutRef.current) {
      clearTimeout(completionTimeoutRef.current);
      completionTimeoutRef.current = null;
    }
  }, []);

  // Tracks mount state so the celebratory "100%" delay below can't write to
  // state on an unmounted component if the user navigates mid-upload.
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ── On mount: load any previously parsed profile ─────────────────────────────

  useEffect(() => {
    const checkStatusAndFetch = async () => {
      try {
        // 1. Check CV status first
        const res = await cvService.getCvStatus();
        const status = res?.data?.cv_parse_status ?? res?.cv_parse_status;

        // 2. If already completed, fetch the parsed data immediately
        if (status === 'completed' || status === 'done') {
          const data = await getParsedProfile();
          if (data) {
            setProfileData(data);
            setParsed(true);
          }
        }
      } catch (error) {
        console.error('Error initializing CV profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    checkStatusAndFetch();

    return () => stopPolling();
  }, [stopPolling]);

  // ── File helpers ──────────────────────────────────────────────────────────────

  const validateFile = (f) => {
    if (!ALLOWED_TYPES.includes(f.type)) {
      return 'Invalid file type. Please upload a PDF or DOCX file.';
    }
    if (f.size > MAX_SIZE) {
      return `File size exceeds 5MB (${(f.size / 1024 / 1024).toFixed(1)}MB).`;
    }
    return '';
  };

  const handleFile = useCallback((f) => {
    const error = validateFile(f);
    if (error) {
      setFileError(error);
      setFile(null);
      return;
    }
    setFileError('');
    setFile(f);
    setParsed(false);
    setUploadProgress(0);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  // ── Upload + polling ──────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!file) return;

    stopPolling();
    setUploading(true);
    setUploadProgress(0);
    setParsed(false);

    try {
      setUploadProgress(25);
      await uploadCv(file);
      setUploadProgress(50);

      // ── Start polling /api/cv/status directly ──────────────────────────────
      pollingRef.current = setInterval(async () => {
        try {
          // cvService.getCvStatus() → apiRequest('/cv/status') → GET /api/cv/status
          const res = await cvService.getCvStatus();
          // Laravel envelope: { success, data: { cv_parse_status, resume_file_url } }
          const status = res?.data?.cv_parse_status ?? res?.cv_parse_status;

          setUploadProgress(75);

          if (status === 'completed') {
            stopPolling();

            try {
              // Fetch the structured parsed data
              const parsedData = await getParsedProfile();
              setProfileData(parsedData);

              // Ensure progress reaches 100% visibly before unmounting
              setUploadProgress(100);

              completionTimeoutRef.current = setTimeout(() => {
                completionTimeoutRef.current = null;
                if (!isMountedRef.current) return;
                setParsed(true);
                setUploading(false);
              }, 600); // 600ms delay to let the user see 100%

            } catch (fetchErr) {
              console.error('Error fetching parsed data after completion:', fetchErr);
              setUploading(false);
              addToast({
                title: 'Data Fetch Error',
                message: 'The CV was parsed, but we could not load the data. Please refresh.',
                type: 'error',
              });
            }

          } else if (status === 'failed') {
            stopPolling();
            setUploading(false);
            addToast({
              title: 'Parsing failed',
              message: 'The AI could not parse your CV. Please ensure the file contains valid text.',
              type: 'error',
            });
          }
          // status === 'processing' → keep polling
        } catch (pollErr) {
          console.error('CV status poll error:', pollErr);
          // Do NOT stop polling on transient network errors — keep retrying
        }
      }, POLL_INTERVAL_MS);

      // ── Hard timeout: stop after POLL_TIMEOUT_MS ───────────────────────────
      timeoutRef.current = setTimeout(() => {
        if (pollingRef.current) {
          stopPolling();
          setUploading(false);
          addToast({
            title: 'Parsing timed out',
            message: 'The CV parsing is taking too long. Please refresh the page and try again.',
            type: 'error',
          });
        }
      }, POLL_TIMEOUT_MS);

    } catch (err) {
      setUploading(false);
      if (err.response?.status === 429 || err.status === 429) {
        addToast({ title: 'Too Many Requests', message: 'Please wait a minute before trying again.', type: 'error' });
      } else {
        addToast({ title: 'Upload failed', message: 'Could not upload your CV. Please try again.', type: 'error' });
      }
    }
  };

  const handleReupload = () => {
    setFile(null);
    setFileError('');
    setParsed(false);
    setUploadProgress(0);
    setEditModes({ personal: false, summary: false, experience: false, education: false, skills: false });
  };

  // Inline Editing Methods
  const toggleEdit = (section) => {
    if (!profileData) return;
    if (section === 'personal') setEditPersonal({ ...profileData.personalInfo });
    if (section === 'summary') setEditSummary(profileData.summary || '');
    if (section === 'experience') setEditExperience(Array.isArray(profileData.experience) ? [...profileData.experience] : []);
    if (section === 'education') setEditEducation(Array.isArray(profileData.education) ? [...profileData.education] : []);
    if (section === 'skills') setEditSkills({
      hard: Array.isArray(profileData.skills?.hard) ? [...profileData.skills.hard] : [],
      soft: Array.isArray(profileData.skills?.soft) ? [...profileData.skills.soft] : [],
      tools: Array.isArray(profileData.skills?.tools) ? [...profileData.skills.tools] : [],
    });
    setNewSkillText({ hard: '', soft: '', tools: '' });

    setEditModes(prev => ({ ...prev, [section]: true }));
  };

  const cancelEdit = (section) => {
    setEditModes(prev => ({ ...prev, [section]: false }));
  };

  const saveSection = (section) => {
    if (section === 'personal') {
      if (!editPersonal.firstName?.trim() || !editPersonal.lastName?.trim() || !editPersonal.title?.trim() || !editPersonal.email?.trim()) {
        addToast({ title: 'Validation Error', message: 'First name, last name, title, and email are required.', type: 'error' });
        return;
      }
      setProfileData(prev => ({ ...prev, personalInfo: editPersonal }));
    }
    if (section === 'summary') {
      setProfileData(prev => ({ ...prev, summary: editSummary }));
    }
    if (section === 'experience') {
      const invalid = editExperience.some(e => !e.title?.trim() || !e.company?.trim());
      if (invalid && editExperience.length > 0) {
        addToast({ title: 'Validation Error', message: 'Job title and company are required for all experience entries.', type: 'error' });
        return;
      }
      setProfileData(prev => ({ ...prev, experience: editExperience }));
    }
    if (section === 'education') {
      const invalid = editEducation.some(e => !e.degree?.trim() || !e.institution?.trim());
      if (invalid && editEducation.length > 0) {
        addToast({ title: 'Validation Error', message: 'Degree and institution are required for all education entries.', type: 'error' });
        return;
      }
      setProfileData(prev => ({ ...prev, education: editEducation }));
    }
    if (section === 'skills') {
      setProfileData(prev => ({ ...prev, skills: editSkills }));
    }
    setEditModes(prev => ({ ...prev, [section]: false }));
  };

  const handleFinalSave = async () => {
    if (Object.values(editModes).some(v => v)) {
      addToast({ title: 'Unsaved Changes', message: 'Please save or cancel your section edits before confirming.', type: 'warning' });
      return;
    }
    setIsSubmitting(true);
    try {
      await saveParsedProfile(profileData);
      addToast({ title: 'Profile Created', message: 'Your AI-parsed CV has been confirmed and saved.', type: 'success' });
      navigate(ROUTES.SEEKER_DASHBOARD);
    } catch {
      addToast({ title: 'Error', message: 'Failed to save profile.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex flex-col h-full space-y-stack-lg pb-12">
      <SeekerPageHeader
        title="Upload Resume"
        subtitle="Upload your CV and let our AI instantly extract your skills, experience, and education to build your profile."
        icon="upload_file"
      />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-gutter items-start">
        {/* Left Column: Upload */}
        <div className="xl:col-span-4 flex flex-col gap-stack-lg sticky top-24">
          <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-outline-variant">
            <h2 className="font-h3 text-h3 text-primary mb-stack-md">Document Upload</h2>
            {/* Drag & Drop Zone */}
            <div
              className={`border-2 border-dashed ${dragOver ? 'border-secondary bg-surface-container-low' : fileError ? 'border-error bg-error-container/10' : 'border-outline-variant bg-surface'} rounded-lg p-stack-lg flex flex-col items-center justify-center text-center cursor-pointer hover:border-secondary hover:bg-surface-container-low transition-all group ${parsed ? 'opacity-50 pointer-events-none' : ''}`}
              onDrop={!parsed ? handleDrop : undefined}
              onDragOver={!parsed ? handleDragOver : undefined}
              onDragLeave={!parsed ? handleDragLeave : undefined}
              onClick={() => !parsed && fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (parsed) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={parsed ? -1 : 0}
              aria-label="Upload your CV — PDF or DOCX, up to 5 MB"
              aria-disabled={parsed}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                aria-label="Choose a CV file to upload"
                onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); }}
              />
              <div className="bg-surface-container rounded-full p-stack-sm mb-stack-md group-hover:bg-secondary-container transition-colors">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-secondary transition-colors">cloud_upload</span>
              </div>
              {file ? (
                <>
                  <span className="font-h3 text-h3 text-primary mb-unit flex items-center gap-2 line-clamp-1 break-all">
                    <span className="material-symbols-outlined text-secondary">description</span>
                    {file.name}
                  </span>
                  <span className="font-body-md text-body-md text-on-surface-variant">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </>
              ) : (
                <>
                  <span className="font-h3 text-h3 text-primary mb-unit">Drag &amp; drop your CV here</span>
                  <span className="font-body-md text-body-md text-on-surface-variant mb-stack-md">or click to browse from your device</span>
                </>
              )}
            </div>

            {/* File Error */}
            {fileError && !parsed && (
              <div className="mt-stack-sm flex items-start gap-2 p-stack-sm bg-error-container rounded-lg border border-error/20">
                <span className="material-symbols-outlined text-error text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
                <p className="font-body-md text-body-md text-on-error-container text-sm">{fileError}</p>
              </div>
            )}

            {/* Active Parsing State */}
            {uploading && (
              <div className="mt-stack-lg bg-surface-container-low border border-outline-variant rounded-lg p-stack-md relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-secondary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                <div className="flex items-start gap-stack-md">
                  <span className="material-symbols-outlined text-secondary animate-pulse mt-1">auto_awesome</span>
                  <div>
                    <h3 className="font-h3 text-h3 text-primary mb-1">AI is parsing your resume...</h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">Extracting structured data from "{file?.name}"</p>
                    <div className="mt-stack-sm flex items-center gap-stack-sm">
                      <span className="material-symbols-outlined text-on-surface-variant text-[16px]">check_circle</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Identifying core competencies ({uploadProgress}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Parsed Success */}
            {parsed && !uploading && (
              <div className="mt-stack-lg bg-green-50 border border-green-200 rounded-lg p-stack-md flex items-start gap-stack-md">
                <span className="material-symbols-outlined text-green-600" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                <div>
                  <h3 className="font-h3 text-h3 text-green-800">Parsing Complete!</h3>
                  <p className="font-body-md text-body-md text-green-700">Your resume has been successfully analyzed. Review your profile preview.</p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-stack-lg pt-stack-md border-t border-outline-variant">
              {!parsed ? (
                <button
                  className={`w-full bg-secondary text-on-secondary font-body-lg text-body-lg font-bold py-stack-sm rounded-lg hover:bg-secondary-container transition-all flex justify-center items-center gap-stack-sm ${(!file || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!file || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                      Parsing...
                    </>
                  ) : (
                    <>Upload &amp; Analyze CV <span className="material-symbols-outlined text-[20px]">cloud_upload</span></>
                  )}
                </button>
              ) : (
                <button
                  className="w-full bg-transparent border border-outline-variant text-on-surface-variant font-body-md text-body-md py-stack-sm rounded-lg hover:bg-surface-container-low transition-colors flex justify-center items-center gap-2"
                  onClick={handleReupload}
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span> Re-upload CV
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Profile Preview / Editor */}
        <div className="xl:col-span-8">
          <div className={`bg-surface-container-lowest rounded-xl p-stack-lg shadow-sm border border-outline-variant transition-opacity ${parsed ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex justify-between items-center mb-stack-lg pb-stack-md border-b border-outline-variant">
              <div>
                <h2 className="font-h2 text-h2 text-primary">Live Profile Preview</h2>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">Review and edit the AI-extracted CV data before saving it to your profile.</p>
              </div>
            </div>

            {loadingProfile ? (
              <div className="py-12 flex justify-center"><span className="material-symbols-outlined animate-spin text-[32px] text-secondary">progress_activity</span></div>
            ) : profileData ? (
              <div className="space-y-stack-lg">

                {/* --- PERSONAL INFORMATION --- */}
                <section className="border border-outline-variant rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-outline-variant pb-2 gap-2">
                    <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">person</span>
                      <span className="truncate">Personal Information</span>
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">AI Extracted</span>
                    </h3>
                    {!editModes.personal && (
                      <button onClick={() => toggleEdit('personal')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    )}
                  </div>
                  {editModes.personal ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-label-md text-on-surface-variant mb-1">First Name *</label>
                          <input type="text" value={editPersonal.firstName || ''} onChange={e => setEditPersonal({ ...editPersonal, firstName: e.target.value })} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                        </div>
                        <div>
                          <label className="block font-label-md text-on-surface-variant mb-1">Last Name *</label>
                          <input type="text" value={editPersonal.lastName || ''} onChange={e => setEditPersonal({ ...editPersonal, lastName: e.target.value })} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                        </div>
                        <div>
                          <label className="block font-label-md text-on-surface-variant mb-1">Professional Title *</label>
                          <input type="text" value={editPersonal.title || ''} onChange={e => setEditPersonal({ ...editPersonal, title: e.target.value })} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                        </div>
                        <div>
                          <label className="block font-label-md text-on-surface-variant mb-1">Email *</label>
                          <input type="email" value={editPersonal.email || ''} onChange={e => setEditPersonal({ ...editPersonal, email: e.target.value })} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                        </div>
                        <div>
                          <label className="block font-label-md text-on-surface-variant mb-1">Phone</label>
                          <input type="text" value={editPersonal.phone || ''} onChange={e => setEditPersonal({ ...editPersonal, phone: e.target.value })} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                        </div>
                        <div>
                          <label className="block font-label-md text-on-surface-variant mb-1">Location</label>
                          <input type="text" value={editPersonal.location || ''} onChange={e => setEditPersonal({ ...editPersonal, location: e.target.value })} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                        <button onClick={() => cancelEdit('personal')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">Cancel</button>
                        <button onClick={() => saveSection('personal')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">Save Section</button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><p className="font-label-sm text-on-surface-variant">Full Name</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.firstName} {profileData.personalInfo?.lastName}</p></div>
                      <div><p className="font-label-sm text-on-surface-variant">Professional Title</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.title}</p></div>
                      <div><p className="font-label-sm text-on-surface-variant">Email</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.email}</p></div>
                      <div><p className="font-label-sm text-on-surface-variant">Phone</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.phone || '-'}</p></div>
                      <div><p className="font-label-sm text-on-surface-variant">Location</p><p className="font-body-md text-on-surface">{profileData.personalInfo?.location || '-'}</p></div>
                    </div>
                  )}
                </section>

                {/* --- SUMMARY/ABOUT --- */}
                <section className="border border-outline-variant rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-outline-variant pb-2 gap-2">
                    <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">notes</span>
                      <span className="truncate">Summary</span>
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">AI Extracted</span>
                    </h3>
                    {!editModes.summary && (
                      <button onClick={() => toggleEdit('summary')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    )}
                  </div>
                  {editModes.summary ? (
                    <div className="space-y-4">
                      <textarea rows="4" value={editSummary} onChange={e => setEditSummary(e.target.value)} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary resize-y" />
                      <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
                        <button onClick={() => cancelEdit('summary')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">Cancel</button>
                        <button onClick={() => saveSection('summary')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">Save Section</button>
                      </div>
                    </div>
                  ) : (
                    <p className="font-body-md text-on-surface">{profileData.summary || 'No summary provided.'}</p>
                  )}
                </section>

                {/* --- WORK EXPERIENCE --- */}
                <section className="border border-outline-variant rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-outline-variant pb-2 gap-2">
                    <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">work_history</span>
                      <span className="truncate">Experience History</span>
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">AI Extracted</span>
                    </h3>
                    {!editModes.experience && (
                      <button onClick={() => toggleEdit('experience')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    )}
                  </div>
                  {editModes.experience ? (
                    <div className="space-y-6">
                      {editExperience.map((exp, index) => (
                        <div key={index} className="bg-surface-variant/20 p-4 rounded-lg border border-outline-variant relative group">
                          <button onClick={() => setEditExperience(editExperience.filter((_, i) => i !== index))} className="absolute top-2 right-2 p-1 text-on-surface-variant hover:text-error rounded-full transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div><label className="block font-label-md text-on-surface-variant mb-1">Job Title *</label><input type="text" value={exp.title || ''} onChange={e => { const newE = [...editExperience]; newE[index].title = e.target.value; setEditExperience(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div><label className="block font-label-md text-on-surface-variant mb-1">Company *</label><input type="text" value={exp.company || ''} onChange={e => { const newE = [...editExperience]; newE[index].company = e.target.value; setEditExperience(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div><label className="block font-label-md text-on-surface-variant mb-1">Start Year</label><input type="text" value={exp.startYear || ''} onChange={e => { const newE = [...editExperience]; newE[index].startYear = e.target.value; setEditExperience(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div><label className="block font-label-md text-on-surface-variant mb-1">End Year</label><input type="text" value={exp.endYear || ''} onChange={e => { const newE = [...editExperience]; newE[index].endYear = e.target.value; setEditExperience(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div className="md:col-span-2"><label className="block font-label-md text-on-surface-variant mb-1">Description</label><textarea rows="3" value={exp.description || ''} onChange={e => { const newE = [...editExperience]; newE[index].description = e.target.value; setEditExperience(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary resize-y" /></div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setEditExperience([...editExperience, { id: Date.now(), title: '', company: '', startYear: '', endYear: '', description: '' }])} className="w-full py-2 border border-dashed border-outline-variant text-on-surface-variant rounded-lg hover:border-secondary hover:text-secondary flex justify-center items-center gap-1 font-label-md transition-colors"><span className="material-symbols-outlined text-[18px]">add</span> Add Experience</button>
                      <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                        <button onClick={() => cancelEdit('experience')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">Cancel</button>
                        <button onClick={() => saveSection('experience')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">Save Section</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(profileData?.experience) && profileData.experience.length > 0 ? profileData.experience.map((exp, i) => (
                        <div key={exp.id || i} className="border-b border-surface-variant pb-3 last:border-0 last:pb-0">
                          <h4 className="font-body-lg font-bold text-primary">{exp.title}</h4>
                          <p className="font-body-md text-on-surface-variant">{exp.company} &bull; {exp.startYear} - {exp.endYear}</p>
                          {exp.description && <p className="font-body-sm text-on-surface mt-1 whitespace-pre-wrap">{exp.description}</p>}
                        </div>
                      )) : profileData?.experienceRaw ? (
                        <p className="font-body-md text-on-surface whitespace-pre-wrap">{profileData.experienceRaw}</p>
                      ) : (
                        <p className="text-on-surface-variant text-sm">No experience extracted.</p>
                      )}
                    </div>
                  )}
                </section>

                {/* --- EDUCATION --- */}
                <section className="border border-outline-variant rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-outline-variant pb-2 gap-2">
                    <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">school</span>
                      <span className="truncate">Education</span>
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">AI Extracted</span>
                    </h3>
                    {!editModes.education && (
                      <button onClick={() => toggleEdit('education')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    )}
                  </div>
                  {editModes.education ? (
                    <div className="space-y-6">
                      {editEducation.map((edu, index) => (
                        <div key={index} className="bg-surface-variant/20 p-4 rounded-lg border border-outline-variant relative group">
                          <button onClick={() => setEditEducation(editEducation.filter((_, i) => i !== index))} className="absolute top-2 right-2 p-1 text-on-surface-variant hover:text-error rounded-full transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div><label className="block font-label-md text-on-surface-variant mb-1">Degree *</label><input type="text" value={edu.degree || ''} onChange={e => { const newE = [...editEducation]; newE[index].degree = e.target.value; setEditEducation(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div><label className="block font-label-md text-on-surface-variant mb-1">Institution *</label><input type="text" value={edu.institution || ''} onChange={e => { const newE = [...editEducation]; newE[index].institution = e.target.value; setEditEducation(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div><label className="block font-label-md text-on-surface-variant mb-1">Start Year</label><input type="text" value={edu.startYear || ''} onChange={e => { const newE = [...editEducation]; newE[index].startYear = e.target.value; setEditEducation(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                            <div><label className="block font-label-md text-on-surface-variant mb-1">End Year</label><input type="text" value={edu.endYear || ''} onChange={e => { const newE = [...editEducation]; newE[index].endYear = e.target.value; setEditEducation(newE); }} className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 outline-none focus:border-secondary" /></div>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => setEditEducation([...editEducation, { id: Date.now(), degree: '', institution: '', startYear: '', endYear: '' }])} className="w-full py-2 border border-dashed border-outline-variant text-on-surface-variant rounded-lg hover:border-secondary hover:text-secondary flex justify-center items-center gap-1 font-label-md transition-colors"><span className="material-symbols-outlined text-[18px]">add</span> Add Education</button>
                      <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                        <button onClick={() => cancelEdit('education')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">Cancel</button>
                        <button onClick={() => saveSection('education')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">Save Section</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Array.isArray(profileData?.education) && profileData.education.length > 0 ? profileData.education.map((edu, i) => (
                        <div key={edu.id || i} className="border-b border-surface-variant pb-3 last:border-0 last:pb-0">
                          <h4 className="font-body-lg font-bold text-primary">{edu.degree}</h4>
                          <p className="font-body-md text-on-surface-variant">{edu.institution} &bull; {edu.startYear} - {edu.endYear}</p>
                        </div>
                      )) : profileData?.educationRaw ? (
                        <p className="font-body-md text-on-surface whitespace-pre-wrap">{profileData.educationRaw}</p>
                      ) : (
                        <p className="text-on-surface-variant text-sm">No education extracted.</p>
                      )}
                    </div>
                  )}
                </section>

                {/* --- SKILLS --- */}
                <section className="border border-outline-variant rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-outline-variant pb-2 gap-2">
                    <h3 className="font-h3 text-h3 text-primary flex items-center gap-2 min-w-0">
                      <span className="material-symbols-outlined text-secondary text-[20px] shrink-0">psychology</span>
                      <span className="truncate">Skills</span>
                      <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ml-2">AI Extracted</span>
                    </h3>
                    {!editModes.skills && (
                      <button onClick={() => toggleEdit('skills')} className="text-on-surface-variant hover:text-secondary flex items-center gap-1 transition-colors font-label-sm shrink-0">
                        <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                      </button>
                    )}
                  </div>
                  {editModes.skills ? (
                    <div className="space-y-6">
                      {['hard', 'soft', 'tools'].map((cat) => (
                        <div key={cat} className="space-y-2">
                          <label className="block font-label-md text-on-surface-variant capitalize">{cat} Skills</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {editSkills[cat].map((skill, idx) => (
                              <span key={idx} className="bg-secondary-container/30 text-on-secondary-container px-3 py-1 rounded-full font-label-sm border border-secondary/20 flex items-center gap-1">
                                {skill}
                                <button onClick={() => setEditSkills({ ...editSkills, [cat]: editSkills[cat].filter((_, i) => i !== idx) })} className="hover:text-error transition-colors"><span className="material-symbols-outlined text-[14px]">close</span></button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input type="text" value={newSkillText[cat]} onChange={e => setNewSkillText({ ...newSkillText, [cat]: e.target.value })} onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newSkillText[cat].trim()) {
                                  setEditSkills({ ...editSkills, [cat]: [...editSkills[cat], newSkillText[cat].trim()] });
                                  setNewSkillText({ ...newSkillText, [cat]: '' });
                                }
                              }
                            }} placeholder={`Add new ${cat} skill...`} className="flex-1 bg-surface border border-outline-variant rounded-lg px-3 py-1.5 outline-none focus:border-secondary text-sm" />
                            <button type="button" onClick={() => {
                              if (newSkillText[cat].trim()) {
                                setEditSkills({ ...editSkills, [cat]: [...editSkills[cat], newSkillText[cat].trim()] });
                                setNewSkillText({ ...newSkillText, [cat]: '' });
                              }
                            }} className="px-3 py-1.5 border border-outline-variant rounded text-on-surface font-label-sm hover:bg-surface-container-low">Add</button>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-end gap-2 pt-4 border-t border-outline-variant">
                        <button onClick={() => cancelEdit('skills')} className="px-4 py-1.5 rounded text-on-surface border border-outline-variant hover:bg-surface-container-low font-label-md">Cancel</button>
                        <button onClick={() => saveSection('skills')} className="px-4 py-1.5 rounded bg-secondary text-on-secondary hover:bg-secondary-container font-label-md">Save Section</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {['hard', 'soft', 'tools'].map((cat) => {
                        if (Array.isArray(profileData.skills?.[cat])) {
                          return profileData.skills[cat].length > 0 && (
                            <div key={cat}>
                              <p className="font-label-sm text-on-surface-variant mb-2 capitalize">{cat} Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {profileData.skills[cat].map((skill, idx) => (
                                  <span key={idx} className="bg-surface-container-low border border-outline-variant px-3 py-1 rounded-full text-sm text-on-surface">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          );
                        } else if (profileData.skills?.[cat]) {
                          return (
                            <div key={cat}>
                              <p className="font-label-sm text-on-surface-variant mb-2 capitalize">{cat} Skills</p>
                              <p className="font-body-md text-on-surface">{profileData.skills[cat]}</p>
                            </div>
                          );
                        }
                        return null;
                      })}
                      {(!profileData.skills || (!profileData.skills.hard?.length && !profileData.skills.soft?.length && !profileData.skills.tools?.length)) && (
                        <p className="text-on-surface-variant text-sm">No skills extracted.</p>
                      )}
                    </div>
                  )}
                </section>

                {/* Final Actions */}
                <div className="flex justify-end gap-4 mt-4 pt-6 border-t border-outline-variant">
                  <button
                    onClick={handleFinalSave}
                    disabled={isSubmitting}
                    className="px-8 py-2.5 rounded-lg bg-secondary text-on-secondary hover:bg-secondary-container transition-colors disabled:opacity-50 font-label-md flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? <><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span> Confirming...</> : 'Confirm & Save Profile'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
