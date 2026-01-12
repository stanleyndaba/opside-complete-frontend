import React, { useState, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { MapPin, ArrowRight, Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Careers() {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const positions = [
    {
      title: 'UI/UX Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$90k – $140k',
      tags: ['React', 'Design Systems', 'Figma'],
      description: 'Own our design system and craft delightful product experiences across the Margin platform.',
    },
    {
      title: 'Chief Financial Officer',
      location: 'Hybrid',
      type: 'Full-time',
      salary: '$180k – $260k',
      tags: ['FinOps', 'Fundraising', 'SaaS'],
      description: 'Lead strategic finance, design aligned pricing, and steward capital through growth and scale.',
    },
    {
      title: 'Senior Backend Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$130k – $190k',
      tags: ['Python', 'TypeScript', 'PostgreSQL'],
      description: 'Design resilient services for sync, claims, and evidence matching at scale.',
    },
    {
      title: 'Systems Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120k – $170k',
      tags: ['SRE', 'Observability', 'Kubernetes'],
      description: 'Ensure reliability, performance, and cost-efficiency across our platform.',
    },
    {
      title: 'Quality Assurance',
      location: 'Remote',
      type: 'Full-time',
      salary: '$80k – $130k',
      tags: ['Automation', 'Playwright', 'API Testing'],
      description: 'Own quality gates end-to-end with test automation and data-driven QA.',
    },
    {
      title: 'Chief Data Scientist',
      location: 'Remote',
      type: 'Full-time',
      salary: '$190k – $280k',
      tags: ['ML', 'NLP', 'Time Series'],
      description: 'Lead detection, scoring, and decision engines that maximize recoveries.',
    },
  ];

  const handleApplyClick = (jobTitle: string) => {
    setSelectedJob(jobTitle);
    setUploadStatus('idle');
    setResumeFile(null);
    setIsApplicationOpen(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];

    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid File Format",
        description: "Please upload a PDF or DOCX document.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "File Too Large",
        description: "Resume must be under 5MB.",
      });
      return;
    }

    setResumeFile(file);
  };

  const handleSubmitApplication = async () => {
    if (!resumeFile) return;

    setUploadStatus('uploading');

    // Simulate API delay
    setTimeout(() => {
      // Mock random failure for demonstration if desired, but default to success for user flow
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        setUploadStatus('success');
        toast({
          title: "Application Received",
          description: "Your credentials have been securely transmitted to our Talent Committee.",
          className: "bg-[#0a0a0f] text-white border-gray-800",
        });
      } else {
        setUploadStatus('error');
        toast({
          variant: "destructive",
          title: "Transmission Failed",
          description: "Secure upload interrupted. Please retry manually.",
        });
      }
    }, 2000);
  };

  const closeApplication = () => {
    setIsApplicationOpen(false);
    // Reset state after transition
    setTimeout(() => {
      setResumeFile(null);
      setUploadStatus('idle');
    }, 300);
  };

  return (
    <PageLayout title="Careers">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-16">
            {/* Header */}
            <header className="mb-10">
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">
                Careers
              </h1>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">
                Join Our Team
              </p>
              <p className="mt-4 text-sm text-gray-600 max-w-2xl leading-relaxed">
                We're a small team building the intelligent financial recovery layer for e-commerce.
                We hire for impact, ownership, and solving hard problems.
              </p>
            </header>

            {/* Open Positions */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Open Positions</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {positions.length} roles
                </span>
              </div>
              <div className="grid gap-4">
                {positions.map((position, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-sm p-4 hover:border-gray-300 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-medium text-gray-900">{position.title}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {position.salary}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{position.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <MapPin className="h-2.5 w-2.5" />
                            {position.location}
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-[0.05em]">{position.type}</span>
                          <span className="text-gray-300">•</span>
                          {position.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-gray-50 text-gray-600 border border-gray-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleApplyClick(position.title)}
                        className="px-4 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 shadow-sm rounded-none h-8 font-medium transition-colors flex items-center gap-1 shrink-0">
                        Apply
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact CTA */}
            <section className="pt-6 border-t border-gray-200">
              <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.1em] mb-1">
                Not sure which role fits?
              </h3>
              <p className="text-[10px] text-gray-500 mb-4">
                We value a fast, respectful process. Reach out and let's talk.
              </p>
              <a
                href="mailto:careers@margin.app"
                className="inline-block px-4 py-2 text-xs font-medium text-white bg-[#0a0a0f] hover:bg-[#1a1a1f] transition-colors rounded-none">
                Contact Us
              </a>
            </section>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      <Dialog open={isApplicationOpen} onOpenChange={setIsApplicationOpen}>
        <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-white rounded-none border-gray-200 overflow-hidden">
          {uploadStatus === 'success' ? (
            <div className="p-8 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
              <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Application Received</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Your resume has been securely transmitted. Our talent team will review your credentials for the <span className="font-semibold text-gray-900">{selectedJob}</span> position.
              </p>
              <Button onClick={closeApplication} className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white rounded-none w-full max-w-[200px]">
                Return to Careers
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <DialogTitle className="text-base font-medium text-gray-900">Application Protocol</DialogTitle>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Role: {selectedJob}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">First Name</Label>
                    <Input className="h-9 rounded-none border-gray-200 bg-white" placeholder="First Name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-gray-700">Last Name</Label>
                    <Input className="h-9 rounded-none border-gray-200 bg-white" placeholder="Last Name" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-700">Email Address</Label>
                  <Input className="h-9 rounded-none border-gray-200 bg-white" placeholder="institutional@email.com" />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-medium text-gray-700">Resume / CV</Label>

                  {!resumeFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-none p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                        isDragOver ? "border-blue-500 bg-blue-50/10" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      )}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileInput}
                      />
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Upload className="h-5 w-5 text-gray-500" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Drop resume or click to upload</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wide">PDF, DOCX up to 5MB</p>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-none p-4 flex items-center justify-between bg-gray-50/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-50 flex items-center justify-center border border-blue-100">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="grid gap-0.5">
                          <p className="text-xs font-medium text-gray-900 truncate max-w-[180px]">{resumeFile.name}</p>
                          <p className="text-[10px] text-gray-500">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setResumeFile(null)} className="h-6 w-6 p-0 rounded-full hover:bg-gray-200">
                        <X className="h-3 w-3 text-gray-500" />
                      </Button>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 border border-red-100">
                      <AlertCircle className="h-3 w-3" />
                      <span>Upload failed. Please try again.</span>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 gap-2">
                <Button variant="outline" onClick={closeApplication} className="h-9 rounded-none text-xs border-gray-200 hover:bg-white">
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={!resumeFile || uploadStatus === 'uploading'}
                  className="h-9 rounded-none text-xs bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm disabled:opacity-70 gap-2"
                >
                  {uploadStatus === 'uploading' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {uploadStatus === 'uploading' ? 'Transmitting...' : 'Submit Application'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
