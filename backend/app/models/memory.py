"""
记忆系统数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.sql import func

from app.core.database import Base


class Memory(Base):
    """长期记忆表"""

    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    companion_id = Column(Integer, ForeignKey("companions.id", ondelete="CASCADE"), nullable=False, index=True)

    # 记忆内容
    memory_type = Column(String(20))  # fact, event, preference, relationship, habit
    content = Column(String, nullable=False)

    # 重要性与频率
    importance_score = Column(Float, default=0.5)
    access_count = Column(Integer, default=0)

    # 向量化
    embedding_id = Column(String(100))  # Qdrant中的ID

    # 来源
    source_message_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    source_type = Column(String(20), default="conversation")

    # 时间信息
    created_at = Column(DateTime, server_default=func.now())
    last_accessed_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)

    # 元数据
    extra_metadata = Column("metadata", JSON, default={})

    def __repr__(self):
        return f"<Memory {self.id}: {self.memory_type} - {self.content[:30]}>"
