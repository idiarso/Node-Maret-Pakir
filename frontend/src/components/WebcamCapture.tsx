import React, { forwardRef } from 'react';
import Webcam from 'react-webcam';

interface WebcamCaptureProps {
  width?: number;
  height?: number;
  screenshotFormat?: string;
  audio?: boolean;
  videoConstraints?: MediaTrackConstraints;
  style?: React.CSSProperties;
}

const WebcamCapture = forwardRef<Webcam, WebcamCaptureProps>((props, ref) => {
  const {
    width = 640,
    height = 480,
    screenshotFormat = 'image/jpeg',
    audio = false,
    videoConstraints = {
      width: 640,
      height: 480,
      facingMode: 'environment'
    },
    style
  } = props;

  return (
    <Webcam
      ref={ref}
      audio={audio}
      width={width}
      height={height}
      screenshotFormat={screenshotFormat}
      videoConstraints={videoConstraints}
      style={style}
    />
  );
});

WebcamCapture.displayName = 'WebcamCapture';

export default WebcamCapture; 