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
              <div className="flex flex-col gap-3 mb-8 items-center">
                {files.map((file, index) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    className="flex items-center gap-3 bg-[#007AFF] text-white px-5 py-2.5 rounded-full hover:bg-blue-600 transition-colors shadow-sm w-full max-w-[90%]"
                  >
                    <div className="flex items-center justify-center opacity-90">
                      {file.type === 'csv' && <FileText className="w-5 h-5" />}
                      {file.type === 'folder' && <Folder className="w-5 h-5" />}
                      {file.type === 'video' && <Play className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium tracking-wide truncate">{file.name}</span>
                  </motion.div>
                ))}
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
