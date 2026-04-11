import React from 'react';

const SystemErrorPreview: React.FC = () => {
  throw new Error('System error preview route triggered intentionally.');
  return null;
};

export default SystemErrorPreview;
