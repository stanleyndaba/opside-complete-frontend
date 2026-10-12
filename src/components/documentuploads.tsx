'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Folder, Play } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  type: 'csv' | 'folder' | 'video';
  fileType: string;
}

export default function DocumentUploads() {
  const [isUploaded, setIsUploaded] = useState(false);

  const files: UploadedFile[] = [
    { id: '1', name: 'Carrier Bill of Lading SHP-48291.csv', type: 'csv', fileType: 'CSV File' },
    { id: '2', name: 'Supplier Commercial Invoice INV-0922.csv', type: 'csv', fileType: 'CSV File' },
    { id: '3', name: 'FBA Packing List BoxCount.csv', type: 'csv', fileType: 'CSV File' },
    { id: '4', name: 'Proof of Delivery POD Signature.csv', type: 'csv', fileType: 'CSV File' },
  ];

  const handleUpload = () => {
    setIsUploaded(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {!isUploaded ? (
            // UPLOAD STATE
            <motion.div
              key="upload-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              {/* Header */}
              <div className="text-left mb-7">
                <h2 className="text-xl font-semibold text-gray-800 mb-1.5">Document Uploads</h2>
                <p className="text-sm text-gray-400">Add your CSV files for analysis</p>
              </div>

              {/* Drop Zone with Animated Badges */}
              <div className="border-2 border-dashed border-[#007AFF]/30 bg-[#007AFF]/5 rounded-xl p-8 text-center mb-8 hover:border-[#007AFF] hover:bg-[#007AFF]/10 transition-colors cursor-pointer relative overflow-hidden min-h-[220px] flex flex-col items-center justify-center">
                {/* Animated Files */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                  {files.map((file, i) => {
                    const startX = [-140, 140, -140, 140][i % 4];
                    const startY = [-100, -80, 100, 80][i % 4];
                    return (
                      <motion.div
                        key={file.id}
                        className="absolute inline-flex items-center gap-1.5 bg-[#007AFF] text-white px-3 py-1.5 rounded-full shadow-md text-xs font-medium whitespace-nowrap"
                        initial={{ opacity: 0, scale: 0.5, x: startX, y: startY }}
                        animate={{ 
                          opacity: [0, 1, 1, 0], 
                          scale: [0.5, 1, 0.9, 0.4], 
                          x: [startX, startX * 0.6, 0], 
                          y: [startY, startY * 0.6, 0] 
                        }}
                        transition={{
                          duration: 3,
                          delay: i * 0.75,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="max-w-[100px] truncate">{file.name}</span>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Upload Icon */}
                <div className="relative z-10 w-14 h-14 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6 text-[#007AFF]" />
                </div>
                <p className="text-gray-600 text-sm relative z-10 font-medium">Drag and drop your files here</p>
                <p className="text-gray-400 text-xs relative z-10 mt-1">or click to browse</p>
              </div>

              {/* Upload Button */}
              <div className="flex justify-end">
                <motion.button
                  type="button"
                  aria-label="Upload documents"
                  title="Upload documents"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleUpload}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-950 text-white shadow-md transition-colors hover:bg-gray-800"
                >
                  <Upload className="h-5 w-5" strokeWidth={2} />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            // ATTACHMENT STATE
            <motion.div
              key="attachment-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
            >
              {/* Header */}
              <div className="text-left mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-1.5">Files Attached</h2>
                <p className="text-sm text-gray-400">Your documents are ready for analysis</p>
              </div>

              {/* Attached Files Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {files.slice(0, 3).map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className={`relative flex min-h-[132px] flex-col items-start rounded-xl border border-gray-200 bg-gray-50 p-3.5 transition-colors hover:border-gray-300 hover:bg-white ${
                      index === 2 ? 'col-span-2 w-[calc(50%-6px)] justify-self-center' : ''
                    }`}
                  >
                    {/* File Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        file.type === 'csv'
                          ? 'bg-[#EE3E38]'
                          : file.type === 'folder'
                            ? 'bg-blue-500'
                            : 'bg-blue-500'
                      }`}
                    >
                      {file.type === 'csv' && (
                        <FileText className="w-[18px] h-[18px] text-white" />
                      )}
                      {file.type === 'folder' && (
                        <Folder className="w-[18px] h-[18px] text-white" />
                      )}
                      {file.type === 'video' && (
                        <Play className="w-[18px] h-[18px] text-white" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="mt-3 min-w-0 w-full">
                      <p className="line-clamp-2 text-xs font-semibold leading-4 text-gray-900">{file.name}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{file.fileType}</p>
                    </div>

                    {/* Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      aria-label={`Remove ${file.name}`}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0 hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      <X className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-10 rounded-lg bg-[#007AFF] px-5 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                >
                  Start Analysis
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
