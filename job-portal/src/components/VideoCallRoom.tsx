/**
 * VideoCallRoom Component
 * Displays local and remote video streams with controls
 */

import React, { useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, AlertCircle } from 'lucide-react';

interface VideoCallRoomProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionStateDescription: string;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  peerInfo: { userId: string; role: 'company' | 'jobseeker' } | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: () => void;
  localUserName?: string;
  remoteUserName?: string;
}

export const VideoCallRoom: React.FC<VideoCallRoomProps> = ({
  localStream,
  remoteStream,
  connectionStateDescription,
  isConnected,
  isConnecting,
  error,
  peerInfo,
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
  localUserName = 'You',
  remoteUserName,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5" />
          <div>
            <h2 className="text-lg font-semibold">Video Interview</h2>
            <p className="text-sm text-gray-400">
              {isConnecting ? connectionStateDescription : 
                isConnected ? `Connected - ${peerInfo ? `${remoteUserName || 'Peer'}` : 'Waiting for peer...'}` :
                  connectionStateDescription}
            </p>
          </div>
        </div>
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-2 rounded-lg text-sm max-w-md">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="text-xs text-red-200 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {/* Remote Video (Main) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              muted={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Users className="w-24 h-24 mb-4 opacity-50" />
              <p className="text-xl">
                {isConnecting ? 'Connecting...' : 'Waiting for peer to join...'}
              </p>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        {localStream && (
          <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-700">
            {localStream.getVideoTracks().length > 0 && localStream.getVideoTracks()[0].enabled ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-500 mb-2" />
                <p className="text-xs text-gray-400">Camera Off</p>
                {localStream.getAudioTracks().length > 0 && (
                  <p className="text-xs text-green-400 mt-1">Audio Active</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-6 py-4">
        <div className="flex items-center justify-center gap-4">
          {/* Toggle Audio */}
          <button
            onClick={onToggleAudio}
            className={`p-4 rounded-full transition-all ${
              isAudioEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </button>

          {/* Toggle Video */}
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-full transition-all ${
              isVideoEnabled
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

