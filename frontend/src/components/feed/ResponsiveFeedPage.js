import React, { useState, useEffect } from 'react';
import FeedLayout from './FeedLayout';
import MobileFeedPage from './MobileFeedPage';

const ResponsiveFeedPage = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile ? <MobileFeedPage /> : <FeedLayout />;
};

export default ResponsiveFeedPage;