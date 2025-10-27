"""
媒体资源数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from app.core.database import Base


class MediaAsset(Base):
    """媒体资源表"""

    __tablename__ = "media_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # 文件信息
    file_type = Column(String(20))  # image, audio, video
    file_url = Column(String, nullable=False)
    file_path = Column(String(500))
    file_size = Column(Integer)
    mime_type = Column(String(50))

    # 用途
    purpose = Column(String(50))  # avatar, voice_sample, memory_image
    related_entity_type = Column(String(50))  # companion, message, memory
    related_entity_id = Column(Integer)

    # 处理状态
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, failed

    # 时间戳
    created_at = Column(DateTime, server_default=func.now())

    # 元数据
    extra_metadata = Column("metadata", JSON, default={})

    def __repr__(self):
        return f"<MediaAsset {self.id}: {self.file_type} - {self.purpose}>"
