import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SeekerEmptyState from '../../components/jobSeeker/SeekerEmptyState';
import SeekerPageHeader from '../../components/jobSeeker/SeekerPageHeader';
import { useToast } from '../../components/useToast';
import {
  deleteConversation,
  getConversation,
  getMessages,
  markMessagesRead,
  sendMessage,
} from '../../services/jobSeekerDataService';

function UndoToast({ target, onClear, t }) {
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (!target) return;
    setTimeLeft(5);
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  if (!target) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-[9999] flex min-w-[320px] max-w-[400px] -translate-x-1/2 animate-fade-up items-center justify-between gap-4 rounded-lg bg-inverse-surface px-4 py-3 text-inverse-on-surface shadow-overlay">
      <p className="flex-1 truncate font-body-sm">{t('seekerMessages.deletedToast', { name: target.conv.company })}</p>
      <div className="flex shrink-0 items-center gap-3">
        <span className="w-4 text-center font-label-sm">{timeLeft}s</span>
        <button className="rounded px-2 py-1 font-label-sm uppercase tracking-wider text-secondary transition-colors hover:bg-secondary/10 hover:underline" onClick={() => { target.restore(); onClear(); }} type="button">
          {t('seekerMessages.undo')}
        </button>
      </div>
    </div>
  );
}

function MessagesSpinner({ label }) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center" role="status" aria-live="polite">
      <span className="material-symbols-outlined animate-spin text-[40px] text-secondary">progress_activity</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

const conversationMatches = (conversation, query) => {
  if (!query) return true;

  return [conversation.company, conversation.contact, conversation.role, conversation.last_message, conversation.status]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

export default function JobSeekerMessagesPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const { addToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [muteAllMessages, setMuteAllMessages] = useState(() => localStorage.getItem('seeker_muted_messages_all') === 'true');
  const [mutedConversations, setMutedConversations] = useState(() => JSON.parse(localStorage.getItem('seeker_muted_message_conversations') || '[]'));
  const [mutePulse, setMutePulse] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [undoTarget, setUndoTarget] = useState(null);
  const messagesEndRef = useRef(null);

  const active = conversations.find((item) => item.id === activeId);
  const conversationKey = (conversation) => `${conversation?.other_user_id || ''}-${conversation?.job_id || ''}`;
  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return conversations.filter((conversation) => conversationMatches(conversation, normalizedQuery));
  }, [conversations, query]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const handleContextMenu = (event, conversation) => {
    event.preventDefault();
    setContextMenu({ x: event.pageX, y: event.pageY, conversation });
  };

  const toggleMuteAllMessages = () => {
    setMutePulse('all');
    window.setTimeout(() => setMutePulse(null), 350);
    setMuteAllMessages((prev) => {
      const next = !prev;
      localStorage.setItem('seeker_muted_messages_all', String(next));
      return next;
    });
  };

  const toggleMuteConversation = (conversation) => {
    const key = conversationKey(conversation);
    setMutePulse(key);
    window.setTimeout(() => setMutePulse(null), 350);
    setMutedConversations((prev) => {
      const next = prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key];
      localStorage.setItem('seeker_muted_message_conversations', JSON.stringify(next));
      return next;
    });
  };

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(location.search);
      const targetUser = params.get('user');
      const targetJob = params.get('job');
      const targetName = params.get('name');
      let nextConversations = await getMessages();

      if (targetUser && !nextConversations.some((item) => String(item.other_user_id) === String(targetUser) && String(item.job_id || '') === String(targetJob || ''))) {
        nextConversations = [{
          id: `draft-${targetUser}-${targetJob || 'general'}`,
          other_user_id: Number(targetUser),
          company: targetName || t('seekerMessages.fallbackCompany'),
          contact: targetName || t('seekerMessages.fallbackContact'),
          role: targetJob ? t('seekerMessages.jobConversation') : t('seekerMessages.generalConversation'),
          job_id: targetJob ? Number(targetJob) : null,
          last_message: '',
          time: t('seekerMessages.newLabel'),
          unread: false,
          status: 'Active',
        }, ...nextConversations];
      }

      setConversations(nextConversations);
      if (nextConversations.length) {
        const requested = targetUser
          ? nextConversations.find((item) => String(item.other_user_id) === String(targetUser) && String(item.job_id || '') === String(targetJob || ''))
          : null;
        setActiveId((requested || nextConversations[0]).id);
      } else {
        setActiveId(null);
      }
    } catch (error) {
      console.error(error);
      addToast({ title: t('seekerMessages.errors.loadConversationsTitle'), message: t('seekerMessages.errors.loadConversationsMessage'), type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast, location.search, t]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!active?.other_user_id) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setMessagesLoading(true);
    getConversation(active.other_user_id, active.job_id)
      .then((items) => {
        if (!cancelled) setMessages(items);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) addToast({ title: t('seekerMessages.errors.loadConversationTitle'), message: t('seekerMessages.errors.loadConversationMessage'), type: 'error' });
      })
      .finally(() => {
        if (!cancelled) setMessagesLoading(false);
      });

    if (active.unread) {
      markMessagesRead(active.other_user_id)
        .then(() => {
          setConversations((prev) => prev.map((item) => item.id === active.id ? { ...item, unread: false } : item));
          window.dispatchEvent(new Event('notifications_updated'));
        })
        .catch(console.error);
    }

    return () => {
      cancelled = true;
    };
  }, [active?.id, active?.job_id, active?.other_user_id, active?.unread, addToast, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeId, messages]);

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !active?.other_user_id) return;

    setSending(true);
    try {
      const sent = await sendMessage(active.other_user_id, content, active.job_id);
      const nextMessage = {
        id: sent.id,
        from: t('seekerMessages.youLabel'),
        text: sent.content,
        created_at: sent.created_at || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, nextMessage]);
      setConversations((prev) => prev.map((conversation) => conversation.id === active.id ? {
        ...conversation,
        last_message: content,
        time: t('seekerMessages.nowLabel'),
      } : conversation));
      setNewMessage('');
    } catch (error) {
      console.error(error);
      addToast({ title: t('seekerMessages.errors.sendFailedTitle'), message: error.message || t('seekerMessages.errors.sendFailedMessage'), type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConversation = async (conversationToDelete) => {
    const conv = conversationToDelete || active;
    if (!conv) return;

    const prevConversations = [...conversations];
    const prevMessages = [...messages];
    const prevActiveId = activeId;

    setConversations((prev) => prev.filter((item) => item.id !== conv.id));
    if (activeId === conv.id) {
      setMessages([]);
      setActiveId(null);
    }
    setContextMenu(null);

    const target = {
      conv,
      isUndone: false,
      restore: () => {
        target.isUndone = true;
        setConversations(prevConversations);
        setMessages(prevMessages);
        setActiveId(prevActiveId);
        setUndoTarget(null);
      },
    };

    setUndoTarget(target);
    window.setTimeout(async () => {
      if (target.isUndone) return;
      try {
        await deleteConversation(conv.other_user_id, conv.job_id);
      } catch (error) {
        console.error(error);
        setConversations(prevConversations);
        setMessages(prevMessages);
        setActiveId(prevActiveId);
        addToast({ title: t('seekerMessages.errors.deleteFailedTitle'), message: t('seekerMessages.errors.deleteFailedMessage'), type: 'error' });
      }
      setUndoTarget((current) => current === target ? null : current);
    }, 5000);
  };

  const youLabel = t('seekerMessages.youLabel');

  return (
    <div className="px-4 sm:px-6 lg:px-margin-desktop py-6 lg:py-margin-desktop max-w-7xl mx-auto flex h-full min-h-0 flex-col overflow-hidden space-y-gutter">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <SeekerPageHeader title={t('seekerMessages.title')} subtitle={t('seekerMessages.subtitle')} icon="chat" />
        <button className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${muteAllMessages ? 'border border-outline-variant bg-surface-container-high text-on-surface-variant' : 'bg-secondary text-on-secondary hover:opacity-90'} ${mutePulse === 'all' ? 'animate-scale-in' : ''}`} onClick={toggleMuteAllMessages} type="button">
          <span className="material-symbols-outlined text-[20px]">{muteAllMessages ? 'notifications_off' : 'notifications_active'}</span>
          {muteAllMessages ? t('seekerMessages.unmuteAll') : t('seekerMessages.muteAll')}
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-gutter lg:grid-cols-[360px_1fr]">
        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient overflow-hidden flex min-h-0 flex-col">
          <div className="border-b border-outline-variant p-stack-md space-y-stack-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-h2 text-h2 text-primary">{t('seekerMessages.inbox')}</h2>
              <span className="text-sm text-on-surface-variant">{t('seekerMessages.chatsCount', { count: filteredConversations.length })}</span>
            </div>
            <label className="relative block">
              <span className="material-symbols-outlined absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input
                className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2 ps-10 pe-3 text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('seekerMessages.searchPlaceholder')}
                value={query}
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-outline-variant overflow-y-auto p-2">
            {loading ? <MessagesSpinner label={t('seekerMessages.loadingMessages')} /> : (
              filteredConversations.length ? filteredConversations.map((item) => (
                <button
                  className={`w-full rounded-lg p-stack-md text-start transition-colors ${active?.id === item.id ? 'bg-secondary-container/15' : 'hover:bg-surface-container-low'}`}
                  key={item.id}
                  onClick={() => setActiveId(item.id)}
                  onContextMenu={(event) => handleContextMenu(event, item)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 font-bold text-secondary">
                      {item.company?.charAt(0)?.toUpperCase() || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-h3 text-h3 text-primary truncate">{item.company}</p>
                        <span className="flex shrink-0 items-center gap-2">
                          {mutedConversations.includes(conversationKey(item)) && <span className="material-symbols-outlined text-[16px] text-on-surface-variant">notifications_off</span>}
                          {item.unread && <span className="h-2.5 w-2.5 rounded-full bg-secondary" aria-hidden="true" />}
                        </span>
                      </div>
                      <p className="truncate text-sm text-on-surface-variant">{item.role}</p>
                      <p className="mt-2 truncate text-body-sm text-on-surface-variant">{item.last_message || t('seekerMessages.noMessagesYet')}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="font-medium text-body-sm text-secondary">{item.status}</span>
                        <span className="text-xs text-outline">{item.time}</span>
                      </div>
                    </div>
                  </div>
                </button>
              )) : <SeekerEmptyState icon="chat_bubble" title={t('seekerMessages.emptyTitle')} description={query ? t('seekerMessages.emptySearchDescription') : t('seekerMessages.emptyDescription')} />
            )}
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-ambient min-h-0 flex flex-col overflow-hidden">
          {active ? (
            <>
              <div className="border-b border-outline-variant bg-surface-container-lowest p-stack-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">{active.status}</p>
                    <h2 className="font-h2 text-h2 text-primary mt-unit">{active.company}</h2>
                    <p className="text-on-surface-variant">{t('seekerMessages.aboutRole', { contact: active.contact, role: active.role })}</p>
                  </div>
                  <button className={`inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 font-semibold text-sm transition-all duration-200 hover:-translate-y-0.5 ${mutedConversations.includes(conversationKey(active)) ? 'border border-outline-variant bg-surface-container-high text-on-surface-variant' : 'bg-secondary text-on-secondary'} ${mutePulse === conversationKey(active) ? 'animate-scale-in' : ''}`} onClick={() => toggleMuteConversation(active)} type="button">
                    <span className="material-symbols-outlined text-[18px]">{mutedConversations.includes(conversationKey(active)) ? 'notifications_off' : 'notifications_active'}</span>
                    {mutedConversations.includes(conversationKey(active)) ? t('seekerMessages.unmuteChat') : t('seekerMessages.muteChat')}
                  </button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-stack-md overflow-y-auto bg-surface-container-low p-stack-lg">
                {messagesLoading ? <MessagesSpinner label={t('seekerMessages.loadingMessages')} /> : (
                  messages.length ? messages.map((message, index) => {
                    const mine = message.from === 'You' || message.from === youLabel;
                    return (
                      <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`} key={`${active.id}-${message.id || index}`}>
                        <div className={`max-w-[75%] rounded-2xl px-stack-md py-stack-sm shadow-sm ${mine ? 'bg-secondary text-on-secondary rounded-tr-none' : 'bg-surface-container-lowest border border-outline-variant text-on-surface rounded-tl-none'}`}>
                          <p className={`font-label-sm text-label-sm mb-unit ${mine ? 'opacity-80' : 'text-on-surface-variant'}`}>{mine ? youLabel : message.from}</p>
                          <p className="leading-relaxed">{message.text}</p>
                        </div>
                      </div>
                    );
                  }) : <p className="mt-10 text-center font-body-sm italic text-on-surface-variant">{t('seekerMessages.noMessagesInChat')}</p>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="border-t border-outline-variant bg-surface-container-lowest p-stack-md">
                <div className="flex gap-stack-sm">
                  <input
                    className="flex-1 rounded-full border border-outline-variant bg-surface-container-low px-stack-md py-stack-sm text-on-surface outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 disabled:opacity-60"
                    disabled={sending}
                    onChange={(event) => setNewMessage(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleSend(); }}
                    placeholder={t('seekerMessages.messagePlaceholder')}
                    value={newMessage}
                  />
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-stack-md py-stack-sm font-label-md text-on-secondary hover:opacity-90 disabled:opacity-50" disabled={sending || !newMessage.trim()} onClick={handleSend} type="button">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    {sending ? t('seekerMessages.sending') : t('seekerMessages.send')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-stack-lg text-on-surface-variant">{t('seekerMessages.selectChat')}</div>
          )}
        </section>
      </div>
      {contextMenu && (
        <div className="fixed z-[9999] overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-lg" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button className="flex w-full items-center gap-2 px-4 py-3 text-start text-error transition-colors hover:bg-error-container" onClick={() => handleDeleteConversation(contextMenu.conversation)} type="button">
            <span className="material-symbols-outlined text-[18px]">delete</span>
            {t('seekerMessages.deleteChat')}
          </button>
        </div>
      )}
      <UndoToast target={undoTarget} onClear={() => setUndoTarget(null)} t={t} />
    </div>
  );
}
