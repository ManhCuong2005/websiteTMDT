import { useEffect, useRef, useState } from "react";
import api, { errorMessage } from "../services/api";
import { Icon } from "./Icons";

const ENROLL_INSTRUCTIONS = [
  "Nhìn thẳng vào camera",
  "Nghiêng nhẹ đầu sang trái",
  "Nghiêng nhẹ đầu sang phải",
];

export default function FaceCaptureDialog({
  mode,
  email,
  onClose,
  onAuthenticated,
  onEnrolled,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [samples, setSamples] = useState([]);
  const [challenge, setChallenge] = useState(null);
  const [message, setMessage] = useState("Đang mở camera...");
  const [error, setError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const createChallenge = async (signal) => {
    setChallenge(null);
    const response = await api.post("/auth/face/challenge", { email }, { signal });
    setChallenge(response.data);
  };

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const initialize = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 960 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        if (mode === "login") await createChallenge(controller.signal);
        if (!active) return;
        setCameraReady(true);
        setMessage("");
      } catch (caught) {
        if (!active || caught.code === "ERR_CANCELED") return;
        setError(
          caught?.name === "NotAllowedError"
            ? "Bạn cần cho phép sử dụng camera để tiếp tục."
            : errorMessage(caught),
        );
        setMessage("");
      }
    };

    initialize();
    return () => {
      active = false;
      controller.abort();
      stopCamera();
    };
  }, [mode, email]);

  const capture = () =>
    new Promise((resolve, reject) => {
      const video = videoRef.current;
      if (!video?.videoWidth || !video?.videoHeight) {
        reject(new Error("Camera chưa sẵn sàng"));
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Không thể chụp ảnh"))),
        "image/jpeg",
        0.9,
      );
    });

  const finishEnrollment = async (images) => {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append("images", image, `face-${index + 1}.jpg`);
    });
    const response = await api.post("/auth/face/enroll", formData);
    stopCamera();
    onEnrolled(response.data);
  };

  const finishLogin = async (neutralImage, challengeImage) => {
    const formData = new FormData();
    formData.append("email", email);
    formData.append("challengeToken", challenge.challengeToken);
    formData.append("neutralImage", neutralImage, "neutral.jpg");
    formData.append("challengeImage", challengeImage, "challenge.jpg");
    const response = await api.post("/auth/face/verify", formData);
    stopCamera();
    onAuthenticated(response.data);
  };

  const takePhoto = async () => {
    if (!cameraReady || busy) return;
    setBusy(true);
    setError("");
    try {
      const image = await capture();
      if (mode === "enroll") {
        const nextSamples = [...samples, image];
        if (nextSamples.length === ENROLL_INSTRUCTIONS.length) {
          setMessage("Đang tạo dữ liệu gương mặt...");
          await finishEnrollment(nextSamples);
        } else {
          setSamples(nextSamples);
          setStep(nextSamples.length);
        }
      } else if (step === 0) {
        setSamples([image]);
        setStep(1);
      } else {
        setMessage("Đang xác minh gương mặt...");
        await finishLogin(samples[0], image);
      }
    } catch (caught) {
      setError(caught.response ? errorMessage(caught) : caught.message);
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    setError("");
    setMessage(mode === "login" ? "Đang tạo thử thách mới..." : "");
    setStep(0);
    setSamples([]);
    try {
      if (!cameraReady) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 960 }, height: { ideal: 720 } },
          audio: false,
        });
        stopCamera();
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
      }
      if (mode === "login") await createChallenge();
      setMessage("");
    } catch (caught) {
      setError(errorMessage(caught));
      setMessage("");
    } finally {
      setBusy(false);
    }
  };

  const instruction =
    mode === "enroll"
      ? ENROLL_INSTRUCTIONS[step]
      : step === 0
        ? "Nhìn thẳng vào camera"
        : challenge?.instruction || "Thực hiện thử thách";
  const progressText =
    mode === "enroll"
      ? `Ảnh ${Math.min(step + 1, 3)} / 3`
      : `Bước ${Math.min(step + 1, 2)} / 2`;

  return (
    <div className="face-dialog-backdrop" role="presentation">
      <section
        className="face-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="face-dialog-title"
      >
        <header>
          <div>
            <span>{progressText}</span>
            <h2 id="face-dialog-title">
              {mode === "enroll" ? "Đăng ký gương mặt" : "Xác thực gương mặt"}
            </h2>
          </div>
          <button
            type="button"
            className="face-dialog-close"
            onClick={onClose}
            aria-label="Đóng camera"
            title="Đóng"
          >
            <Icon name="close" />
          </button>
        </header>

        <div className="face-camera">
          <video ref={videoRef} autoPlay muted playsInline />
          <div className="face-guide" aria-hidden="true" />
          {!cameraReady && !error && <div className="face-camera-status">{message}</div>}
        </div>

        <div className="face-dialog-content">
          <strong>{instruction}</strong>
          <p>Giữ khuôn mặt trong khung, đủ sáng và không đeo khẩu trang.</p>
          {message && cameraReady && <p className="face-processing">{message}</p>}
          {error && <p className="face-error">{error}</p>}
        </div>

        <footer>
          {error ? (
            <button type="button" className="btn btn-outline" onClick={retry} disabled={busy}>
              <Icon name="refresh" size={18} />
              Thử lại
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary face-capture-button"
              onClick={takePhoto}
              disabled={!cameraReady || busy || (mode === "login" && !challenge)}
            >
              <Icon name="camera" size={19} />
              {busy ? "Đang xử lý..." : "Chụp ảnh"}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
