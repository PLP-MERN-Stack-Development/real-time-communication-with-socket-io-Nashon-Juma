import React from 'react';
import { useParams } from 'react-router-dom';

const Channel = () => {
  const { channelId } = useParams();

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Channel Settings
        </h3>
        <p className="text-gray-500">
          Channel management features coming soon!
        </p>
      </div>
    </div>
  );
};

export default Channel;