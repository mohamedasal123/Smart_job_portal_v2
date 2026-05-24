import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { Link, useLocation } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import SeekerApplicationCard from '../../components/jobSeeker/SeekerApplicationCard';
import SeekerEmptyState from '../../components/jobSeeker/SeekerEmptyState';
import SeekerJobCard from '../../components/jobSeeker/SeekerJobCard';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { useToast } from '../../components/useToast';
import Stagger from '../../motion/Stagger';
import {
  addSkill,
  getApplications,
  getNotifications,
  getProfile,
  getSavedJobs,
  getSkills,
  getSuggestedSkills,
  removeSkill,
  updateProfile,
  uploadProfileMedia,
} from '../../services/jobSeekerDataService';
import { ROUTES } from '../../utils/constants';

const APPLICATION_TABS = [
  { value: 'all', label: 'All Applications' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'approved', label: 'Approved' },
  { value: 'interview', label: 'Interview' },
  { value: 'rejected', label: 'Rejected' },
];

const PROFILE_TABS = [
  { value: 'overview', label: 'Overview', icon: 'person' },
  { value: 'saved', label: 'Saved Jobs', icon: 'bookmark' },
  { value: 'applications', label: 'Applications', icon: 'work_history' },
  { value: 'skills', label: 'Skills', icon: 'psychology' },
];

const HASH_TO_TAB = {
  '#about': 'overview',
  '#experience': 'overview',
  '#saved-jobs': 'saved',
  '#applications': 'applications',
  '#skills': 'skills',
};

const SKILL_CATEGORY_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'technical', label: 'Technical' },
  { value: 'soft_skill', label: 'Soft Skills' },
  { value: 'tool', label: 'Tools' },
];

const SKILL_CATEGORY_OPTIONS = [
  { value: 'technical', label: 'Technical Skill' },
  { value: 'soft_skill', label: 'Soft Skill' },
  { value: 'tool', label: 'Tool / Platform' },
];

function FullPageSpinner() {
  return (
    <div className="flex h-full items-center justify-center p-12" role="status" aria-live="polite">
      <span className="material-symbols-outlined animate-spin text-[48px] text-secondary" aria-hidden="true">progress_activity</span>
      <span className="sr-only">Loading profile...</span>
    </div>
  );
}

function InlineField({ label, value, icon, onSave, multiline = false, type = 'text', placeholder = 'Add information' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="group rounded-xl border border-outline-variant bg-surface-container-low p-stack-md transition-colors hover:border-secondary/50">
      <div className="mb-unit flex items-center justify-between gap-3">
        <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
          {icon && <span className="material-symbols-outlined text-[16px] text-secondary">{icon}</span>}
          {label}
        </p>
        {!editing && (
          <button className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-secondary transition-opacity" onClick={() => setEditing(true)} type="button">
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-stack-sm">
          {multiline ? (
            <textarea
              className="w-full min-h-28 resize-y rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              onChange={(event) => setDraft(event.target.value)}
              placeholder={placeholder}
              value={draft}
            />
          ) : (
            <input
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              onChange={(event) => setDraft(event.target.value)}
              placeholder={placeholder}
              type={type}
              value={draft}
            />
          )}
          <div className="flex justify-end gap-unit">
            <button className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-on-surface-variant hover:bg-surface-container-low" onClick={() => { setDraft(value || ''); setEditing(false); }} type="button">
              Cancel
            </button>
            <button className="rounded-lg bg-secondary px-3 py-1.5 font-label-sm text-on-secondary hover:opacity-90 disabled:opacity-60" disabled={saving} onClick={save} type="button">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="font-body-md text-primary leading-relaxed break-words">{value || <span className="text-on-surface-variant">{placeholder}</span>}</p>
      )}
    </div>
  );
}

function NameEditor({ profile, onSave }) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile.firstName || '');
  const [lastName, setLastName] = useState(profile.lastName || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFirstName(profile.firstName || '');
    setLastName(profile.lastName || '');
  }, [profile.firstName, profile.lastName]);

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ firstName, lastName });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="max-w-xl space-y-stack-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-stack-sm">
          <input className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" onChange={(event) => setFirstName(event.target.value)} placeholder="First name" value={firstName} />
          <input className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" onChange={(event) => setLastName(event.target.value)} placeholder="Last name" value={lastName} />
        </div>
        <div className="flex flex-col gap-unit sm:flex-row sm:justify-end">
          <button className="rounded-lg border border-outline-variant px-3 py-1.5 font-label-sm text-on-surface-variant hover:bg-surface-container-low" onClick={() => { setFirstName(profile.firstName || ''); setLastName(profile.lastName || ''); setEditing(false); }} type="button">Cancel</button>
          <button className="rounded-lg bg-secondary px-3 py-1.5 font-label-sm text-on-secondary hover:opacity-90 disabled:opacity-60" disabled={saving} onClick={save} type="button">{saving ? 'Saving...' : 'Save Name'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-stack-sm">
      <h1 className="font-display text-h2 text-primary">{profile.firstName} {profile.lastName}</h1>
      <button className="mt-1 text-secondary" onClick={() => setEditing(true)} type="button">
        <span className="material-symbols-outlined text-[18px]">edit</span>
      </button>
    </div>
  );
}

function SkillChip({ skill, onEdit, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1.5 font-body-md text-sm text-primary group">
      {skill.name}
      <span className="material-symbols-outlined text-[14px] text-secondary" title={skill.source === 'cv_parsed' ? 'Extracted from CV' : 'Added manually'}>
        {skill.source === 'cv_parsed' ? 'smart_toy' : 'person_add'}
      </span>
      <button className="text-outline hover:text-secondary opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onEdit(skill)} type="button">
        <span className="material-symbols-outlined text-[16px]">edit</span>
      </button>
      <button className="text-outline hover:text-error opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onRemove(skill)} type="button">
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </span>
  );
}

function Section({ id, title, icon, children, actions }) {
  return (
    <section id={id} className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient p-6 scroll-mt-24">
      <div className="mb-stack-md flex flex-col gap-stack-sm sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-h2 text-h2 text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">{icon}</span>
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  );
}

export default function JobSeekerProfilePage() {
  const { addToast } = useToast();
  const location = useLocation();
  const { patchUser, refreshUser } = useAuth();
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [skills, setSkills] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [applicationFilter, setApplicationFilter] = useState('all');
  const [activeProfileTab, setActiveProfileTab] = useState(HASH_TO_TAB[location.hash] || 'overview');
  const [newSkill, setNewSkill] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('technical');
  const [editingSkill, setEditingSkill] = useState(null);
  const [suggestionCategory, setSuggestionCategory] = useState('all');
  const [skillPendingRemoval, setSkillPendingRemoval] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileData, savedJobsData, applicationsData, skillsData, suggestedData, notificationsData] = await Promise.all([
        getProfile(),
        getSavedJobs(),
        getApplications(),
        getSkills(),
        getSuggestedSkills(),
        getNotifications().catch(() => []),
      ]);
      setProfile(profileData);
      setSavedJobs(savedJobsData.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)));
      setApplications(applicationsData.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt)));
      setNotifications(notificationsData);
      setSkills(skillsData);
      setSuggested(suggestedData);
    } catch (error) {
      console.error('Error loading profile:', error);
      addToast({ title: 'Error', message: 'Failed to load your profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    const refreshNotifications = () => {
      getNotifications()
        .then((items) => {
          if (isMounted) setNotifications(items);
        })
        .catch(console.error);
    };

    const interval = window.setInterval(refreshNotifications, 30000);
    window.addEventListener('notifications_updated', refreshNotifications);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
      window.removeEventListener('notifications_updated', refreshNotifications);
    };
  }, []);

  useEffect(() => {
    if (location.hash && HASH_TO_TAB[location.hash]) {
      setActiveProfileTab(HASH_TO_TAB[location.hash]);
    }
  }, [location.hash]);

  useEffect(() => {
    if (!loading && location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeProfileTab, loading, location.hash]);

  const saveProfilePatch = async (patch) => {
    try {
      const response = await updateProfile(patch);
      setProfile(response.data);
      addToast({ title: 'Profile updated', message: 'Your changes were saved.', type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', message: error.message || 'Failed to save profile.', type: 'error' });
      throw error;
    }
  };

  const handleMediaUpload = async (type, file) => {
    if (!file) return;
    setUploading(type);
    try {
      const result = await uploadProfileMedia(type, file);
      setProfile((prev) => ({
        ...prev,
        avatar: result.avatar || prev.avatar,
        coverImage: result.coverImage || prev.coverImage,
      }));
      if (type !== 'cover' && result.avatar) {
        patchUser({ profile_image: result.avatar, avatar: result.avatar });
      }
      addToast({ title: 'Image updated', message: type === 'cover' ? 'Cover image updated.' : 'Profile photo updated.', type: 'success' });
      await refreshUser();
    } catch (error) {
      addToast({ title: 'Upload failed', message: error.message || 'Please upload a valid image under 2MB.', type: 'error' });
    } finally {
      setUploading(null);
    }
  };

  const handleAddSkill = async (event) => {
    event.preventDefault();
    const skillName = newSkill.trim();
    if (!skillName) return;
    if (skills.some((skill) => skill.id !== editingSkill?.id && skill.name.toLowerCase() === skillName.toLowerCase())) {
      addToast({ title: 'Duplicate skill', message: 'This skill is already listed.', type: 'error' });
      return;
    }
    const existingSkill = suggested.find((skill) => skill.name.toLowerCase() === skillName.toLowerCase());
    const targetSkill = existingSkill
      ? { ...existingSkill, category: newSkillCategory === 'tool' ? 'tool' : existingSkill.category || newSkillCategory }
      : { name: skillName, category: newSkillCategory, source: 'manual' };

    try {
      const saved = await addSkill(targetSkill);
      const nextSkill = saved.data || targetSkill;
      if (editingSkill) {
        if (editingSkill.id && editingSkill.id !== nextSkill.id) {
          await removeSkill(editingSkill.id);
        }
        setSkills((prev) => prev.map((skill) => skill.id === editingSkill.id ? nextSkill : skill));
        addToast({ title: 'Skill updated', message: `${skillName} was saved.`, type: 'success' });
      } else {
        setSkills((prev) => [...prev, nextSkill]);
        addToast({ title: 'Skill added', message: `${skillName} was added to your profile.`, type: 'success' });
      }
      setNewSkill('');
      setNewSkillCategory('technical');
      setEditingSkill(null);
    } catch (error) {
      addToast({ title: 'Error', message: error.message || 'Could not save this skill.', type: 'error' });
    }
  };

  const addSuggestedSkill = async (skill) => {
    if (skills.some((item) => item.name.toLowerCase() === skill.name.toLowerCase())) return;
    try {
      const nextSkill = { id: skill.id, name: skill.name, category: skill.category, source: 'manual' };
      const saved = await addSkill(nextSkill);
      setSkills((prev) => [...prev, saved.data || nextSkill]);
      addToast({ title: 'Skill added', message: `${skill.name} was added to your profile.`, type: 'success' });
    } catch (error) {
      addToast({ title: 'Error', message: error.message || 'Could not add this skill.', type: 'error' });
    }
  };

  const confirmRemoveSkill = async () => {
    if (!skillPendingRemoval) return;
    try {
      await removeSkill(skillPendingRemoval.id);
      setSkills((prev) => prev.filter((skill) => skill.id !== skillPendingRemoval.id));
      addToast({ title: 'Skill removed', message: `${skillPendingRemoval.name} was removed.`, type: 'info' });
    } catch {
      addToast({ title: 'Error', message: 'Could not remove this skill.', type: 'error' });
    } finally {
      setSkillPendingRemoval(null);
    }
  };

  const startEditSkill = (skill) => {
    setEditingSkill(skill);
    setNewSkill(skill.name);
    setNewSkillCategory(skill.category === 'soft_skill' || skill.category === 'tool' ? skill.category : 'technical');
    setActiveProfileTab('skills');
  };

  const openProfileTab = (tab) => {
    setActiveProfileTab(tab);
    window.setTimeout(() => {
      document.getElementById(tab === 'saved' ? 'saved-jobs' : tab)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const technicalSkills = useMemo(() => skills.filter((skill) => skill.category === 'technical' || skill.category === 'framework'), [skills]);
  const softSkills = useMemo(() => skills.filter((skill) => skill.category === 'soft_skill'), [skills]);
  const tools = useMemo(() => skills.filter((skill) => skill.category === 'tool'), [skills]);
  const filteredSuggestions = useMemo(() => {
    const taken = new Set(skills.map((skill) => skill.name.toLowerCase()));
    return suggested
      .filter((skill) => !taken.has(skill.name.toLowerCase()))
      .filter((skill) => suggestionCategory === 'all' || skill.category === suggestionCategory)
      .slice(0, 8);
  }, [skills, suggested, suggestionCategory]);
  const scheduledInterviews = useMemo(() => {
    const applicationByJob = new Map(applications.map((application) => [String(application.jobId || application.job?.id || ''), application]));

    return notifications
      .filter((notification) => (notification.type || notification.data?.type) === 'interview_scheduled')
      .map((notification) => {
        const data = notification.data || {};
        const application = applicationByJob.get(String(data.job_id || ''));
        const interviewAt = data.interview_at;

        return {
          id: notification.id,
          notification,
          application,
          jobId: data.job_id || application?.jobId,
          senderId: data.sender_id,
          company: data.company_name || data.sender_name || application?.job?.company || 'Company',
          role: data.job_title || application?.job?.title || 'Interview',
          interviewAt,
          message: notification.message || data.message || '',
        };
      })
      .filter((item) => item.interviewAt)
      .sort((a, b) => new Date(a.interviewAt) - new Date(b.interviewAt));
  }, [applications, notifications]);
  const interviewJobIds = useMemo(() => new Set(scheduledInterviews.map((item) => String(item.jobId || ''))), [scheduledInterviews]);
  const filteredApplications = useMemo(() => {
    if (applicationFilter === 'all') return applications;
    if (applicationFilter === 'interview') {
      return applications.filter((application) => ['interview_scheduled', 'waiting_interview'].includes(application.status) || interviewJobIds.has(String(application.jobId || application.job?.id || '')));
    }
    return applications.filter((application) => application.status === applicationFilter);
  }, [applications, applicationFilter, interviewJobIds]);

  if (loading || !profile) return <FullPageSpinner />;

  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Job Seeker';
  const initials = `${profile.firstName?.charAt(0) || ''}${profile.lastName?.charAt(0) || ''}` || fullName.charAt(0);
  const profileCompletionFields = [
    fullName && fullName !== 'Job Seeker',
    profile.title,
    profile.email,
    profile.phone,
    profile.location,
    profile.bio,
    profile.expectedSalary,
    profile.portfolio || profile.linkedin,
    profile.educationLevel,
    profile.yearsOfExperience,
    profile.cvFile,
    skills.length,
  ];
  const profileCompletion = Math.round((profileCompletionFields.filter(Boolean).length / profileCompletionFields.length) * 100);

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex flex-col min-h-full space-y-gutter pb-12">
      <SeekerPageHeader title="My Profile" subtitle="Your career profile, applications, saved jobs, and skills in one place." icon="person" />

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant overflow-hidden">
        <div className="h-40 bg-secondary/10 relative overflow-hidden">
          {profile.coverImage ? <img alt="Profile cover" className="h-full w-full object-cover" src={profile.coverImage} /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgb(37_99_235_/_0.22),_transparent_45%),linear-gradient(135deg,_rgb(var(--surface-container-low)),_rgb(var(--surface-container-lowest)))]" />}
          <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-1/4 -translate-y-1/4">
            <span className="material-symbols-outlined text-[150px] text-secondary">person</span>
          </div>
          <input accept="image/*" className="hidden" onChange={(event) => handleMediaUpload('cover', event.target.files?.[0])} ref={coverInputRef} type="file" />
          <button className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-lg bg-surface-container-lowest/90 px-3 py-2 font-label-sm text-primary shadow-sm hover:bg-surface-container-lowest disabled:opacity-60" disabled={uploading === 'cover'} onClick={() => coverInputRef.current?.click()} type="button">
            <span className="material-symbols-outlined text-[18px]">wallpaper</span>
            {uploading === 'cover' ? 'Uploading...' : 'Change Cover'}
          </button>
        </div>

        <div className="px-8 pb-8 relative">
          <div className="relative -mt-12 mb-4 h-24 w-24">
            <div className="h-24 w-24 rounded-full bg-surface border-4 border-surface-container-lowest flex items-center justify-center font-display text-h1 text-primary shadow-sm overflow-hidden">
              {profile.avatar ? <img alt={fullName} className="h-full w-full object-cover" src={profile.avatar} /> : initials.toUpperCase()}
            </div>
            <input accept="image/*" className="hidden" onChange={(event) => handleMediaUpload('avatar', event.target.files?.[0])} ref={avatarInputRef} type="file" />
            <button className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-on-secondary shadow-sm hover:opacity-90 disabled:opacity-60" disabled={uploading === 'avatar'} onClick={() => avatarInputRef.current?.click()} title="Change profile photo" type="button">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
          </div>

          <div className="flex flex-col gap-8">
            <div className="max-w-3xl">
              <NameEditor profile={profile} onSave={saveProfilePatch} />
              <InlineField label="Professional headline" value={profile.title} icon="badge" onSave={(value) => saveProfilePatch({ title: value })} placeholder="Add your professional headline" />
              <div className="mt-stack-md flex flex-wrap gap-3 text-on-surface-variant font-body-md">
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">email</span>{profile.email || 'No email available'}</span>
                {profile.location && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">location_on</span>{profile.location}</span>}
                {profile.phone && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">call</span>{profile.phone}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-stretch">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2">Profile completion</p>
                <p className="font-h3 text-primary">{profileCompletion}%</p>
              </div>
              <button className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center text-left transition-colors hover:border-secondary hover:bg-surface-container-high" onClick={() => openProfileTab('applications')} type="button">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">work_history</span>Applications</p>
                <p className="font-h3 text-primary">{applications.length}</p>
              </button>
              <Link className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center text-left transition-colors hover:border-secondary hover:bg-surface-container-high" to={ROUTES.SEEKER_INTERVIEWS}>
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">event_available</span>Interviews</p>
                <p className="font-h3 text-primary">{scheduledInterviews.length}</p>
              </Link>
              <button className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center text-left transition-colors hover:border-secondary hover:bg-surface-container-high" onClick={() => openProfileTab('saved')} type="button">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">bookmark</span>Saved jobs</p>
                <p className="font-h3 text-primary">{savedJobs.length}</p>
              </button>
              <button className="bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 min-h-[96px] flex flex-col justify-center text-left transition-colors hover:border-secondary hover:bg-surface-container-high" onClick={() => openProfileTab('skills')} type="button">
                <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">psychology</span>Skills</p>
                <p className="font-h3 text-primary">{skills.length}</p>
              </button>
            </div>

            <div className="mt-2 pt-6 border-t border-outline-variant grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <div>
                <h3 className="font-h3 text-primary mb-3">Top Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.length ? skills.slice(0, 12).map((skill) => <SkillChip key={skill.id} skill={skill} onEdit={startEditSkill} onRemove={setSkillPendingRemoval} />) : <p className="text-sm italic text-on-surface-variant">No skills listed yet.</p>}
                </div>
              </div>
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant">
                <p className="font-h3 text-primary mb-3">Profile health</p>
                <div className="h-2 rounded-full bg-surface-container-high overflow-hidden mb-3"><div className="h-full bg-secondary" style={{ width: `${profileCompletion}%` }} /></div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Complete your summary, skills, CV, and contact data to improve AI matching.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 rounded-xl border border-outline-variant bg-surface-container-lowest/95 p-2 shadow-ambient backdrop-blur supports-[backdrop-filter]:bg-surface-container-lowest/80">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {PROFILE_TABS.map((tab) => (
            <button
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 font-label-md transition-colors ${activeProfileTab === tab.value ? 'bg-secondary text-on-secondary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}`}
              key={tab.value}
              onClick={() => setActiveProfileTab(tab.value)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeProfileTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          <Section title="About & Contact" icon="contact_page" id="about">
            <div className="grid grid-cols-1 gap-stack-md">
              <InlineField label="Professional summary" value={profile.bio} icon="notes" multiline onSave={(value) => saveProfilePatch({ bio: value })} placeholder="Tell recruiters about yourself" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                <InlineField label="Email" value={profile.email} icon="mail" type="email" onSave={(value) => saveProfilePatch({ email: value })} placeholder="Add email" />
                <InlineField label="Phone" value={profile.phone} icon="call" onSave={(value) => saveProfilePatch({ phone: value })} placeholder="Add phone" />
                <InlineField label="Location" value={profile.location} icon="location_on" onSave={(value) => saveProfilePatch({ location: value })} placeholder="Add location" />
                <InlineField label="Expected salary" value={profile.expectedSalary} icon="payments" onSave={(value) => saveProfilePatch({ expectedSalary: value })} placeholder="Add expected salary" />
                <InlineField label="Portfolio" value={profile.portfolio} icon="language" type="url" onSave={(value) => saveProfilePatch({ portfolio: value })} placeholder="https://" />
                <InlineField label="LinkedIn" value={profile.linkedin} icon="link" type="url" onSave={(value) => saveProfilePatch({ linkedin: value })} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
          </Section>

          <Section title="Experience & Education" icon="school" id="experience">
            <div className="grid grid-cols-1 gap-stack-md">
              <InlineField label="Years of experience" value={profile.yearsOfExperience} icon="work" type="number" onSave={(value) => saveProfilePatch({ years_of_experience: value })} placeholder="Add years of experience" />
              <InlineField label="Education level" value={profile.educationLevel} icon="school" onSave={(value) => saveProfilePatch({ education_level: value })} placeholder="Add education level" />
            </div>
          </Section>
        </div>
      )}

      {activeProfileTab === 'skills' && (
        <Section title="Skills" icon="psychology" id="skills">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-gutter">
            <div className="space-y-stack-md">
              <form onSubmit={handleAddSkill} className="bg-surface-container-low rounded-xl border border-outline-variant p-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <span className="material-symbols-outlined text-on-surface-variant">search</span>
                <input className="w-full bg-transparent border-none focus:ring-0 font-body-md text-on-surface placeholder:text-outline-variant outline-none" placeholder="Add a new skill..." type="text" value={newSkill} onChange={(event) => setNewSkill(event.target.value)} />
                <select className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-primary outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20" value={newSkillCategory} onChange={(event) => setNewSkillCategory(event.target.value)}>
                  {SKILL_CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                {editingSkill && <button className="rounded-lg border border-outline-variant px-3 py-2 font-label-sm text-on-surface-variant hover:bg-surface-container-lowest" onClick={() => { setEditingSkill(null); setNewSkill(''); setNewSkillCategory('technical'); }} type="button">Cancel</button>}
                {newSkill && <button className="bg-secondary text-on-secondary font-label-sm px-3 py-2 rounded flex items-center justify-center gap-1 hover:opacity-90 transition-opacity" type="submit"><span className="material-symbols-outlined text-[16px]">{editingSkill ? 'save' : 'add'}</span>{editingSkill ? 'Save' : 'Add'}</button>}
              </form>
              {[
                ['Technical Skills', technicalSkills],
                ['Soft Skills', softSkills],
                ['Tools & Platforms', tools],
              ].map(([title, items]) => (
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4" key={title}>
                  <h3 className="font-h3 text-primary mb-3">{title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {items.length ? items.map((skill) => <SkillChip key={skill.id} skill={skill} onEdit={startEditSkill} onRemove={setSkillPendingRemoval} />) : <p className="text-on-surface-variant text-sm">No {title.toLowerCase()} added yet.</p>}
                  </div>
                </div>
              ))}
            </div>
            <aside className="rounded-xl border border-outline-variant bg-surface-container-low p-4 h-fit">
              <h3 className="font-h3 text-primary mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-secondary">tips_and_updates</span>Suggested for You</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Use the filters to add Technical Skills, Soft Skills, or Tools & Platforms to the matching section.</p>
              <div className="mb-4 flex flex-wrap gap-2">
                {SKILL_CATEGORY_FILTERS.map((filter) => (
                  <button className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${suggestionCategory === filter.value ? 'border-secondary bg-secondary text-on-secondary' : 'border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-lowest'}`} key={filter.value} onClick={() => setSuggestionCategory(filter.value)} type="button">
                    {filter.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                {filteredSuggestions.length ? filteredSuggestions.map((skill) => (
                  <button className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:border-secondary hover:bg-surface-container-lowest transition-colors group text-left" key={skill.id} onClick={() => addSuggestedSkill(skill)} type="button">
                    <span><span className="font-body-md text-sm text-primary font-bold block">{skill.name}</span><span className="font-label-sm text-[12px] text-on-surface-variant">{skill.category === 'soft_skill' ? 'Soft Skill' : skill.category === 'tool' ? 'Tool' : 'Technical'}</span></span>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors">add_circle</span>
                  </button>
                )) : <p className="text-on-surface-variant text-sm">You've added all suggested skills.</p>}
              </div>
            </aside>
          </div>
        </Section>
      )}

      {activeProfileTab === 'saved' && (
        <Section title="Saved Jobs" icon="bookmark" id="saved-jobs">
          {savedJobs.length ? (
            <Stagger className="grid grid-cols-1 xl:grid-cols-2 gap-gutter" delayChildren={0.05} staggerChildren={0.05}>
              {savedJobs.map((job) => <Stagger.Item key={job.id}><SeekerJobCard job={job} onSavedStateChange={(jobId, isSaved) => { if (!isSaved) setSavedJobs((prev) => prev.filter((item) => item.id !== jobId)); }} /></Stagger.Item>)}
            </Stagger>
          ) : (
            <SeekerEmptyState icon="bookmark_border" title="Your wishlist is empty" description="Browse jobs and use the bookmark action to keep them here." />
          )}
        </Section>
      )}

      {activeProfileTab === 'applications' && (
        <Section
          actions={<div className="flex gap-2 overflow-x-auto pb-1">{APPLICATION_TABS.map((tab) => <button className={`px-3 py-1.5 rounded-full font-label-md whitespace-nowrap border transition-colors ${applicationFilter === tab.value ? 'bg-secondary text-on-secondary border-secondary' : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`} key={tab.value} onClick={() => setApplicationFilter(tab.value)} type="button">{tab.label}</button>)}</div>}
          icon="work_history"
          id="applications"
          title="Applications"
        >
          {filteredApplications.length ? (
            <Stagger className="space-y-gutter" delayChildren={0.05} staggerChildren={0.06}>
              {filteredApplications.map((application) => <Stagger.Item key={application.id}><SeekerApplicationCard application={application} /></Stagger.Item>)}
            </Stagger>
          ) : (
            <SeekerEmptyState icon="description" title="No applications found" description={applicationFilter === 'all' ? "You haven't applied to any jobs yet." : `You don't have any ${applicationFilter.replace('_', ' ')} applications.`} />
          )}
        </Section>
      )}

      <ConfirmModal
        cancelLabel="Keep"
        confirmLabel="Remove"
        message={skillPendingRemoval ? `Remove "${skillPendingRemoval.name}" from your skills? This may affect AI recommendations.` : null}
        onCancel={() => setSkillPendingRemoval(null)}
        onConfirm={confirmRemoveSkill}
        open={Boolean(skillPendingRemoval)}
        title="Remove skill?"
        variant="danger"
      />
    </div>
  );
}
