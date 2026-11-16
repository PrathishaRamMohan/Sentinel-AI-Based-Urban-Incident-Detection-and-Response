"""Train the accident detector from the converted Roboflow dataset."""

import argparse
from pathlib import Path

from ultralytics import YOLO


ROOT = Path(__file__).resolve().parent
DATASET = ROOT / "data" / "data.yaml"
OUTPUT = ROOT / "weights" / "accident_yolov8n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", type=Path, default=DATASET)
    parser.add_argument("--model", default="yolo26n.pt")
    parser.add_argument("--device", default=None, help="Ultralytics device, for example 0 or cpu")
    args = parser.parse_args()

    if not args.data.exists():
        raise FileNotFoundError(
            f"Dataset config not found: {args.data}. Extract the Roboflow dataset under backend/data and convert OBB labels first."
        )

    model = YOLO(args.model)
    train_options = {
        "data": str(args.data),
        "epochs": 50,
        "imgsz": 640,
        "batch": 16,
        "patience": 15,
        "project": str(OUTPUT.parent),
        "name": OUTPUT.name,
        "exist_ok": True,
        "plots": True,
    }
    if args.device is not None:
        train_options["device"] = args.device
    model.train(**train_options)

    best = OUTPUT / "weights" / "best.pt"
    if not best.exists():
        raise FileNotFoundError(f"Training finished without producing {best}")

    trained = YOLO(str(best))
    names = {str(name).strip().lower().replace("_", " ") for name in trained.names.values()}
    if "accident" not in names or "non accident" not in names:
        raise ValueError(f"Expected Accident and Non Accident classes, found {trained.names}")

    print(f"Trained accident detector: {best}")


if __name__ == "__main__":
    main()