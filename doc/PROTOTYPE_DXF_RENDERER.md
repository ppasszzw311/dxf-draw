# Prototype DXF Renderer

## Purpose

This prototype is a small Python DXF renderer used to validate the next architecture direction before rewriting the existing Node.js implementation.

The prototype focuses on:

- Reading the existing scaffold JSON format from `lib/example.json`.
- Producing CAD-native DXF entities instead of converting SVG paths.
- Creating editable `TEXT` entities for Chinese labels.
- Defining a LibreCAD-oriented text style named `CJK_TEXT`.
- Separating drawing layers for grid, text, anchors, stairs, rungs, and bracing.
- Writing DXF R2007 so Unicode text is handled through a newer DXF format.

## Files

```text
requirements-prototype.txt
prototype/
  render_dxf.py
  scaffold_model.py
  validate_dxf.py
  output/
    librecad_cjk_test.dxf
```

The `output/` directory is ignored by git because generated DXF files should not be committed by default.

## Run

Install the prototype dependency:

```bash
python -m pip install -r requirements-prototype.txt
```

Generate the test DXF:

```bash
python prototype/render_dxf.py
```

Validate the generated DXF without opening LibreCAD:

```bash
python prototype/validate_dxf.py
```

Custom input/output:

```bash
python prototype/render_dxf.py --input lib/example.json --output prototype/output/librecad_cjk_test.dxf
```

## LibreCAD Validation

Open the generated DXF in LibreCAD and check:

- Chinese text is visible.
- Chinese text remains editable text, not exploded geometry.
- Layers are present and usable.
- Basic entities are editable:
  - grid rectangles
  - anchor circles
- stair lines
- rung lines
- bracing lines

If LibreCAD cannot be installed on the current machine, use `prototype/validate_dxf.py` as the first-pass automated check. It validates:

- DXF can be parsed by `ezdxf`.
- Required layers exist.
- `CJK_TEXT` style exists and points to `unicode.lff`.
- Required entity types exist.
- Chinese sample strings are preserved as editable `TEXT` entities.

This does not replace GUI validation, but it lets us continue backend and model work before a LibreCAD test environment is available.

## Font Strategy

The prototype defines the text style:

```text
STYLE: CJK_TEXT
font: unicode.lff
```

For the best LibreCAD result, make sure LibreCAD can find `unicode.lff` or replace the style font with another Chinese-capable `.lff` font such as `azomix.lff`.

If LibreCAD does not have the configured font, it may fall back to another font and Chinese text may appear as boxes or missing glyphs.

The prototype writes DXF R2007 because older DXF versions commonly declare legacy code pages such as `ANSI_1252`, which is risky for Chinese text. If LibreCAD compatibility testing shows that R2000/R2004 is required, the renderer should add an explicit escaping strategy for Chinese text before downgrading the DXF version.

## Current Scope

This prototype is intentionally not a full replacement for the existing DXF generator. It is only meant to validate:

1. Python + `ezdxf` as the DXF backend.
2. LibreCAD-compatible text style strategy.
3. A model-driven renderer that does not depend on SVG conversion.

## Current Automated Validation Result

Latest local validation:

```text
Version: AC1021
Entities: 164
Entity counts:
  CIRCLE: 15
  LINE: 96
  LWPOLYLINE: 25
  TEXT: 28
Validation: OK
```
