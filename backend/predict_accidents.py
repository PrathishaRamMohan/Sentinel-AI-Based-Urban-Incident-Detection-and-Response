"""Run the trained accident detector on a video and save annotated footage."""

import argparse
from pathlib import Path

from ultralytics import YOLO


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path, help="Path to a CCTV video file")
    parser.add_argument("--weights", type=Path, default=Path("backend/weights/accident_yolov8n/weights/best.pt"))
    parser.add_argument("--confidence", type=float, default=0.80)
    args = parser.parse_args()

    if not args.source.exists():
        raise FileNotFoundError(args.source)
    model = YOLO(str(args.weights))
    names = {int(class_id): str(name) for class_id, name in model.names.items()}
    accident_ids = {class_id for class_id, name in names.items() if name.lower().replace("_", " ") == "accident"}
    if not accident_ids:
        raise ValueError(f"Expected an Accident class, found {names}")

    results = model.predict(
        source=str(args.source),
        conf=args.confidence,
        save=True,
        project="backend/runs/detect",
        name="accident_footage",
        stream=True,
    )
    frames = 0
    detections = 0
    for result in results:
        frames += 1
        detections += sum(1 for box in result.boxes if int(box.cls) in accident_ids)
    print(f"Processed frames: {frames}")
    print(f"Accident detections: {detections}")
    print("Annotated output: backend/runs/detect/accident_footage")


if __name__ == "__main__":
    main()