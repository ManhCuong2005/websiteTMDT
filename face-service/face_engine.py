from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort


class FaceEngineError(ValueError):
    pass


@dataclass
class FaceSample:
    embedding: np.ndarray
    bbox: np.ndarray
    landmarks: np.ndarray
    blur_score: float

    @property
    def yaw_proxy(self) -> float:
        eye_mid_x = float((self.landmarks[0, 0] + self.landmarks[1, 0]) / 2)
        eye_distance = max(float(abs(self.landmarks[1, 0] - self.landmarks[0, 0])), 1.0)
        return float((self.landmarks[2, 0] - eye_mid_x) / eye_distance)

    @property
    def face_width(self) -> float:
        return float(self.bbox[2] - self.bbox[0])


def cosine_similarity(left: np.ndarray, right: np.ndarray) -> float:
    return float(np.dot(left, right) / (np.linalg.norm(left) * np.linalg.norm(right) + 1e-8))


class FaceEngine:
    def __init__(self, model_dir: Path):
        detector_path = model_dir / "det_500m.onnx"
        recognizer_path = model_dir / "w600k_mbf.onnx"
        if not detector_path.exists() or not recognizer_path.exists():
            raise RuntimeError(
                "Thieu model InsightFace. Hay chay setup-face-service.bat truoc."
            )

        providers = ["CPUExecutionProvider"]
        self.detector = ort.InferenceSession(str(detector_path), providers=providers)
        self.recognizer = ort.InferenceSession(str(recognizer_path), providers=providers)
        self.detector_input = self.detector.get_inputs()[0].name
        self.recognizer_input = self.recognizer.get_inputs()[0].name
        self.detector_size = (640, 640)
        self.detector_outputs = [output.name for output in self.detector.get_outputs()]

    def extract(self, image_bytes: bytes) -> FaceSample:
        image_array = np.frombuffer(image_bytes, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image is None:
            raise FaceEngineError("Anh khong hop le.")
        if min(image.shape[:2]) < 240:
            raise FaceEngineError("Anh qua nho. Hay dua mat gan camera hon.")

        detections = self._detect(image)
        if not detections:
            raise FaceEngineError("Khong tim thay khuon mat.")
        if len(detections) > 1:
            raise FaceEngineError("Chi de mot khuon mat trong khung hinh.")

        bbox, landmarks, score = detections[0]
        face_width = float(bbox[2] - bbox[0])
        if score < 0.55 or face_width < min(image.shape[:2]) * 0.22:
            raise FaceEngineError("Khuon mat chua ro hoac dang o qua xa.")

        aligned = self._align(image, landmarks)
        blur_score = float(cv2.Laplacian(cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var())
        if blur_score < 35:
            raise FaceEngineError("Anh bi mo. Hay giu camera on dinh va thu lai.")

        embedding = self._recognize(aligned)
        return FaceSample(embedding, bbox, landmarks, blur_score)

    def _detect(self, image: np.ndarray) -> list[tuple[np.ndarray, np.ndarray, float]]:
        target_width, target_height = self.detector_size
        height, width = image.shape[:2]
        scale = min(target_width / width, target_height / height)
        resized_width, resized_height = int(width * scale), int(height * scale)
        resized = cv2.resize(image, (resized_width, resized_height))
        canvas = np.zeros((target_height, target_width, 3), dtype=np.uint8)
        canvas[:resized_height, :resized_width] = resized

        blob = cv2.dnn.blobFromImage(
            canvas, 1.0 / 128.0, self.detector_size, (127.5, 127.5, 127.5), swapRB=True
        )
        outputs = self.detector.run(self.detector_outputs, {self.detector_input: blob})
        feature_count = len(outputs) // 3
        if feature_count not in (3, 5):
            raise RuntimeError("Dinh dang model SCRFD khong duoc ho tro.")

        strides = [8, 16, 32] if feature_count == 3 else [8, 16, 32, 64, 128]
        scores_list = outputs[:feature_count]
        boxes_list = outputs[feature_count : feature_count * 2]
        landmarks_list = outputs[feature_count * 2 :]
        candidates: list[tuple[np.ndarray, np.ndarray, float]] = []

        for stride, raw_scores, raw_boxes, raw_landmarks in zip(
            strides, scores_list, boxes_list, landmarks_list
        ):
            scores = raw_scores.reshape(-1)
            boxes = raw_boxes.reshape(-1, 4) * stride
            landmarks = raw_landmarks.reshape(-1, 10) * stride
            height_cells = target_height // stride
            width_cells = target_width // stride
            anchor_count = max(1, scores.shape[0] // (height_cells * width_cells))
            grid = np.stack(
                np.mgrid[:height_cells, :width_cells][::-1], axis=-1
            ).astype(np.float32)
            centers = (grid * stride).reshape(-1, 2)
            if anchor_count > 1:
                centers = np.repeat(centers, anchor_count, axis=0)

            for index in np.where(scores >= 0.5)[0]:
                center = centers[index]
                distances = boxes[index]
                bbox = np.array(
                    [
                        center[0] - distances[0],
                        center[1] - distances[1],
                        center[0] + distances[2],
                        center[1] + distances[3],
                    ],
                    dtype=np.float32,
                )
                points = landmarks[index].reshape(5, 2) + center
                candidates.append((bbox / scale, points / scale, float(scores[index])))

        return self._nms(candidates, 0.4)

    @staticmethod
    def _nms(
        candidates: list[tuple[np.ndarray, np.ndarray, float]], threshold: float
    ) -> list[tuple[np.ndarray, np.ndarray, float]]:
        if not candidates:
            return []
        candidates.sort(key=lambda item: item[2], reverse=True)
        kept: list[tuple[np.ndarray, np.ndarray, float]] = []
        while candidates:
            current = candidates.pop(0)
            kept.append(current)
            current_box = current[0]
            area = max(0.0, current_box[2] - current_box[0]) * max(
                0.0, current_box[3] - current_box[1]
            )
            remaining = []
            for candidate in candidates:
                box = candidate[0]
                intersection_width = max(
                    0.0, min(current_box[2], box[2]) - max(current_box[0], box[0])
                )
                intersection_height = max(
                    0.0, min(current_box[3], box[3]) - max(current_box[1], box[1])
                )
                intersection = intersection_width * intersection_height
                box_area = max(0.0, box[2] - box[0]) * max(0.0, box[3] - box[1])
                union = area + box_area - intersection
                if union <= 0 or intersection / union <= threshold:
                    remaining.append(candidate)
            candidates = remaining
        return kept

    @staticmethod
    def _align(image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
        template = np.array(
            [
                [38.2946, 51.6963],
                [73.5318, 51.5014],
                [56.0252, 71.7366],
                [41.5493, 92.3655],
                [70.7299, 92.2041],
            ],
            dtype=np.float32,
        )
        matrix, _ = cv2.estimateAffinePartial2D(
            landmarks.astype(np.float32), template, method=cv2.LMEDS
        )
        if matrix is None:
            raise FaceEngineError("Khong the can chinh khuon mat.")
        return cv2.warpAffine(image, matrix, (112, 112), borderValue=0)

    def _recognize(self, aligned: np.ndarray) -> np.ndarray:
        rgb = cv2.cvtColor(aligned, cv2.COLOR_BGR2RGB)
        tensor = ((rgb.astype(np.float32) - 127.5) / 127.5).transpose(2, 0, 1)
        tensor = np.expand_dims(tensor, axis=0)
        embedding = self.recognizer.run(None, {self.recognizer_input: tensor})[0]
        embedding = embedding.reshape(-1).astype(np.float32)
        norm = np.linalg.norm(embedding)
        if norm < 1e-8:
            raise FaceEngineError("Khong the tao du lieu khuon mat.")
        return embedding / norm
