"""
Test script to verify the local models service is working
Run after starting the service with: python -m pytest test_service.py -v
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check endpoint"""
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    print("✓ Health check passed")


def test_text_generation():
    """Test text generation endpoint"""
    payload = {
        "prompt": "Tell me a short joke.",
        "max_tokens": 100,
        "temperature": 0.7,
    }
    response = requests.post(f"{BASE_URL}/text/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "text" in data
    assert len(data["text"]) > 0
    print(f"✓ Text generation passed: {data['text'][:100]}...")


def test_image_generation():
    """Test image generation endpoint"""
    payload = {
        "prompt": "A beautiful mountain landscape at sunset",
        "num_inference_steps": 20,
        "guidance_scale": 7.5,
        "width": 512,
        "height": 512,
    }
    response = requests.post(f"{BASE_URL}/image/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "image_base64" in data
    assert len(data["image_base64"]) > 0
    print(f"✓ Image generation passed (base64 length: {len(data['image_base64'])})")


def test_video_frames():
    """Test video frames generation endpoint"""
    payload = {
        "prompt": "A spinning cube",
        "num_frames": 2,
        "num_inference_steps": 20,
    }
    response = requests.post(f"{BASE_URL}/video/generate-frames", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "frames" in data
    assert len(data["frames"]) == 2
    print(f"✓ Video frames generation passed ({len(data['frames'])} frames)")


if __name__ == "__main__":
    print("Testing Local Models Service...")
    print("-" * 50)
    
    try:
        test_health()
        test_text_generation()
        test_image_generation()
        test_video_frames()
        print("-" * 50)
        print("All tests passed! ✓")
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to service. Is it running on port 8000?")
    except AssertionError as e:
        print(f"✗ Test failed: {e}")
    except Exception as e:
        print(f"✗ Error: {e}")
