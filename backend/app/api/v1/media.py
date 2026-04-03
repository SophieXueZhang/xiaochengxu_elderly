# backend/app/api/v1/media.py
"""
媒体文件处理API - 视频、图片、语音上传
"""
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime
import aiofiles
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.response import StandardResponse

router = APIRouter()

# 配置
UPLOAD_DIR = Path("uploads")
VIDEO_DIR = UPLOAD_DIR / "videos"
IMAGE_DIR = UPLOAD_DIR / "images"
AUDIO_DIR = UPLOAD_DIR / "audio"
THUMBNAIL_DIR = UPLOAD_DIR / "thumbnails"

# 创建目录
for directory in [VIDEO_DIR, IMAGE_DIR, AUDIO_DIR, THUMBNAIL_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# 文件限制
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_AUDIO_SIZE = 20 * 1024 * 1024  # 20MB

ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"]
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/x-m4a"]


def generate_filename(original_filename: str, prefix: str = "") -> str:
    """生成唯一文件名"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    ext = Path(original_filename).suffix
    return f"{prefix}{timestamp}_{unique_id}{ext}"


async def save_upload_file(upload_file: UploadFile, save_path: Path) -> int:
    """保存上传文件并返回文件大小"""
    file_size = 0
    async with aiofiles.open(save_path, 'wb') as f:
        while chunk := await upload_file.read(1024 * 1024):  # 1MB chunks
            file_size += len(chunk)
            await f.write(chunk)
    return file_size


@router.post("/upload-video")
async def upload_video(
    video: UploadFile = File(...),
    companion_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    上传视频文件

    限制：
    - 大小：最大50MB
    - 格式：MP4, MOV, AVI
    - 时长：由前端控制，最长60秒
    """
    # 检查文件类型
    if video.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的视频格式。支持的格式：{', '.join(ALLOWED_VIDEO_TYPES)}"
        )

    # 生成文件名
    filename = generate_filename(video.filename, prefix=f"user_{current_user.id}_")
    file_path = VIDEO_DIR / filename

    # 保存文件
    try:
        file_size = await save_upload_file(video, file_path)

        # 检查文件大小
        if file_size > MAX_VIDEO_SIZE:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail=f"视频文件过大。最大允许{MAX_VIDEO_SIZE / (1024*1024)}MB"
            )

        # 生成缩略图（可选，需要ffmpeg）
        # thumbnail_path = await generate_thumbnail(file_path)

        # 生成访问URL（需要配置静态文件服务或CDN）
        video_url = f"/media/videos/{filename}"
        thumbnail_url = None  # f"/media/thumbnails/{thumbnail_filename}"

        # 生成media_id（用于后续引用）
        media_id = str(uuid.uuid4())

        # TODO: 保存到数据库（media_assets表）
        # media_asset = MediaAsset(
        #     id=media_id,
        #     user_id=current_user.id,
        #     type="video",
        #     url=video_url,
        #     thumbnail=thumbnail_url,
        #     size=file_size,
        #     filename=filename
        # )
        # db.add(media_asset)
        # db.commit()

        return StandardResponse.success(
            data={
                "media_id": media_id,
                "url": video_url,
                "thumbnail": thumbnail_url,
                "size": file_size,
                "filename": filename
            },
            message="视频上传成功"
        )

    except Exception as e:
        # 清理已上传的文件
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")


@router.post("/upload-image")
async def upload_image(
    image: UploadFile = File(...),
    companion_id: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    上传图片文件

    限制：
    - 大小：最大10MB
    - 格式：JPEG, PNG, GIF, WebP
    """
    # 检查文件类型
    if image.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的图片格式。支持的格式：{', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    # 生成文件名
    filename = generate_filename(image.filename, prefix=f"user_{current_user.id}_")
    file_path = IMAGE_DIR / filename

    # 保存文件
    try:
        file_size = await save_upload_file(image, file_path)

        # 检查文件大小
        if file_size > MAX_IMAGE_SIZE:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail=f"图片文件过大。最大允许{MAX_IMAGE_SIZE / (1024*1024)}MB"
            )

        # 生成访问URL
        image_url = f"/media/images/{filename}"
        media_id = str(uuid.uuid4())

        return StandardResponse.success(
            data={
                "media_id": media_id,
                "url": image_url,
                "size": file_size,
                "filename": filename
            },
            message="图片上传成功"
        )

    except Exception as e:
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")


@router.post("/upload-audio")
async def upload_audio(
    audio: UploadFile = File(...),
    companion_id: Optional[int] = Form(None),
    duration: Optional[int] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    上传语音文件

    限制：
    - 大小：最大20MB
    - 格式：MP3, WAV, M4A
    - 时长：最长60秒
    """
    # 检查文件类型
    if audio.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的音频格式。支持的格式：{', '.join(ALLOWED_AUDIO_TYPES)}"
        )

    # 生成文件名
    filename = generate_filename(audio.filename, prefix=f"user_{current_user.id}_")
    file_path = AUDIO_DIR / filename

    # 保存文件
    try:
        file_size = await save_upload_file(audio, file_path)

        # 检查文件大小
        if file_size > MAX_AUDIO_SIZE:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail=f"音频文件过大。最大允许{MAX_AUDIO_SIZE / (1024*1024)}MB"
            )

        # 生成访问URL
        audio_url = f"/media/audio/{filename}"
        media_id = str(uuid.uuid4())

        return StandardResponse.success(
            data={
                "media_id": media_id,
                "url": audio_url,
                "size": file_size,
                "duration": duration,
                "filename": filename
            },
            message="语音上传成功"
        )

    except Exception as e:
        if file_path.exists():
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"上传失败：{str(e)}")
