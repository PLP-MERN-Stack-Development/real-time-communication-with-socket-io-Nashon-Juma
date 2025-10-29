import React from 'react';
import { useParams } from 'react-router-dom';

const DirectMessages = () => {
  const { userId } = useParams();

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Direct Messages
        </h3>
        <p className="text-gray-500">
          Direct messaging feature coming soon!
        </p>
      </div>
    </div>
  );
};

export default DirectMessages;