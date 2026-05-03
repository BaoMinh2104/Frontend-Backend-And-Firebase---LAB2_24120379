import os

import pytest
import requests

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
TIMEOUT = 60


def call_api(method: str, path: str, **kwargs) -> requests.Response:
    url = f"{BASE_URL}{path}"
    try:
        return requests.request(method, url, timeout=TIMEOUT, **kwargs)
    except requests.RequestException as exc:
        pytest.fail(
            f"Không thể kết nối API tại {url}. "
            f"Hãy chạy uvicorn trước khi test. Chi tiết: {exc}"
        )


def test_root() -> None:
    response = call_api("GET", "/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Firebase Image Captioning API is running"
    assert "/conversations" in data["endpoints"]


def test_health() -> None:
    response = call_api("GET", "/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "model" in data
    assert "device" in data
