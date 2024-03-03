import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import cv from '@techstark/opencv-js';

const videoConstraints = {
  width: 720,
  height: 480,
  facingMode: 'user',
  
};

const WebcamCapture = ({ bounds, updateCenterOfMass }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const capturing = useRef(true);
  const captureTimeoutRef = useRef(null); // Ref to store the timeout ID
  const processingImage = useRef(false); // Ref to track image processing state

  const processImage = async (imageSrc) => {
    if (!canvasRef.current || !imageSrc || processingImage.current) return;
    processingImage.current = true; // Mark processing as started

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const input_image = cv.imread(image);
    const hsv = new cv.Mat();
    cv.cvtColor(input_image, hsv, cv.COLOR_RGB2HSV, 0);
    
    // print middle of image pixel value
    const middle = new cv.Point(input_image.cols / 2, input_image.rows / 2);
    const hsv_pixel = hsv.ucharPtr(middle.y, middle.x);


    const frameMask = new cv.Mat();
    let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [bounds.lowerHueBound, bounds.lowerSaturationBound, bounds.lowerValueBound, 0]);
    let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [bounds.upperHueBound, bounds.upperSaturationBound, bounds.upperValueBound, 255]);
    cv.inRange(hsv, low, high, frameMask);

    const masked = new cv.Mat();
    cv.bitwise_and(input_image, input_image, masked, frameMask);


    cv.morphologyEx(frameMask, frameMask, cv.MORPH_CLOSE, cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(1,1)));


    // find contours
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(frameMask, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    // find the largest contour
    let maxArea = 0;
    let maxAreaIndex = 0;
    for (let i = 0; i < contours.size(); ++i) {
      let area = cv.contourArea(contours.get(i));
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = i;
      }
    }

    // if there is a contour
    if (maxArea > 0) {
      // draw center of mass on the largest contour
      let M = cv.moments(contours.get(maxAreaIndex), false);
      let cx = M.m10 / M.m00;
      let cy = M.m01 / M.m00;
      let center = new cv.Point(cx, cy);
      cv.circle(masked, center, 20, new cv.Scalar(255, 0, 0, 255), -1);

      // update center of mass
      updateCenterOfMass({x: cx / input_image.cols, y: cy / input_image.rows});
    }


    // Ensure the canvas element is ready for display
    cv.imshow(canvasRef.current, masked);
    

    // Cleanup to prevent memory leaks
    input_image.delete();
    hsv.delete();
    frameMask.delete();
    low.delete();
    high.delete();
    masked.delete();

    //
    processingImage.current = false;
  };

  const capture = () => {
    if (capturing.current && webcamRef.current && !processingImage.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        processImage(imageSrc).then(() => {
          // Set and store the timeout ID for later cleanup
          captureTimeoutRef.current = setTimeout(capture, 100); // Adjust as needed
        });
      }
    }
  };
  
  useEffect(() => {
    capturing.current = true;
    capture();
    return () => {
      capturing.current = false; // Ensure capturing stops when the component unmounts
      clearTimeout(captureTimeoutRef.current); // Clear the ongoing timeout
    };
  }, [bounds]); // Dependency array ensures capture restarts if bounds change
  
  return (
    <>
      <Webcam
        audio={false}
        height={480}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={720}
        videoConstraints={videoConstraints}
      />
      <canvas ref={canvasRef} width="720" height="480"></canvas>
    </>
  );
};


const Slider = ({ label, value, maximum, onChange }) => (
  <div>
    <label>{label}</label>
    <input
      type="range"
      min="0"
        max={maximum}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
    />
    <span>{value}</span>
  </div>
);
const CameraPage = () => {

    // hsla(63, 50%, 60%, 1)
  const [hsvBounds, setHsvBounds] = useState({
    lowerHueBound: 0, // 20
    upperHueBound: 180, // 40
    lowerSaturationBound: 0, // 170
    upperSaturationBound: 255, // 190
    lowerValueBound: 0, // 140
    upperValueBound: 255, // 160
  })
  const [centerOfMass, setCenterOfMass] = useState({
    x: 0,
    y: 0
  
  })


  return <>
  <Slider label="Lower Hue" value={hsvBounds.lowerHueBound} maximum={180} onChange={(value) => setHsvBounds({ ...hsvBounds, lowerHueBound: value })} />
  <Slider label="Upper Hue" value={hsvBounds.upperHueBound} maximum={180} onChange={(value) => setHsvBounds({ ...hsvBounds, upperHueBound: value })} />
    <Slider label="Lower Saturation" value={hsvBounds.lowerSaturationBound} maximum={255} onChange={(value) => setHsvBounds({ ...hsvBounds, lowerSaturationBound: value })} />
    <Slider label="Upper Saturation" value={hsvBounds.upperSaturationBound} maximum={255} onChange={(value) => setHsvBounds({ ...hsvBounds, upperSaturationBound: value })} />
    <Slider label="Lower Value" value={hsvBounds.lowerValueBound} maximum={255} onChange={(value) => setHsvBounds({ ...hsvBounds, lowerValueBound: value })} />
    <Slider label="Upper Value" value={hsvBounds.upperValueBound} maximum={255} onChange={(value) => setHsvBounds({ ...hsvBounds, upperValueBound: value })} />
    <WebcamCapture bounds={hsvBounds} updateCenterOfMass={
      (center) => setCenterOfMass(center)
    } />
    <div>
      <h2>Center of Mass</h2>
      <p>X: {centerOfMass.x.toFixed(2)}</p>
      <p>Y: {centerOfMass.y.toFixed(2)}</p>

      {/* progress bar */}
      <progress value={centerOfMass.x} max="1" className="w-full h-32 bg-gray-300 rounded-lg [&::-webkit-progress-bar]:rounded-lg [&::-webkit-progress-value]:rounded-lg   [&::-webkit-progress-bar]:bg-slate-300 [&::-webkit-progress-value]:bg-violet-400 [&::-moz-progress-bar]:bg-violet-400"></progress>
    </div>
  </>
}


export default CameraPage;
