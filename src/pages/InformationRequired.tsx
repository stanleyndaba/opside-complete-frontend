import React, { useCallback, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  CircleAlert,
  FileText,
  Files,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

type UploadStatus = 'ready' | 'sending' | 'sent' | 'error';

type InformationFile = {
  file: File;
  id: string;
  status: UploadStatus;
  progress: number;
  error?: string;
};

const ACCEPTED_FILE_EXTENSIONS = ['.csv', '.txt', '.pdf', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_FILES = 10;

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileType = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toUpperCase();
  return extension ? `${extension} file` : 'File';
};

const isAcceptedFile = (file: File) => {
  const name = file.name.toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.some((extension) => name.endsWith(extension)) && file.size <= MAX_FILE_SIZE;
};

const getFileError = (file: File) => {
  const name = file.name.toLowerCase();
  if (!ACCEPTED_FILE_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return 'This file type is not supported. Please choose a CSV, TXT, PDF, XLS, or XLSX file.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'This file is larger than 25 MB. Please choose a smaller file.';
  }
  return undefined;
};

export default function InformationRequired() {
  usePageMeta({
    title: 'Information Required | Margin',
    description: 'Send Margin the Amazon records needed to complete your Audit.',
    url: `${SITE_META.url}/information-required`,
    image: SITE_META.image,
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<InformationFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState('');

  const handleFiles = useCallback((incomingFiles: FileList | File[]) => {
    const selected = Array.from(incomingFiles);
    setFiles((current) => {
      const remaining = Math.max(0, MAX_FILES - current.length);
      const nextFiles = selected.slice(0, remaining).map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        status: isAcceptedFile(file) ? 'ready' : 'error',
        progress: 0,
        error: getFileError(file),
      } satisfies InformationFile));
      return [...current, ...nextFiles];
    });
  }, []);

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((item) => item.id !== id));
  };

  const validFiles = files.filter((item) => item.status === 'ready');
  const hasInvalidFiles = files.some((item) => item.status === 'error');

  const sendFiles = () => {
    if (isSending || validFiles.length === 0 || hasInvalidFiles) return;

    setIsSending(true);
    setFiles((current) => current.map((item) => item.status === 'ready'
      ? { ...item, status: 'sending', progress: 12 }
      : item));

    const progressTimer = window.setInterval(() => {
      setFiles((current) => current.map((item) => item.status === 'sending'
        ? { ...item, progress: Math.min(100, item.progress + 22) }
        : item));
    }, 180);

    window.setTimeout(() => {
      window.clearInterval(progressTimer);
      setFiles((current) => current.map((item) => item.status === 'sending'
        ? { ...item, status: 'sent', progress: 100 }
        : item));
      setIsSending(false);
      setIsSubmitted(true);
    }, 1050);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
        <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
          <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
              <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
            </Link>
            <span className="inline-flex min-h-10 items-center rounded-[10px] bg-[#F0F0EC] px-4 text-[13px] font-medium text-[#595E68]">In progress</span>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          <section className="mx-auto max-w-3xl rounded-[14px] border border-[#E8E7E1] bg-white p-5 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-8" aria-labelledby="files-received-title">
            <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#DDF7F0] text-[#0E766C]">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-5 text-[12px] font-semibold text-[#595E68]">REVIEW IN PROGRESS</p>
            <h1 id="files-received-title" className="mt-2 max-w-2xl font-lora text-[32px] font-normal leading-[1.08] tracking-[-0.02em] text-[#191B20] sm:text-[40px]">Files received.</h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-6 text-[#595E68] sm:text-[16px]">Our review team has received your files. We&apos;ll continue your Audit after we&apos;ve examined the additional records.</p>
            <div className="mt-6 border-t border-[#E8E7E1] pt-4 text-[13px] leading-6 text-[#777A82]">Your Audit is still in progress. You can safely leave this page.</div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
          <span className="inline-flex min-h-10 items-center rounded-[10px] bg-[#F0F0EC] px-4 text-[13px] font-medium text-[#595E68]">In progress</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <section className="min-w-0 rounded-[14px] border border-[#E8E7E1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-5" aria-labelledby="information-required-title">
            <div className="max-w-2xl border-b border-[#E8E7E1] pb-4">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-[#595E68]">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4F3ED] text-[#191B20]"><FileText className="h-3.5 w-3.5" aria-hidden="true" /></span>
                <span>Commercial Agent</span>
              </div>
              <h1 id="information-required-title" className="font-lora text-[28px] font-normal leading-[1.08] tracking-[-0.02em] text-[#191B20] sm:text-[34px]">Sub-agents found activities worth investigating.</h1>
              <p className="mt-2 max-w-xl text-[14px] leading-5 text-[#595E68]">Margin has identified activity in your account that warrants a closer look. To build a solid report, we need a few additional Amazon records from you.</p>
              <p className="mt-2 max-w-xl text-[14px] leading-5 text-[#595E68]">Your Audit isn&apos;t finished yet. These files will help our review team verify what happened and complete your report.</p>
            </div>

            <div className="mt-4 space-y-4">
              <section className="rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-3.5 sm:p-4" aria-labelledby="send-files-title">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D7D7D1] pb-3">
                  <div>
                    <h2 id="send-files-title" className="text-[15px] font-semibold text-[#191B20]">Send us the files</h2>
                    <p className="mt-0.5 text-[12px] leading-5 text-[#595E68]">Upload the additional Amazon records you&apos;d like Margin to review. You can send multiple files.</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D7D7D1] bg-white px-2.5 py-1 text-[12px] font-medium text-[#595E68]"><Files className="h-3.5 w-3.5" aria-hidden="true" /> Up to 10 files</span>
                </div>

                <div onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }} onDrop={onDrop} onClick={() => inputRef.current?.click()} className={`mt-3 cursor-pointer rounded-[10px] border border-dashed p-4 text-center transition-colors sm:p-5 ${isDragging ? 'border-[#3F51A8] bg-[#E9ECFF]' : 'border-[#B8B9B4] bg-white hover:border-[#8D8F89]'}`} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }} aria-label="Choose files to send to Margin">
                  <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#D7D7D1] bg-[#FBFAF7] text-[#191B20]"><Upload className="h-4 w-4" aria-hidden="true" /></span>
                  <h3 className="mt-2 text-[15px] font-semibold text-[#191B20]">Drag and drop your files here</h3>
                  <p className="mt-1 text-[13px] leading-5 text-[#595E68]">or choose files</p>
                  <input ref={inputRef} type="file" multiple accept={ACCEPTED_FILE_EXTENSIONS.join(',')} onChange={(event) => { if (event.target.files) handleFiles(event.target.files); event.target.value = ''; }} className="sr-only" />
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#D7D7D1] pt-3 text-[12px] leading-5 text-[#595E68]">
                  <span>CSV, TXT, PDF, XLS, or XLSX</span><span className="hidden h-1 w-1 self-center rounded-full bg-[#B8B9B4] sm:block" /><span>Up to 25 MB per file</span><span className="hidden h-1 w-1 self-center rounded-full bg-[#B8B9B4] sm:block" /><span>Multiple files accepted</span>
                </div>
              </section>

              {files.length > 0 ? (
                <section aria-labelledby="selected-files-title">
                  <div className="mb-3 flex items-end justify-between gap-4"><div><h2 id="selected-files-title" className="text-[16px] font-semibold text-[#191B20]">Uploaded files</h2><p className="mt-0.5 text-[12px] text-[#777A82]">Review the files before sending them to Margin.</p></div><span className="shrink-0 text-[12px] font-medium text-[#595E68]">{files.length} of {MAX_FILES}</span></div>
                  <ul className="overflow-hidden rounded-[10px] border border-[#E8E7E1] bg-white" aria-live="polite">
                    {files.map((item, index) => {
                      const isError = item.status === 'error';
                      const isSendingFile = item.status === 'sending';
                      const isSent = item.status === 'sent';
                      const statusLabel = isError ? 'Needs review' : isSendingFile ? `${item.progress}%` : isSent ? 'Received' : 'Ready';
                      return <li key={item.id} className={`px-3 py-2.5 sm:px-4 ${index > 0 ? 'border-t border-[#E8E7E1]' : ''}`}>
                        <div className="flex min-h-[40px] items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isError ? 'bg-[#F4F3ED] text-[#A73549]' : isSent ? 'bg-[#DDF7F0] text-[#0E766C]' : 'bg-[#F4F3ED] text-[#595E68]'}`}>{isError ? <CircleAlert className="h-4 w-4" aria-hidden="true" /> : isSent ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <FileText className="h-4 w-4" aria-hidden="true" />}</span>
                          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium text-[#191B20]">{item.file.name}</p><p className={`mt-0.5 text-[12px] ${isError ? 'text-[#A73549]' : 'text-[#777A82]'}`}>{item.error || `${getFileType(item.file.name)} · ${formatFileSize(item.file.size)} · ${statusLabel}`}</p></div>
                          <span className={`hidden rounded-full px-2 py-1 text-[11px] font-medium sm:inline-flex ${isError ? 'bg-[#F4F3ED] text-[#A73549]' : isSent ? 'bg-[#DDF7F0] text-[#0E766C]' : isSendingFile ? 'bg-[#E9ECFF] text-[#3F51A8]' : 'bg-[#F4F3ED] text-[#595E68]'}`}>{statusLabel}</span>
                          {!isSendingFile && !isSent ? <button type="button" onClick={() => removeFile(item.id)} aria-label={`Remove ${item.file.name}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#595E68] outline-none transition-colors hover:bg-[#F4F3ED] hover:text-[#191B20] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"><X className="h-4 w-4" /></button> : null}
                        </div>
                        {isSendingFile ? <div className="ml-11 mt-2 h-1 overflow-hidden rounded-full bg-[#E8E7E1]"><div className="h-full rounded-full bg-[#3F51A8] transition-all" style={{ width: `${item.progress}%` }} /></div> : null}
                      </li>;
                    })}
                  </ul>
                </section>
              ) : null}

              <section className="border-t border-[#E8E7E1] pt-4" aria-labelledby="message-title">
                <label id="message-title" htmlFor="additional-message" className="text-[15px] font-semibold text-[#191B20]">Anything we should know?</label>
                <p className="mt-1 text-[12px] leading-5 text-[#595E68]">Optional — tell us anything unusual about these files or your account.</p>
                <textarea id="additional-message" value={message} onChange={(event) => setMessage(event.target.value)} rows={2} placeholder="Optional — tell us anything unusual about these files or your account." className="mt-2 block w-full resize-none rounded-[10px] border border-[#D7D7D1] bg-white px-3 py-2 text-[13px] text-[#191B20] outline-none placeholder:text-[#999B9A] focus:border-[#5165C7] focus:ring-2 focus:ring-[#E9ECFF]" />
              </section>

              <section className="border-t border-[#E8E7E1] pt-4" aria-labelledby="send-cta-title">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="send-cta-title" className="text-[15px] font-semibold text-[#191B20]">Ready to continue?</h2><p className="mt-1 text-[12px] leading-5 text-[#595E68]">{validFiles.length > 0 && !hasInvalidFiles ? `${validFiles.length} file${validFiles.length === 1 ? '' : 's'} ready to send.` : 'Add at least one valid file to continue.'}</p></div><Button onClick={sendFiles} disabled={validFiles.length === 0 || hasInvalidFiles || isSending} className="h-10 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2 disabled:opacity-45">{isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}{isSending ? 'Sending files' : 'Send files to Margin'}</Button></div>
                {hasInvalidFiles ? <div role="alert" className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] px-3 py-2.5 text-[12px] leading-5 text-[#595E68]"><Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>Remove the files that need review before sending.</p></div> : null}
              </section>
            </div>
          </section>
          <p className="mt-3 text-center text-[12px] leading-5 text-[#777A82]">No technical setup is needed. Just send the records you already have.</p>
        </div>
      </main>
    </div>
  );
}
