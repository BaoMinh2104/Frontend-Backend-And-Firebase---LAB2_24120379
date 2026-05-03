from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO
from threading import Lock, Thread
from typing import Any

from PIL import Image, UnidentifiedImageError

from backend.app.core.settings import caption_model


@dataclass(frozen=True)
class CaptionConfig:
    max_new_tokens: int = 50
    num_beams: int = 4


class CaptionService:
    def __init__(
        self,
        model_name: str | None = None,
        config: CaptionConfig | None = None,
        cache_dir: str | None = None,
        local_files_only: bool = False,
    ) -> None:
        self.model_name = model_name or caption_model.get(
            "model_name",
            "Salesforce/blip-image-captioning-large",
        )
        self.cache_dir = cache_dir if cache_dir is not None else caption_model.get("cache_dir")
        self.local_files_only = bool(
            caption_model.get("local_files_only", local_files_only)
        )
        self.config = config or CaptionConfig()
        self.device = "cpu"
        self.dtype: Any | None = None
        self._processor: Any | None = None
        self._model: Any | None = None
        self._torch: Any | None = None
        self._load_lock = Lock()
        self._state_lock = Lock()
        self._loading = False
        self._load_error: str | None = None
        self._preload_started = False

    def _load_model(self) -> None:
        if self._processor is not None and self._model is not None:
            return

        with self._load_lock:
            if self._processor is not None and self._model is not None:
                return

            self._loading = True
            self._load_error = None

            try:
                import torch
                from transformers import BlipForConditionalGeneration, BlipProcessor

                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                self.dtype = torch.float16 if self.device == "cuda" else torch.float32

                processor = BlipProcessor.from_pretrained(
                    self.model_name,
                    cache_dir=self.cache_dir,
                    local_files_only=self.local_files_only,
                )
                model = BlipForConditionalGeneration.from_pretrained(
                    self.model_name,
                    torch_dtype=self.dtype,
                    cache_dir=self.cache_dir,
                    local_files_only=self.local_files_only,
                )
                model.to(self.device)
                model.eval()

                self._torch = torch
                self._processor = processor
                self._model = model
            except ImportError as exc:
                self._load_error = (
                    "Thiếu thư viện chạy model Hugging Face. "
                    "Hãy cài lại môi trường bằng `pip install -r requirements.txt`."
                )
                raise RuntimeError(self._load_error) from exc
            except Exception as exc:
                self._load_error = str(exc)
                raise
            finally:
                self._loading = False

    def preload_in_background(self) -> None:
        with self._state_lock:
            if self.is_ready() or self._loading or self._preload_started:
                return
            self._preload_started = True

        thread = Thread(target=self._preload_worker, daemon=True)
        thread.start()

    def _preload_worker(self) -> None:
        try:
            self._load_model()
        except Exception:
            with self._state_lock:
                self._preload_started = False

    def _prepare_image(self, image_bytes: bytes) -> Image.Image:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
        except UnidentifiedImageError as exc:
            raise ValueError("Không thể đọc file ảnh. Hãy tải lên ảnh hợp lệ.") from exc
        except OSError as exc:
            raise ValueError("File ảnh bị lỗi hoặc định dạng không được hỗ trợ.") from exc
        return image

    def _move_inputs_to_device(self, inputs):
        moved_inputs = {}
        for key, value in inputs.items():
            if self._torch.is_tensor(value):
                if self._torch.is_floating_point(value):
                    moved_inputs[key] = value.to(self.device, self.dtype)
                else:
                    moved_inputs[key] = value.to(self.device)
            else:
                moved_inputs[key] = value
        return moved_inputs

    def generate_caption(self, image_bytes: bytes, prompt: str | None = None) -> str:
        if not image_bytes:
            raise ValueError("File ảnh rỗng.")

        self._load_model()
        image = self._prepare_image(image_bytes)
        cleaned_prompt = prompt.strip() if prompt else ""

        if cleaned_prompt:
            inputs = self._processor(image, cleaned_prompt, return_tensors="pt")
        else:
            inputs = self._processor(image, return_tensors="pt")

        inputs = self._move_inputs_to_device(inputs)

        with self._torch.inference_mode():
            outputs = self._model.generate(
                **inputs,
                max_new_tokens=self.config.max_new_tokens,
                num_beams=self.config.num_beams,
            )

        result = self._processor.decode(outputs[0], skip_special_tokens=True).strip()

        if not result:
            raise RuntimeError("Model không tạo được caption cho ảnh này.")

        return result

    def is_ready(self) -> bool:
        return self._processor is not None and self._model is not None

    def is_loading(self) -> bool:
        return self._loading

    def get_load_error(self) -> str | None:
        return self._load_error

    def get_model_name(self) -> str:
        return self.model_name

    def get_device(self) -> str:
        return self.device


caption_service = CaptionService()
