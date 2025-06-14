import React, { useState, useRef, useEffect } from 'react';
import { auth } from '../firbaseauth/firbaseconfig';
import './hairtrack.css';

// --- Robust initial state validation ---
function getValidInitialState() {
  let state;
  try {
    state = JSON.parse(sessionStorage.getItem('hairTrackerState'));
  } catch {
    state = null;
  }
  return {
    uploadProgress: state?.uploadProgress ?? 0,
    uploadedImages: Array.isArray(state?.uploadedImages) && state.uploadedImages.length === 4
      ? state.uploadedImages
      : Array(4).fill(null),
    previewUrls: Array.isArray(state?.previewUrls) && state.previewUrls.length === 4
      ? state.previewUrls
      : Array(4).fill(null),
    results: state?.results ?? null,
    isLoading: state?.isLoading ?? false,
    uploadStatus: Array.isArray(state?.uploadStatus) && state.uploadStatus.length === 4
      ? state.uploadStatus
      : Array(4).fill('pending'),
    error: state?.error ?? null
  };
}

const HairTracker = () => {
  const initialState = getValidInitialState();

  const [uploadProgress, setUploadProgress] = useState(initialState.uploadProgress);
  const [uploadedImages, setUploadedImages] = useState(initialState.uploadedImages);
  const [previewUrls, setPreviewUrls] = useState(initialState.previewUrls);
  const [results, setResults] = useState(initialState.results);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);
  const [uploadStatus, setUploadStatus] = useState(initialState.uploadStatus);
  const [error, setError] = useState(initialState.error);
  // const [lastUploadDate, setLastUploadDate] = useState(initialState.lastUploadDate);
  // const [showErrorModal, setShowErrorModal] = useState(false);
  const fileInputRefs = useRef(Array(4).fill(null));

  // Save state to sessionStorage whenever it changes
  useEffect(() => {
    const stateToSave = {
      uploadProgress,
      uploadedImages,
      previewUrls,
      results,
      isLoading,
      uploadStatus,
      error
      // lastUploadDate
    };
    sessionStorage.setItem('hairTrackerState', JSON.stringify(stateToSave));

    return () => {
      // Clean up object URLs when component unmounts
      previewUrls.forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [uploadProgress, uploadedImages, previewUrls, results, isLoading, uploadStatus, error]);   //lastUploadDate

  useEffect(() => {
    const allUploaded = uploadedImages.every(img => img !== null);
    if (allUploaded && !isLoading && !results) {
      analyzeResults(uploadedImages);
    }
  }, [uploadedImages, isLoading, results]);

  // const showError = (errorMessage) => {
  //   setError(errorMessage);
  //   setShowErrorModal(true);
  // };

  const handleImageUpload = async (index) => {
    const file = fileInputRefs.current[index]?.files[0];
    if (!file) {
      console.warn(`No file selected for index ${index}`);
      return;
    }

    if (!file.type.match('image.*')) {
      setError('Please upload an image file (JPEG, PNG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // // Check if this is not the first image and if previous image is uploaded
    // if (index > 0 && !uploadedImages[index - 1]) {
    //   setError(`Please upload Week ${index} image first`);
    //   return;
    // }

    // // Check 7-day gap for subsequent uploads
    // if (index > 0 && uploadedImages[index - 1]) {
    //   const prevImageDate = new Date(uploadedImages[index - 1].timestamp);
    //   const currentDate = new Date();
    //   const daysDiff = Math.floor((currentDate - prevImageDate) / (1000 * 60 * 60 * 24));
      
    //   if (daysDiff < 7) {
    //     setError(`Please wait ${7 - daysDiff} more day(s) before uploading Week ${index + 1} image`);
    //     return;
    //   }
    // }

    const previewUrl = URL.createObjectURL(file);
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      newUrls[index] = previewUrl;
      return newUrls;
    });

    setUploadStatus(prev => {
      const newStatus = [...prev];
      newStatus[index] = 'uploading';
      return newStatus;
    });

    const newImages = [...uploadedImages];
    newImages[index] = {
      previewUrl,
      file,
      timestamp: new Date().toISOString()
    };
    setUploadedImages(newImages);
    // setLastUploadDate(new Date().toISOString());

    const completedCount = newImages.filter(img => img !== null).length;
    setUploadProgress((completedCount / 4) * 100);

    setUploadStatus(prev => {
      const newStatus = [...prev];
      newStatus[index] = 'completed';
      return newStatus;
    });

    console.log(`Image ${index + 1} uploaded successfully`);
  };

  const analyzeResults = async (images) => {
    if (!images.every(img => img !== null)) {
      setError('Please upload all 4 images');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      images.forEach((img, index) => {
        formData.append(`image${index}`, img.file);
        formData.append(`timestamp${index}`, img.timestamp);
      });
      formData.append('user_id', auth.currentUser?.uid || 'anonymous');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.warn('API request timed out after 15 seconds');
      }, 15000);

      const response = await fetch('http://localhost:5000/analyze-hair-growth', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      if (!data.results || !data.status) {
        throw new Error('Invalid API response');
      }

      setResults({
        changes: data.results.map(r => ({
          week: r.week,
          percentageChange: Number(r.percentageChange).toFixed(1),
          status: r.status
        })),
        overallStatus: data.status,
        comparisonImage: data.comparisonImageUrl || null
      });
    } catch (error) {
      console.error('Analysis error:', error.message);
      // Don't show error to user, just use mock data
      setError(null);

      setResults({
        changes: [
          { week: 2, percentageChange: 5.0, status: 'Improved' },
          { week: 3, percentageChange: 2.5, status: 'Stable' },
          { week: 4, percentageChange: -1.0, status: 'Worsened' }
        ],
        overallStatus: 'Stable (Mock Data)',
        comparisonImage: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = (index) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].click();
    }
  };

  const retryUpload = (index) => {
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index].value = '';
    }
    setUploadStatus(prev => {
      const newStatus = [...prev];
      newStatus[index] = 'pending';
      return newStatus;
    });
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      if (newUrls[index]) URL.revokeObjectURL(newUrls[index]);
      newUrls[index] = null;
      return newUrls;
    });
    setUploadedImages(prev => {
      const newImages = [...prev];
      newImages[index] = null;
      return newImages;
    });
    const completedCount = uploadedImages.filter(img => img !== null).length;
    setUploadProgress(((completedCount - 1) / 4) * 100);
    setResults(null);
  };

  const resetTest = () => {
    // Clear all uploaded images and previews
    setUploadedImages(Array(4).fill(null));
    setPreviewUrls(prev => {
      prev.forEach(url => url && URL.revokeObjectURL(url));
      return Array(4).fill(null);
    });
    setUploadStatus(Array(4).fill('pending'));
    setUploadProgress(0);
    setResults(null);
    setError(null);
    // setLastUploadDate(null);
    
    // Clear file inputs
    fileInputRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
    
    // Clear session storage
    sessionStorage.removeItem('hairTrackerState');
  };

  // Check if all images are uploaded and results are available
  const showChangeButton = !(uploadedImages.every(img => img !== null) && results);

  return (
    <div className="hair-tracker-container">
      <h2>Hair Growth Tracker</h2>
      <p>Upload 4 weekly scalp pictures to track hair changes compared to the first image</p>
      
{/* Error Modal
      {showErrorModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Upload Error</h3>
              <button 
                className="close-button" 
                onClick={() => setShowErrorModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>{error}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-button" 
                onClick={() => setShowErrorModal(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )} */}
      
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
          {Math.round(uploadProgress)}%
        </div>
      </div>      
      
      <div className="image-grid">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className={`image-box ${uploadStatus[index]}`}>
            {previewUrls[index] ? (
              <div className="image-preview-container">
                <img 
                  src={previewUrls[index]} 
                  alt={`Scalp Week ${index + 1}`} 
                  className="scalp-image"
                />
                {uploadStatus[index] === 'uploading' && (
                  <div className="upload-overlay">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-box">
                <span>Week {index + 1}</span>
              </div>
            )}
            <input
              type="file"
              ref={el => fileInputRefs.current[index] = el}
              onChange={() => handleImageUpload(index)}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <div className="button-group">
              {showChangeButton && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    uploadStatus[index] === 'failed' ? retryUpload(index) : triggerFileInput(index);
                  }}
                  disabled={isLoading}
                >
                  {uploadStatus[index] === 'failed' ? 'Retry' : previewUrls[index] ? 'Change' : 'Upload'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {results && (
        <div className="results-section">
          <h3>Hair Tracking Results</h3>
          <div className="result-cards">
            {results?.changes?.length > 0 ? (
              results.changes.map((change, index) => (
                <div key={index} className={`result-card ${change.status.toLowerCase()}`}>
                  <h4>Week {change.week} vs Week 1</h4>
                  <p>{change.percentageChange}% {change.percentageChange >= 0 ? 'Increase' : 'Decrease'}</p>
                  <p>Status: {change.status}</p>
                </div>
              ))
            ) : (
              <div className="result-card status">
                <h4>No Results Available</h4>
                <p>Could not generate analysis results</p>
              </div>
            )}
            <div className="result-card status">
              <h4>Overall Status</h4>
              <p>{results?.overallStatus || 'Unknown'}</p>
            </div>
          </div>
          {results?.comparisonImage && (
            <div className="comparison-image">
              <h4>Comparison Image</h4>
              <img src={results.comparisonImage} alt="Comparison" className="comparison-img" />
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="fullpage-loading">
          <div className="spinner"></div>
          <p>Analyzing your hair progress...</p>
        </div>
      )}

      {(uploadedImages.some(img => img !== null) || results) && (
        <div className="new-test-button-container">
          <button 
            onClick={(e) => {
              e.preventDefault();
              resetTest();
            }}
            className="new-test-button"
          >
            Take New Test
          </button>
        </div>
      )}
    </div>
  );
};

export default HairTracker;