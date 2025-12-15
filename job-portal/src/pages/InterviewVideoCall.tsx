/**
 * InterviewVideoCall Page
 * Main page for conducting video interviews
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useWebRTC } from '@/hooks/useWebRTC';
import { VideoCallRoom } from '@/components/VideoCallRoom';
import { _interviewService } from '@/api/interviewService';
import { WebRTCConfig } from '@/types/webrtc.types';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export const InterviewVideoCall: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const { user, company, role } = useAuth();
  
  const [webrtcConfig, setWebrtcConfig] = useState<WebRTCConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<{
    candidateName?: string;
    companyName?: string;
    jobTitle?: string;
  } | null>(null);

  // Get current user ID and role
  const userId = role === 'company' ? company?.id || '' : user?.id || '';
  const userRole = role === 'company' ? 'company' : 'jobseeker';

  // Fetch WebRTC config and interview details
  useEffect(() => {
    const fetchData = async () => {
      if (!interviewId || !userId) {
        setError('Missing interview ID or user information');
        setLoading(false);
        return;
      }

      try {
        // Fetch interview details
        const interviewResponse = await _interviewService.getInterviewById(interviewId);
        setInterviewDetails({
          candidateName: interviewResponse.data.candidateName,
          companyName: interviewResponse.data.companyName,
          jobTitle: interviewResponse.data.jobTitle,
        });

        // Check if interview is ONLINE type
        if (interviewResponse.data.type !== 'ONLINE') {
          setError('This interview is not an online video interview');
          setLoading(false);
          return;
        }

        // Check if interview is CONFIRMED
        if (interviewResponse.data.status !== 'CONFIRMED') {
          setError('This interview has not been confirmed yet');
          setLoading(false);
          return;
        }

        // Fetch WebRTC config
        const configResponse = await _interviewService.getWebRTCConfig(interviewId);
        console.log('WebRTC Config received:', configResponse.data);
        console.log('Signaling Server URL:', configResponse.data.signalingServerUrl);
        setWebrtcConfig(configResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching interview data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [interviewId, userId]);

  // Initialize WebRTC
  console.log('🎬 InterviewVideoCall: Initializing WebRTC', {
    webrtcConfig,
    userId,
    userRole,
    enabled: !!webrtcConfig && !loading,
    loading,
  });

  const {
    localStream,
    remoteStream,
    connectionStateDescription,
    isConnected,
    isConnecting,
    error: webrtcError,
    peerInfo,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useWebRTC({
    config: webrtcConfig!,
    userId,
    role: userRole,
    enabled: !!webrtcConfig && !loading,
  });

  // Handle end call - navigate back
  const handleEndCall = () => {
    endCall();
    navigate(-1); // Go back to previous page
  };

  // Determine remote user name
  const remoteUserName = userRole === 'company' 
    ? interviewDetails?.candidateName 
    : interviewDetails?.companyName;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (error || !webrtcConfig) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Join Call</h2>
          <p className="text-gray-400 mb-6">{error || 'Failed to load interview configuration'}</p>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <VideoCallRoom
      localStream={localStream}
      remoteStream={remoteStream}
      connectionStateDescription={connectionStateDescription}
      isConnected={isConnected}
      isConnecting={isConnecting}
      error={webrtcError || error}
      peerInfo={peerInfo}
      isAudioEnabled={isAudioEnabled}
      isVideoEnabled={isVideoEnabled}
      onToggleAudio={toggleAudio}
      onToggleVideo={toggleVideo}
      onEndCall={handleEndCall}
      localUserName={userRole === 'company' ? interviewDetails?.companyName : interviewDetails?.candidateName}
      remoteUserName={remoteUserName}
    />
  );
};

