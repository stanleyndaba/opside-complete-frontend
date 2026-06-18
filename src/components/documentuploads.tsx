'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, Folder, Play } from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  type: 'pdf' | 'folder' | 'video';
  fileType: string;
}

export default function DocumentUploads() {
  const [isUploaded, setIsUploaded] = useState(false);

  const files: UploadedFile[] = [
    { id: '1', name: 'Quality_Control_Rubric.pdf', type: 'pdf', fileType: 'PDF File' },
    { id: '2', name: 'Disputes_SOP.pdf', type: 'pdf', fileType: 'PDF File' },
    { id: '3', name: 'Training_Videos', type: 'folder', fileType: 'Folder' },
  ];

  const handleUpload = () => {
    setIsUploaded(true);
  };

  const handleReset = () => {
    setIsUploaded(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {!isUploaded ? (
            // UPLOAD STATE
            <motion.div
              key="upload-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-gray-700 mb-2">Upload documentation</h2>
                <p className="text-sm text-gray-400">Add your CSV files for analysis</p>
              </div>

              {/* Drop Zone */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-8 hover:border-[#007AFF] transition-colors cursor-pointer">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-500 text-sm">Drag and drop your files here</p>
              </div>

              {/* File List */}
              <div className="space-y-3 mb-8">
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 bg-[#007AFF] text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      {file.type === 'pdf' && <FileText className="w-5 h-5" />}
                      {file.type === 'folder' && <Folder className="w-5 h-5" />}
                      {file.type === 'video' && <Play className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium flex-1">{file.name}</span>
                  </motion.div>
                ))}
              </div>

              {/* Upload Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleUpload}
                className="w-full bg-[#007AFF] text-white font-medium py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload & Analyze
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
              className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-light text-gray-700 mb-2">Files Attached</h2>
                <p className="text-sm text-gray-400">Your documents are ready for analysis</p>
              </div>

              {/* Attached Files Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* File Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        file.type === 'pdf'
                          ? 'bg-red-100'
                          : file.type === 'folder'
                            ? 'bg-blue-100'
                            : 'bg-blue-100'
                      }`}
                    >
                      {file.type === 'pdf' && (
                        <FileText className="w-6 h-6 text-red-500" />
                      )}
                      {file.type === 'folder' && (
                        <Folder className="w-6 h-6 text-blue-500" />
                      )}
                      {file.type === 'video' && (
                        <Play className="w-6 h-6 text-blue-500" />
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">{file.fileType}</p>
                    </div>

                    {/* Remove Button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 hover:bg-gray-400 transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
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
