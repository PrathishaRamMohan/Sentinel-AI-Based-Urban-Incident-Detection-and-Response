"""Convert Roboflow OBB labels to axis-aligned YOLO detection labels."""

import argparse
from pathlib import Path


def convert_labels(input_dir: Path, output_dir: Path) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    converted = 0
    for source in sorted(input_dir.glob("*.txt")):
        output_lines = []
        for line_number, line in enumerate(source.read_text().splitlines(), 1):
            parts = line.split()
            if not parts:
                continue
            if len(parts) == 5:
                output_lines.append(" ".join(parts))
                continue
            if len(parts) != 9:
                raise ValueError(f"{source}:{line_number}: expected 5 or 9 values, found {len(parts)}")

            coordinates = [float(value) for value in parts[1:]]
            x_values = coordinates[0::2]
            y_values = coordinates[1::2]
            x_min, x_max = max(0.0, min(x_values)), min(1.0, max(x_values))
            y_min, y_max = max(0.0, min(y_values)), min(1.0, max(y_values))
            if x_max <= x_min or y_max <= y_min:
                raise ValueError(f"{source}:{line_number}: invalid or empty bounding box")

            output_lines.append(
                f"{parts[0]} {(x_min + x_max) / 2:.6f} {(y_min + y_max) / 2:.6f} "
                f"{x_max - x_min:.6f} {y_max - y_min:.6f}"
            )

        (output_dir / source.name).write_text("\n".join(output_lines) + ("\n" if output_lines else ""))
        converted += 1
    return converted


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dataset", type=Path, default=Path("backend/data"), nargs="?")
    parser.add_argument("--replace", action="store_true", help="Back up OBB labels and replace them")
    args = parser.parse_args()

    for split in ("train", "valid", "test"):
        labels = args.dataset / split / "labels"
        if not labels.exists():
            raise FileNotFoundError(f"Missing labels directory: {labels}")
        converted_dir = args.dataset / split / "labels_converted"
        count = convert_labels(labels, converted_dir)
        print(f"{split}: converted {count} label files to {converted_dir}")

        if args.replace:
            backup = args.dataset / split / "labels_obb_backup"
            labels.rename(backup)
            converted_dir.rename(labels)
            print(f"{split}: backed up originals to {backup}")


if __name__ == "__main__":
    main()