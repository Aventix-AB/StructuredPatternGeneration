import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import numpy as np
from PIL import Image, ImageDraw, ImageTk

# ---------------------------------------------------------------------------
# Physical constants
# ---------------------------------------------------------------------------
PLATE_WIDTH_MM  = 127.76
PLATE_HEIGHT_MM = 85.48

SIZE_PRESETS = {
    "Microplate (127.76 × 85.48 mm)":     (127.76, 85.48),
    "A4 Portrait (210 × 297 mm)":          (210.0,  297.0),
    "A4 Landscape (297 × 210 mm)":         (297.0,  210.0),
    "A5 Portrait (148 × 210 mm)":          (148.0,  210.0),
    "Letter Portrait (215.9 × 279.4 mm)":  (215.9,  279.4),
    "Letter Landscape (279.4 × 215.9 mm)": (279.4,  215.9),
    "Custom":                              None,
}

PREVIEW_DPI = 96   # nominal DPI used when generating the preview tile

COLOR = {"Gray":None, "Red":(255,0,0), "Green":(0,255,0), "Blue":(0,0,255)}

def apply_color(img, color):
    if color is None:
        return img
    arr = np.array(img, dtype = np.float32)
    alpha = (255 - arr) / 255 # 1 is pattern; 0 is bg
    r0, g0, b0 = color
    R = np.clip(255 -alpha * (255 - r0), 0, 255).astype(np.uint8)
    G = np.clip(255 -alpha * (255 - g0), 0, 255).astype(np.uint8)
    B = np.clip(255 -alpha * (255 - b0), 0, 255).astype(np.uint8)
    return Image.fromarray(np.stack([R, G, B], axis=-1), mode='RGB')

# ---------------------------------------------------------------------------
# Pattern generators (unchanged logic, same as original script)
# ---------------------------------------------------------------------------

def mm_to_px(mm, dpi):
    return int((mm / 25.4) * dpi)


def generate_speckle(width_px, height_px, dpi,
                     density=0.35, min_dot_mm=0.05, max_dot_mm=0.25):
    min_rad_px = max(1, mm_to_px(min_dot_mm, dpi))
    max_rad_px = max(2, mm_to_px(max_dot_mm, dpi))
    if min_rad_px >= max_rad_px:
        max_rad_px = min_rad_px + 1

    img = Image.new('L', (width_px, height_px), color=255)
    draw = ImageDraw.Draw(img)

    area_px = width_px * height_px
    avg_rad_px = (min_rad_px + max_rad_px) / 2
    avg_dot_area = np.pi * (avg_rad_px ** 2)
    num_dots = int((area_px * density) / avg_dot_area)

    x_positions = np.random.randint(0, width_px, num_dots)
    y_positions = np.random.randint(0, height_px, num_dots)
    radii = np.random.randint(min_rad_px, max_rad_px + 1, num_dots)

    for x, y, r in zip(x_positions, y_positions, radii):
        draw.ellipse([x - r, y - r, x + r, y + r], fill=0)
    return img


def generate_checkerboard(width_px, height_px, dpi, square_size_mm=1.0):
    sq_px = max(1, mm_to_px(square_size_mm, dpi))
    y, x = np.indices((height_px, width_px))
    checker = ((x // sq_px) + (y // sq_px)) % 2
    img_array = (checker * 255).astype(np.uint8)
    return Image.fromarray(img_array, mode='L')


def generate_prba(width_px, height_px, dpi, block_size_mm=0.5):
    block_px = max(1, mm_to_px(block_size_mm, dpi))
    cols = (width_px // block_px) + 1
    rows = (height_px // block_px) + 1
    random_grid = np.random.randint(0, 2, (rows, cols), dtype=np.uint8)
    scaled_grid = random_grid.repeat(block_px, axis=0).repeat(block_px, axis=1)
    final_array = (scaled_grid[:height_px, :width_px] * 255).astype(np.uint8)
    return Image.fromarray(final_array, mode='L')

def generate_stripes(width_px, height_px, dpi, stripe_width_mm=1.5, orientation='horizontal'):
    stripe_px = max(1, mm_to_px(stripe_width_mm, dpi))

    if orientation == 'horizontal':
        x = np.arange(height_px)[:, None]
    else:
        x = np.arange(width_px)[None, :]
    pattern = ((x // stripe_px) % 2 * 255).astype(np.uint8)
    pattern = np.broadcast_to(pattern, (height_px, width_px)).copy()
    return Image.fromarray(pattern, mode='L')

def generate_sin_grating(width_px, height_px, dpi, frequency_mm=5.0, orientation='horizontal', phase_deg=0.0):
    freq_px = max(2, mm_to_px(frequency_mm, dpi))
    phase_rad = np.deg2rad(phase_deg)
    if orientation == 'horizontal':
        x = np.arange(height_px)[:, None]
    elif orientation == 'vertical':
        x = np.arange(width_px)[None, :]
    pattern = 0.5 * (1 + np.sin(2 * np.pi * x / freq_px + phase_rad))
    pattern = np.broadcast_to(pattern, (height_px, width_px)).copy()
    return Image.fromarray((pattern * 255).astype(np.uint8), mode='L')


# ---------------------------------------------------------------------------
# Save-options dialog
# ---------------------------------------------------------------------------

class SaveDialog(tk.Toplevel):
    """Modal dialog: choose output size + DPI, then save."""

    def __init__(self, parent, make_image_fn, pattern_name):
        super().__init__(parent)
        self.title("Save Options")
        self.resizable(False, False)
        self.grab_set()
        self.transient(parent)

        self._make_image_fn = make_image_fn
        self._pattern_name  = pattern_name

        self._preset_var = tk.StringVar()
        self._width_var  = tk.DoubleVar(value=PLATE_WIDTH_MM)
        self._height_var = tk.DoubleVar(value=PLATE_HEIGHT_MM)
        self._dpi_var    = tk.IntVar(value=600)

        PAD = 10
        self.configure(padx=PAD, pady=PAD)
        self._build_ui()
        self._on_preset_changed()

        self.update_idletasks()
        px = parent.winfo_rootx() + (parent.winfo_width()  - self.winfo_width())  // 2
        py = parent.winfo_rooty() + (parent.winfo_height() - self.winfo_height()) // 2
        self.geometry(f"+{px}+{py}")

    def _build_ui(self):
        row = 0

        ttk.Label(self, text="Output Size", font=("", 9, "bold")).grid(
            row=row, column=0, columnspan=2, sticky="w", pady=(0, 2))
        row += 1

        preset_cb = ttk.Combobox(self, textvariable=self._preset_var,
                                 values=list(SIZE_PRESETS.keys()),
                                 state="readonly", width=34)
        preset_cb.set(list(SIZE_PRESETS.keys())[0])
        preset_cb.grid(row=row, column=0, columnspan=2, sticky="ew")
        preset_cb.bind("<<ComboboxSelected>>", lambda _: self._on_preset_changed())
        row += 1

        for lbl, var in [("Width (mm):", self._width_var),
                         ("Height (mm):", self._height_var)]:
            ttk.Label(self, text=lbl).grid(row=row, column=0, sticky="w", pady=2)
            ttk.Spinbox(self, textvariable=var, from_=1.0, to=600.0,
                        increment=0.5, format="%.2f", width=10).grid(
                row=row, column=1, sticky="w", padx=(4, 0))
            row += 1

        ttk.Label(self, text="DPI:").grid(row=row, column=0, sticky="w", pady=2)
        ttk.Combobox(self, textvariable=self._dpi_var,
                     values=[150, 300, 600, 1200], width=9).grid(
            row=row, column=1, sticky="w", padx=(4, 0))
        row += 1

        ttk.Separator(self, orient="horizontal").grid(
            row=row, column=0, columnspan=2, sticky="ew", pady=8)
        row += 1

        btn = ttk.Frame(self)
        btn.grid(row=row, column=0, columnspan=2, sticky="e")
        ttk.Button(btn, text="Save…",  command=self._on_save).pack(side="left", padx=(0, 4))
        ttk.Button(btn, text="Cancel", command=self.destroy).pack(side="left")

    def _on_preset_changed(self):
        dims = SIZE_PRESETS.get(self._preset_var.get())
        if dims is not None:
            self._width_var.set(dims[0])
            self._height_var.set(dims[1])

    def _on_save(self):
        try:
            w_mm = self._width_var.get()
            h_mm = self._height_var.get()
            dpi  = int(self._dpi_var.get())
            w_px = mm_to_px(w_mm, dpi)
            h_px = mm_to_px(h_mm, dpi)
        except Exception as exc:
            messagebox.showerror("Invalid input", str(exc), parent=self)
            return

        default_name = f"{self._pattern_name}_{int(w_mm)}x{int(h_mm)}mm_{dpi}dpi.png"
        path = filedialog.asksaveasfilename(
            parent=self,
            defaultextension=".png",
            filetypes=[("PNG image", "*.png"), ("TIFF image", "*.tiff *.tif"),
                       ("All files", "*.*")],
            initialfile=default_name,
            title="Save Pattern Image")
        if not path:
            return

        self.config(cursor="watch")
        self.update_idletasks()
        try:
            img = self._make_image_fn(w_px, h_px, dpi)
            ext = path.rsplit(".", 1)[-1].lower()
            if ext in ("tif", "tiff"):
                img.save(path, dpi=(dpi, dpi), compression="tiff_lzw")
            else:
                img.save(path, dpi=(dpi, dpi))
        except Exception as exc:
            self.config(cursor="")
            messagebox.showerror("Save error", str(exc), parent=self)
            return

        self.config(cursor="")
        messagebox.showinfo(
            "Saved",
            f"Saved successfully:\n{path}\n\n"
            f"Resolution: {w_px} × {h_px} px @ {dpi} DPI\n"
            f"Physical size: {w_mm:.2f} × {h_mm:.2f} mm",
            parent=self)
        self.destroy()


# ---------------------------------------------------------------------------
# GUI
# ---------------------------------------------------------------------------

class PatternApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Structured Pattern Generator")
        self.resizable(True, True)
        self.minsize(820, 500)

        self._preview_source: Image.Image | None = None
        self._tk_img = None
        # Tracks (var, trace_id) so we can remove traces before rebuilding sliders
        self._param_traces: list[tuple[tk.Variable, str]] = []

        self._build_ui()

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self):
        PAD = 10
        self.configure(padx=PAD, pady=PAD)

        self.columnconfigure(0, weight=1)
        self.rowconfigure(0, weight=1)

        # top: controls (left, fixed width) + preview (right, expands)
        top = ttk.Frame(self)
        top.grid(row=0, column=0, sticky="nsew")
        top.columnconfigure(1, weight=1)
        top.rowconfigure(0, weight=1)

        ctrl = ttk.Frame(top, padding=4)
        ctrl.grid(row=0, column=0, sticky="ns", padx=(0, PAD))

        preview_frame = ttk.LabelFrame(top, text="Preview", padding=4)
        preview_frame.grid(row=0, column=1, sticky="nsew")
        preview_frame.columnconfigure(0, weight=1)
        preview_frame.rowconfigure(0, weight=1)

        # bottom bar
        bottom = ttk.Frame(self, padding=(0, PAD, 0, 0))
        bottom.grid(row=1, column=0, sticky="ew")

        self._build_controls(ctrl)
        self._build_preview(preview_frame)
        self._build_buttons(bottom)

    def _build_controls(self, parent):
        row = 0

        ttk.Label(parent, text="Pattern Type", font=("", 9, "bold")).grid(
            row=row, column=0, columnspan=2, sticky="w", pady=(0, 2))
        row += 1

        self._pattern_var = tk.StringVar(value="speckle")
        for label, val in [("Speckle", "speckle"),
                            ("Checkerboard", "checkerboard"),
                            ("PRBA (Pseudo-Random Binary Array)", "prba"),
                            ("Stripes", "stripes"),
                            ("Sin Grating", "sine")]:
            ttk.Radiobutton(parent, text=label, value=val,
                            variable=self._pattern_var,
                            command=self._on_pattern_changed).grid(
                row=row, column=0, columnspan=2, sticky="w")
            row += 1

        ttk.Separator(parent, orient="horizontal").grid(
            row=row, column=0, columnspan=2, sticky="ew", pady=6)
        row += 1

        ttk.Label(parent, text="Color", font=("", 9, "bold")).grid(row=row, column=0, columnspan=2, sticky="w", pady=(0, 2)); 
        row += 1
        self._color_var = tk.StringVar(value="Gray")
        color_cb = ttk.Combobox(parent, textvariable=self._color_var, values=list(COLOR.keys()), state="readonly", width=22)
        color_cb.grid(row=row, column=0, columnspan=2, sticky="w"); 
        row += 1

        ttk.Separator(parent, orient="horizontal").grid(row=row, column=0, columnspan=2, sticky="ew", pady=6);
        row += 1

        ttk.Label(parent, text="Pattern Parameters", font=("", 9, "bold")).grid(
            row=row, column=0, columnspan=2, sticky="w", pady=(0, 2))
        row += 1

        self._params_frame = ttk.Frame(parent)
        self._params_frame.grid(row=row, column=0, columnspan=2, sticky="ew")
        row += 1

        # All pattern param variables (persist across pattern-type switches)
        self._density_var    = tk.DoubleVar(value=0.35)
        self._min_dot_var    = tk.DoubleVar(value=0.05)
        self._max_dot_var    = tk.DoubleVar(value=0.25)
        self._sq_size_var    = tk.DoubleVar(value=1.0)
        self._block_size_var = tk.DoubleVar(value=0.5)
        self._stripe_width_var = tk.DoubleVar(value=1.5)
        self._sine_freq_var  = tk.DoubleVar(value=5.0)
        self._sine_phase_var = tk.DoubleVar(value=0.0)
        self._orient_var     = tk.StringVar(value="horizontal")

        self._on_pattern_changed()

        ttk.Separator(parent, orient="horizontal").grid(
            row=row, column=0, columnspan=2, sticky="ew", pady=6)
        row += 1

        self._info_var = tk.StringVar(value="")
        ttk.Label(parent, textvariable=self._info_var,
                  foreground="#555555", wraplength=260).grid(
            row=row, column=0, columnspan=2, sticky="w")

    def _build_param_slider(self, parent, row, label, var, from_, to,
                            resolution, fmt="%.3f"):
        ttk.Label(parent, text=label).grid(row=row, column=0, sticky="w")

        val_lbl = ttk.Label(parent, width=7, anchor="e")
        val_lbl.grid(row=row, column=2, sticky="w", padx=(2, 0))

        def _update_label(*_):
            # Guard: widget may have been destroyed when switching pattern type
            if val_lbl.winfo_exists():
                val_lbl.config(text=fmt % var.get())

        tid = var.trace_add("write", _update_label)
        self._param_traces.append((var, tid))
        _update_label()

        ttk.Scale(parent, variable=var, from_=from_, to=to,
                  orient="horizontal", length=180,
                  command=lambda v: var.set(
                      round(float(v) / resolution) * resolution)
                  ).grid(row=row, column=1, sticky="ew", padx=(4, 0))
        return row + 1

    def _build_preview(self, parent):
        self._canvas = tk.Canvas(parent, background="#cccccc", cursor="crosshair")
        self._canvas.grid(row=0, column=0, sticky="nsew")
        self._canvas.bind("<Configure>", self._on_canvas_resize)

        self._placeholder_id = self._canvas.create_text(
            200, 200,
            text='Click "Generate Preview"',
            fill="#666666", font=("", 11))

    def _build_buttons(self, parent):
        ttk.Button(parent, text="Generate Preview",
                   command=self._on_generate_preview).pack(side="left", padx=(0, 8))
        ttk.Button(parent, text="Save Image…",
                   command=self._on_save).pack(side="left")

    def _build_orient_selector(self, parent, row, var, choices):
        ttk.Label(parent, text="Orientation:").grid(row=row, column=0, sticky="w")
        cb = ttk.Combobox(parent, textvariable=var, values=choices,
                          state="readonly", width=12)
        cb.grid(row=row, column=1, columnspan=2, sticky="w", padx=(4, 0))
        return row + 1
    
    # ------------------------------------------------------------------
    # Event handlers
    # ------------------------------------------------------------------

    def _on_pattern_changed(self):
        """Remove stale variable traces, destroy old widgets, rebuild sliders."""
        for var, tid in self._param_traces:
            try:
                var.trace_remove("write", tid)
            except Exception:
                pass
        self._param_traces.clear()

        for w in self._params_frame.winfo_children():
            w.destroy()

        pt = self._pattern_var.get()
        f  = self._params_frame
        r  = 0

        if pt == "speckle":
            r = self._build_param_slider(f, r, "Density:",
                                         self._density_var, 0.05, 0.90, 0.01, "%.2f")
            r = self._build_param_slider(f, r, "Min dot (mm):",
                                         self._min_dot_var, 0.02, 0.30, 0.01)
            r = self._build_param_slider(f, r, "Max dot (mm):",
                                         self._max_dot_var, 0.05, 0.60, 0.01)
        elif pt == "checkerboard":
            r = self._build_param_slider(f, r, "Square size (mm):",
                                         self._sq_size_var, 0.10, 10.0, 0.05, "%.2f")
        elif pt == "prba":
            r = self._build_param_slider(f, r, "Block size (mm):",
                                         self._block_size_var, 0.05, 5.0, 0.05, "%.2f")
        elif pt == "stripes":
            r = self._build_param_slider(f, r, "Stripe width (mm):", self._stripe_width_var, 0.10, 10.0, 0.05)
            r = self._build_orient_selector(f, r, self._orient_var, ["horizontal", "vertical"])
        elif pt == "sine":
            r = self._build_param_slider(f, r, "Frequency (mm):", self._sine_freq_var, 0.10, 20.0, 0.05, "%.2f")
            r = self._build_param_slider(f, r, "Phase (°):", self._sine_phase_var, 0.0, 360.0, 1.0, "%.0f°")
            r = self._build_orient_selector(f, r, self._orient_var, ["horizontal", "vertical"])         

    def _make_image(self, w_px, h_px, dpi):
        img_gray = self._make_image_gray(w_px, h_px, dpi)
        color_rgb = COLOR.get(self._color_var.get())
        return apply_color(img_gray, color_rgb)

    def _on_canvas_resize(self, event):
        """Re-fit the cached preview into the new canvas size."""
        if self._preview_source is None:
            self._canvas.coords(self._placeholder_id,
                                event.width // 2, event.height // 2)
            return
        self._render_preview(event.width, event.height)

    def _make_image_gray(self, w_px, h_px, dpi):
        pt = self._pattern_var.get()
        if pt == "speckle":
            return generate_speckle(
                w_px, h_px, dpi,
                density=self._density_var.get(),
                min_dot_mm=self._min_dot_var.get(),
                max_dot_mm=self._max_dot_var.get())
        elif pt == "checkerboard":
            return generate_checkerboard(
                w_px, h_px, dpi,
                square_size_mm=self._sq_size_var.get())
        elif pt == "prba":
            return generate_prba(
                w_px, h_px, dpi,
                block_size_mm=self._block_size_var.get())
        elif pt == "stripes":
            return generate_stripes(w_px, h_px, dpi,
                stripe_width_mm=self._stripe_width_var.get(),
                orientation=self._orient_var.get())
        elif pt == "sine":
            return generate_sin_grating(w_px, h_px, dpi,
                frequency_mm=self._sine_freq_var.get(),
                phase_deg=self._sine_phase_var.get(),
                orientation=self._orient_var.get())

    def _render_preview(self, cw, ch):
        """Scale _preview_source to fill (cw × ch), centred, aspect-preserved."""
        src   = self._preview_source
        thumb = src.copy()
        thumb.thumbnail((cw, ch), Image.LANCZOS)

        mode = src.mode
        bg_val =(204, 204, 204) if mode == 'RGB' else 204

        canvas_img = Image.new(mode, (cw, ch), color=bg_val)
        x_off = (cw - thumb.width)  // 2
        y_off = (ch - thumb.height) // 2
        canvas_img.paste(thumb, (x_off, y_off))

        if mode == 'L':
            canvas_img = canvas_img.convert('RGB')

        self._tk_img = ImageTk.PhotoImage(canvas_img)
        self._canvas.delete("all")
        self._canvas.create_image(0, 0, anchor="nw", image=self._tk_img)

    def _on_generate_preview(self):
        cw = max(self._canvas.winfo_width(),  200)
        ch = max(self._canvas.winfo_height(), 200)

        self.config(cursor="watch")
        self.update_idletasks()
        try:
            # Generate at canvas pixel dimensions with a low nominal DPI so
            # structural sizes (dots, squares, blocks) stay visible on screen
            self._preview_source = self._make_image(cw, ch, PREVIEW_DPI)
        except Exception as exc:
            self.config(cursor="")
            messagebox.showerror("Generation error", str(exc))
            return
        self.config(cursor="")

        self._render_preview(cw, ch)
        color_label = self._color_var.get()

        self._info_var.set(
            f"Preview: {cw} × {ch} px  |  Colour: {color_label}  |  "
            "Use \"Save Image…\" to export at full print resolution.")

    def _on_save(self):
        SaveDialog(self, self._make_image, self._pattern_var.get())


# ---------------------------------------------------------------------------

def main():
    app = PatternApp()
    app.mainloop()


if __name__ == "__main__":
    main()

