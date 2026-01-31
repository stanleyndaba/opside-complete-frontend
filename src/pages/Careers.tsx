import React, { useState, useRef, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { MapPin, ArrowRight, Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Sparkles, Zap, Shield, Briefcase, Info, Search as SearchIcon, Globe, Map } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';

export default function Careers() {
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const positions = [
    {
      title: 'UI/UX Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$90k – $140k',
      tags: ['React', 'Design Systems', 'Figma'],
      description: 'Own our design system and craft delightful product experiences across the Margin platform.',
      nodeId: 'NODE_UI_024',
    },
    {
      title: 'Chief Financial Officer',
      location: 'Hybrid',
      type: 'Full-time',
      salary: '$180k – $260k',
      tags: ['FinOps', 'Fundraising', 'SaaS'],
      description: 'Lead strategic finance, design aligned pricing, and steward capital through growth and scale.',
      nodeId: 'NODE_FIN_001',
    },
    {
      title: 'Senior Backend Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$130k – $190k',
      tags: ['Python', 'TypeScript', 'PostgreSQL'],
      description: 'Design resilient services for sync, claims, and evidence matching at scale.',
      nodeId: 'NODE_BE_089',
    },
    {
      title: 'Systems Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120k – $170k',
      tags: ['SRE', 'Observability', 'Kubernetes'],
      description: 'Ensure reliability, performance, and cost-efficiency across our platform.',
      nodeId: 'NODE_SYS_042',
    },
    {
      title: 'Quality Assurance',
      location: 'Remote',
      type: 'Full-time',
      salary: '$80k – $130k',
      tags: ['Automation', 'Playwright', 'API Testing'],
      description: 'Own quality gates end-to-end with test automation and data-driven QA.',
      nodeId: 'NODE_QA_012',
    },
    {
      title: 'Chief Data Scientist',
      location: 'Remote',
      type: 'Full-time',
      salary: '$190k – $280k',
      tags: ['ML', 'NLP', 'Time Series'],
      description: 'Lead detection, scoring, and decision engines that maximize recoveries.',
      nodeId: 'NODE_DS_005',
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
        title: "PROTOCOL_FAULT",
        description: "Invalid format. System requires PDF or DOCX objects.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: "destructive",
        title: "THRESHOLD_EXCEEDED",
        description: "Resume object exceeds 5MB security limit.",
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
      const isSuccess = Math.random() > 0.05;

      if (isSuccess) {
        setUploadStatus('success');
        toast({
          title: "TRANSMISSION_SECURED",
          description: "Your credentials have been securely registered with our Talent Committee.",
        });
      } else {
        setUploadStatus('error');
        toast({
          variant: "destructive",
          title: "HANDSHAKE_FAILED",
          description: "Secure upload interrupted. Please retry manually.",
        });
      }
    }, 2000);
  };

  const closeApplication = () => {
    setIsApplicationOpen(false);
    setTimeout(() => {
      setResumeFile(null);
      setUploadStatus('idle');
    }, 300);
  };

  const filteredPositions = positions.filter(pos =>
    pos.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PageLayout title="Careers" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 container max-w-7xl mx-auto px-6 py-12">
          {/* Institutional Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col mb-16"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-white/5 pb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-emerald-500/50" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-emerald-500/80">Talent Acquisition</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-4 leading-tight italic">
                  Join the <span className="text-white/40 not-italic">Matrix</span>
                </h1>
                <p className="text-gray-400 max-w-xl text-lg leading-relaxed font-light">
                  We are recruiting specialized nodes for our autonomous audit infrastructure. We hire for <span className="text-emerald-500/60 font-mono text-sm uppercase tracking-wider">high_impact</span> ownership and strategic problem solving.
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Active Positions</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-2xl font-mono font-bold text-white tracking-tighter">0{positions.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Search / Filter */}
            <div className="max-w-2xl relative group">
              <div className="absolute inset-0 bg-emerald-500/5 rounded-xl blur-lg group-hover:bg-emerald-500/10 transition-all duration-500" />
              <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md focus-within:border-emerald-500/50 transition-all duration-300">
                <SearchIcon className="h-4 w-4 text-gray-500 ml-4 group-hover:text-emerald-500 transition-colors" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="QUERY_ROLES (REACT, ML, SYSTEMS...)"
                  className="bg-transparent border-none text-white font-mono text-[10px] h-12 uppercase placeholder:text-gray-600 focus-visible:ring-0"
                />
              </div>
            </div>
          </motion.div>

          {/* Job Nodes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            <AnimatePresence>
              {filteredPositions.map((position, index) => (
                <motion.div
                  key={position.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-[#0c0c0c] border border-white/5 rounded-2xl p-6 transition-all duration-500 hover:border-emerald-500/30 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                    <Briefcase className="w-12 h-12 text-white" />
                  </div>

                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-mono text-emerald-500/50 uppercase tracking-[0.2em]">{position.nodeId}</span>
                        <h3 className="text-xl font-medium text-white tracking-tight">{position.title}</h3>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed mb-6 font-light">
                      {position.description}
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {position.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-white/[0.03] border border-white/5 rounded text-[9px] font-mono text-gray-400 uppercase tracking-wider">
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Remuneration</span>
                          <span className="text-xs font-mono text-white/80">{position.salary}</span>
                        </div>
                        <Button
                          onClick={() => handleApplyClick(position.title)}
                          variant="ghost"
                          className="h-8 px-4 bg-white/[0.03] hover:bg-emerald-500 hover:text-black border border-white/5 hover:border-emerald-500 text-[10px] font-mono uppercase tracking-widest transition-all duration-300"
                        >
                          Initiate <ArrowRight className="ml-1.5 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Institutional Contact */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="pt-12 border-t border-white/5 text-center"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Protocol_Handshake_Available</span>
            </div>
            <h3 className="text-xl font-light text-white mb-4 italic">
              Don't see your specialized node type?
            </h3>
            <p className="text-sm text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
              We are always identifying high-performance anomalies. Transmit your profile to our secure registry for future consideration.
            </p>
            <a
              href="mailto:careers@margin.app"
              className="inline-block px-8 py-3 bg-white text-black hover:bg-emerald-500 transition-all duration-300 font-mono text-xs uppercase tracking-[0.2em] font-bold"
            >
              Contact Command
            </a>
          </motion.section>
        </div>
      </div>

      {/* Application Protocol Modal */}
      <Dialog open={isApplicationOpen} onOpenChange={setIsApplicationOpen}>
        <DialogContent className="max-w-md bg-[#0c0c0c] border border-white/10 text-white shadow-2xl backdrop-blur-xl p-0 overflow-hidden">
          {uploadStatus === 'success' ? (
            <div className="p-10 flex flex-col items-center text-center">
              <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                <CheckCircle className="h-10 w-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-serif text-white mb-2 italic">Transmission Secured</h3>
              <p className="text-sm text-gray-500 mb-8 max-w-xs font-light leading-relaxed">
                Your credentials for the <span className="text-emerald-400 font-mono uppercase text-xs">{selectedJob}</span> node have been encrypted and stored in our central registry.
              </p>
              <Button onClick={closeApplication} className="w-full h-12 bg-white text-black hover:bg-emerald-500 font-mono uppercase tracking-[0.2em] text-[10px] font-bold">
                Return to Command
              </Button>
            </div>
          ) : (
            <>
              <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-emerald-500" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-light tracking-tight">Application Protocol</DialogTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">NODE_TARGET: {selectedJob}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Given_Name</Label>
                    <Input className="h-11 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 text-white font-mono text-xs" placeholder="ALPHA" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Surname</Label>
                    <Input className="h-11 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 text-white font-mono text-xs" placeholder="NODE" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Communication_Channel</Label>
                  <Input className="h-11 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 text-white font-mono text-xs" placeholder="INSTITUTIONAL@EMAIL.COM" />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Credential_Payload (PDF/DOCX)</Label>

                  {!resumeFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300",
                        isDragOver ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.02]"
                      )}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileInput}
                      />
                      <Upload className="h-8 w-8 text-gray-600 mb-4 group-hover:text-emerald-500 transition-colors" />
                      <p className="text-xs font-mono text-gray-400 mb-1">DRAG_OBJECT_HERE</p>
                      <p className="text-[9px] text-gray-600 uppercase tracking-widest">Max_Limit: 5MB</p>
                    </div>
                  ) : (
                    <div className="border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between bg-emerald-500/5 backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <FileText className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div className="grid gap-0.5">
                          <p className="text-[11px] font-mono text-white truncate max-w-[180px]">{resumeFile.name.toUpperCase()}</p>
                          <p className="text-[9px] font-mono text-emerald-500/60 font-bold uppercase">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB // CHECKED</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setResumeFile(null)} className="h-8 w-8 p-0 rounded-full hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {uploadStatus === 'error' && (
                    <div className="flex items-center gap-3 text-[10px] font-mono text-rose-500 bg-rose-500/5 p-3 border border-rose-500/20 uppercase tracking-widest">
                      <AlertCircle className="h-4 w-4" />
                      <span>Transmission_Interrupted // Retry_Required</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-white/[0.02] flex gap-4">
                <Button variant="ghost" onClick={closeApplication} className="flex-1 h-12 bg-transparent border border-white/10 text-gray-500 hover:text-white font-mono uppercase text-[10px] tracking-widest">
                  Abort
                </Button>
                <Button
                  onClick={handleSubmitApplication}
                  disabled={!resumeFile || uploadStatus === 'uploading'}
                  className="flex-1 h-12 bg-white text-black hover:bg-emerald-500 disabled:opacity-50 font-mono uppercase text-[10px] font-bold tracking-[0.2em] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all"
                >
                  {uploadStatus === 'uploading' ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      ENCRYPTING...
                    </div>
                  ) : 'TRANSMIT'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
