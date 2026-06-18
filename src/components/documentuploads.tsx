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

  const handleReset = () => {
    setIsUploaded(false);
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
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-gray-700 mb-2">Upload documentation</h2>
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                className="w-full bg-[#007AFF] text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
              >
                Upload
              </motion.button>
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
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-gray-700 mb-2">Files Attached</h2>
                <p className="text-sm text-gray-400">Your documents are ready for analysis</p>
              </div>

              {/* Attached Files Grid */}
              <div className="grid grid-cols-1 gap-4 mb-8">
                {files.slice(0, 3).map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="relative bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* File Icon */}
                    <div
                      className={`w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 ${
                        file.type === 'csv'
                          ? 'bg-[#EE3E38]'
                          : file.type === 'folder'
                            ? 'bg-blue-500'
                            : 'bg-blue-500'
                      }`}
                    >
                      {file.type === 'csv' && (
                        <FileText className="w-6 h-6 text-white" />
                      )}
                      {file.type === 'folder' && (
                        <Folder className="w-6 h-6 text-white" />
                      )}
                      {file.type === 'video' && (
                        <Play className="w-6 h-6 text-white" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[15px] font-semibold text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{file.fileType}</p>
                    </div>

                    {/* Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0 hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      <X className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.button>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReset}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-medium py-3 rounded-lg hover:border-gray-400 transition-colors"
                >
                  Upload More
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 bg-[#007AFF] text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors"
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
