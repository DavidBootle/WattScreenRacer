import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import cv from "@techstark/opencv-js";
import io from "socket.io-client";
import useSocket from "../../src/useSocket";
import { TrashIcon } from "@heroicons/react/20/solid";
import parse from "color-parse";

const socket = io();

const WebcamCapture = ({
  jerseyCalibrations,
  emitEvent,
  lastUpdatedJerseyIndex,
}) => {
  useSocket(socket);
  const webcamRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const thresholdHelperCanvasRef = useRef(null);

  const capturing = useRef(true);
  const captureTimeoutRef = useRef(null); // Ref to store the timeout ID
  const processingImage = useRef(false); // Ref to track image processing state

  const processImage = async (imageSrc) => {
    if (!previewCanvasRef.current || !imageSrc || processingImage.current)
      return;
    processingImage.current = true; // Mark processing as started

    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const input_image = cv.imread(image);
    const hsv = new cv.Mat();
    cv.cvtColor(input_image, hsv, cv.COLOR_RGB2HSV, 0);

    // collect jersey positions
    let jersey_positions = [];

    // for each jersey calibration
    for (const jersey of jerseyCalibrations) {
      // convert jersey display color to hsv
      const displayColor = parse(jersey.displayColor);

      const displayColorHsv = new cv.Scalar(
        displayColor.values[0],
        displayColor.values[1],
        displayColor.values[2],
        255
      );

      const frameMask = new cv.Mat();
      let low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        jersey.hsvBounds.lowerHueBound,
        jersey.hsvBounds.lowerSaturationBound,
        jersey.hsvBounds.lowerValueBound,
        0,
      ]);
      let high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), [
        jersey.hsvBounds.upperHueBound,
        jersey.hsvBounds.upperSaturationBound,
        jersey.hsvBounds.upperValueBound,
        255,
      ]);
      cv.inRange(hsv, low, high, frameMask);

      const masked = new cv.Mat();
      cv.bitwise_and(input_image, input_image, masked, frameMask);

      cv.morphologyEx(
        frameMask,
        frameMask,
        cv.MORPH_CLOSE,
        cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(1, 1))
      );

      // find contours
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(
        frameMask,
        contours,
        hierarchy,
        cv.RETR_CCOMP,
        cv.CHAIN_APPROX_SIMPLE
      );

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
        cv.circle(input_image, center, 22, new cv.Scalar(0, 0, 0, 255), -1);
        cv.circle(input_image, center, 20, displayColorHsv, -1);

        if (lastUpdatedJerseyIndex === jerseyCalibrations.indexOf(jersey)) {
          cv.imshow(thresholdHelperCanvasRef.current, frameMask);
        }

        //
        jersey_positions.push({
          name: jersey.name,
          color: jersey.displayColor,
          // position: Math.max(0, Math.min(1, (cx / input_image.cols - 0.1) / 0.8))
          position: Math.max(
            0,
            Math.min(1, 1 - (cx / input_image.cols - 0.1) / 0.8)
          ),
        });
      }

      // cleanup
      frameMask.delete();
      low.delete();
      high.delete();
      masked.delete();
      contours.delete();
      hierarchy.delete();
    }

    // show red dots at 10% and 90% of the screen for calibration
    cv.circle(
      input_image,
      new cv.Point(input_image.cols * 0.1, input_image.rows / 2),
      10,
      new cv.Scalar(0, 0, 255, 255),
      -1
    );
    cv.circle(
      input_image,
      new cv.Point(input_image.cols * 0.9, input_image.rows / 2),
      10,
      new cv.Scalar(0, 0, 255, 255),
      -1
    );

    // Ensure the canvas element is ready for display
    cv.imshow(previewCanvasRef.current, input_image);

    // Cleanup to prevent memory leaks
    input_image.delete();
    hsv.delete();

    // Push jersey positions
    emitEvent(jersey_positions);

    // Stop processing and allow the next capture
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
  }, [jerseyCalibrations]); // Dependency array ensures capture restarts if bounds change

  return (
    <>
      <div className="flex flex-row relative">
        <canvas ref={previewCanvasRef} width="360" height="240"></canvas>
        <canvas
          ref={thresholdHelperCanvasRef}
          width="360"
          height="240"
        ></canvas>

        <Webcam
          audio={false}
          height={240}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          width={360}
          videoConstraints={{
            facingMode: {
              exact: "environment",
            },
          }}
        />
      </div>
    </>
  );
};

const Slider = ({ label, value, maximum, onChange }) => (
  <div className="flex flex-row gap-2">
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

const JerseyCalibrationWidget = ({
  jerseyData,
  setJerseyData,
  deleteJersey,
}) => {
  const hsvBounds = jerseyData.hsvBounds;
  const setHsvBounds = (newHsvBounds) => {
    setJerseyData({ ...jerseyData, hsvBounds: newHsvBounds });
  };

  return (
    <div className="shadow bg-neutral-100 rounded p-4 flex flex-col gap-4 relative">
      <button
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2"
        onClick={deleteJersey}
      >
        <TrashIcon className="w-6 h-6 text-white" />
      </button>
      <input
        className="w-64 rounded h-8 text-xl pl-2"
        type="text"
        value={jerseyData.name}
        onChange={(e) => setJerseyData({ ...jerseyData, name: e.target.value })}
      />

      {/* color picker */}

      <div className="flex flex-row items-center gap-2">
        <label>Display Color</label>
        <input
          type="color"
          className="w-12 h-12"
          value={jerseyData.displayColor}
          onChange={(e) =>
            setJerseyData({ ...jerseyData, displayColor: e.target.value })
          }
        />
      </div>

      <div>
        <Slider
          label="Low Hue"
          value={hsvBounds.lowerHueBound}
          maximum={180}
          onChange={(value) =>
            setHsvBounds({ ...hsvBounds, lowerHueBound: value })
          }
        />
        <Slider
          label="Hi Hue"
          value={hsvBounds.upperHueBound}
          maximum={180}
          onChange={(value) =>
            setHsvBounds({ ...hsvBounds, upperHueBound: value })
          }
        />
      </div>
      <div>
        <Slider
          label="Low Sat"
          value={hsvBounds.lowerSaturationBound}
          maximum={255}
          onChange={(value) =>
            setHsvBounds({ ...hsvBounds, lowerSaturationBound: value })
          }
        />
        <Slider
          label="Hi Sat"
          value={hsvBounds.upperSaturationBound}
          maximum={255}
          onChange={(value) =>
            setHsvBounds({ ...hsvBounds, upperSaturationBound: value })
          }
        />
      </div>
      <div>
        <Slider
          label="Low Val"
          value={hsvBounds.lowerValueBound}
          maximum={255}
          onChange={(value) =>
            setHsvBounds({ ...hsvBounds, lowerValueBound: value })
          }
        />
        <Slider
          label="Hi Val"
          value={hsvBounds.upperValueBound}
          maximum={255}
          onChange={(value) =>
            setHsvBounds({ ...hsvBounds, upperValueBound: value })
          }
        />
      </div>
    </div>
  );
};

const CameraPage = () => {
  // Jersey Defaults
  const [devices, setDevices] = useState([]);

  const [jerseyCalibrations, setJerseyCalibrations] = useState([
    {
      name: "Yellow",
      displayColor: "#fefb41",
      hsvBounds: {
        lowerHueBound: 29,
        upperHueBound: 56,
        lowerSaturationBound: 60,
        upperSaturationBound: 255,
        lowerValueBound: 165,
        upperValueBound: 255,
      },
    },
    {
      name: "Red",
      displayColor: "#e22400",
      hsvBounds: {
        lowerHueBound: 164,
        upperHueBound: 180,
        lowerSaturationBound: 190,
        upperSaturationBound: 255,
        lowerValueBound: 90,
        upperValueBound: 255,
      },
    },
  ]);
  
  const [lastUpdatedJerseyIndex, setLastUpdatedJerseyIndex] = useState(0);

  return (
    <>
      <div className="p-2 m-2 shadow overflow-scroll">
        <button
          className="bg-violet-400 text-white rounded p-2 m-2"
          onClick={() => {
            setJerseyCalibrations([
              ...jerseyCalibrations,
              {
                name: "new",
                displayColor: "hsla(0, 50%, 60%, 1)",
                hsvBounds: {
                  lowerHueBound: 0,
                  upperHueBound: 180,
                  lowerSaturationBound: 0,
                  upperSaturationBound: 255,
                  lowerValueBound: 0,
                  upperValueBound: 255,
                },
              },
            ]);
          }}
        >
          Add Jersey
        </button>
        <button
          className="bg-violet-400 text-white rounded p-2 m-2"
          onClick={() => {
            // copy the jerseyCalibrations to clipboard
            navigator.clipboard.writeText(JSON.stringify(jerseyCalibrations));
          }}
        >
          Copy calibrations
        </button>
        <button
          className="bg-violet-400 text-white rounded p-2 m-2"
          onClick={() => {
            // paste the jerseyCalibrations from clipboard
            navigator.clipboard.readText().then((text) => {
              setJerseyCalibrations(JSON.parse(text));
            });
          }}
        >
          Paste calibrations
        </button>

        <div className="flex flex-row gap-4 m-2">
          {jerseyCalibrations.map((jerseyData, index) => (
            <JerseyCalibrationWidget
              key={index}
              jerseyData={jerseyData}
              setJerseyData={(newJerseyData) => {
                setJerseyCalibrations([
                  ...jerseyCalibrations.slice(0, index),
                  newJerseyData,
                  ...jerseyCalibrations.slice(index + 1),
                ]);
                setLastUpdatedJerseyIndex(index);
              }}
              deleteJersey={
                jerseyCalibrations.length > 1
                  ? () => {
                      setJerseyCalibrations([
                        ...jerseyCalibrations.slice(0, index),
                        ...jerseyCalibrations.slice(index + 1),
                      ]);
                      if (index === lastUpdatedJerseyIndex) {
                        setLastUpdatedJerseyIndex(0);
                      }
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>
      <WebcamCapture
        jerseyCalibrations={jerseyCalibrations}
        emitEvent={(jersey_positions, image) => {
          if (jersey_positions.length > 0) {
            socket.emit("pos_update", jersey_positions);
          }
        }}
        lastUpdatedJerseyIndex={lastUpdatedJerseyIndex}
      />
    </>
  );
};

export default CameraPage;
