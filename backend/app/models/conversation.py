"""
对话相关数据模型
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float, Boolean
from sqlalchemy.sql import func

from app.core.database import Base


class Conversation(Base):
    """对话会话表"""

    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    companion_id = Column(Integer, ForeignKey("companions.id", ondelete="CASCADE"), nullable=False, index=True)

    # 会话信息
    title = Column(String(100))
    summary = Column(String)

    # 统计
    message_count = Column(Integer, default=0)

    # 时间戳
    started_at = Column(DateTime, server_default=func.now())
    last_message_at = Column(DateTime)
    ended_at = Column(DateTime, nullable=True)

    # 元数据
    extra_metadata = Column("metadata", JSON, default={})

    def __repr__(self):
        return f"<Conversation {self.id}: {self.title}>"


class Message(Base):
    """消息表"""

    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)

    # 消息内容
    role = Column(String(20), nullable=False)  # user, assistant, system
    content = Column(String, nullable=False)
    content_type = Column(String(20), default="text")  # text, audio, image

    # 媒体资源
    audio_url = Column(String, nullable=True)
    audio_duration = Column(Integer, nullable=True)

    # 情感分析
    emotion = Column(String(20), nullable=True)
    emotion_score = Column(Float, nullable=True)
    sentiment = Column(String(20), nullable=True)

    # AI生成信息
    model_used = Column(String(50), nullable=True)
    tokens_used = Column(Integer, nullable=True)

    # 标记
    is_important = Column(Boolean, default=False)
    is_proactive = Column(Boolean, default=False)

    # 时间戳
    created_at = Column(DateTime, server_default=func.now(), index=True)

    # 元数据
    extra_metadata = Column("metadata", JSON, default={})

    def __repr__(self):
        return f"<Message {self.id}: {self.role} - {self.content[:30]}>"
