# backend/app/api/v1/conversations_video.py
"""
视频消息处理扩展
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.companion import Companion
from app.models.conversation import Conversation, Message
from app.schemas.response import StandardResponse
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/send-video")
async def send_video_message(
    companion_id: int,
    media_id: str,
    caption: Optional[str] = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    发送视频消息并获取AI回应

    参数：
    - companion_id: 陪伴角色ID
    - media_id: 视频媒体ID（上传后返回的）
    - caption: 视频说明文字
    """
    # 验证角色所有权
    companion = db.query(Companion).filter(
        Companion.id == companion_id,
        Companion.user_id == current_user.id,
        Companion.deleted_at.is_(None)
    ).first()

    if not companion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在"
        )

    # TODO: 验证media_id是否存在且属于当前用户
    # media_asset = db.query(MediaAsset).filter(
    #     MediaAsset.id == media_id,
    #     MediaAsset.user_id == current_user.id
    # ).first()
    # if not media_asset:
    #     raise HTTPException(status_code=404, detail="视频不存在")

    # 获取或创建对话
    conversation = db.query(Conversation).filter(
        Conversation.companion_id == companion_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        conversation = Conversation(
            user_id=current_user.id,
            companion_id=companion_id,
            title=f"与{companion.name}的对话"
        )
        db.add(conversation)
        db.flush()

    # 创建用户视频消息
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=caption or "分享了一个视频",
        message_type="video",
        metadata={
            "media_id": media_id,
            # "video_url": media_asset.url,
            # "thumbnail": media_asset.thumbnail,
            # "duration": media_asset.duration,
            # "size": media_asset.size
        }
    )
    db.add(user_message)
    db.flush()

    # 生成AI回应
    try:
        # 构建提示词
        video_context = caption if caption else "用户分享了一个视频"

        prompt = f"""
用户是一位中老年人，刚刚分享了一个视频。

视频说明：{video_context}

请以{companion.name}的身份，用温暖、鼓励的语气回应。要求：

1. 真诚赞美用户的分享
2. 鼓励继续保持这样的生活方式
3. 关心用户的身体健康
4. 语气要亲切、温暖
5. 回应要具体，不要太泛泛而谈

角色性格：{companion.personality.get('traits', [])}
语气风格：{companion.personality.get('tone', 'gentle')}

请生成一段{companion.name}对这个视频的回应（100字以内）：
"""

        # 调用AI生成回应
        ai_response = await ai_service.generate_response(
            prompt=prompt,
            companion=companion,
            conversation_history=[]  # 可以加载历史消息
        )

        # 创建AI消息
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response.get("content", "谢谢你的分享！"),
            message_type="text",
            metadata={
                "video_analysis": {
                    "caption": caption,
                    "response_type": "text"
                }
            }
        )
        db.add(assistant_message)

        # 更新对话
        conversation.last_message_at = user_message.created_at
        conversation.message_count += 2

        db.commit()

        # 返回结果
        return StandardResponse.success(
            data={
                "conversation_id": conversation.id,
                "user_message": {
                    "id": user_message.id,
                    "role": "user",
                    "type": "video",
                    "content": user_message.content,
                    "media": {
                        "media_id": media_id,
                        # 实际应该从media_asset获取
                        "url": f"/media/videos/{media_id}.mp4",
                        "thumbnail": f"/media/thumbnails/{media_id}.jpg",
                    },
                    "created_at": user_message.created_at.isoformat()
                },
                "assistant_message": {
                    "id": assistant_message.id,
                    "role": "assistant",
                    "type": "text",
                    "content": assistant_message.content,
                    "created_at": assistant_message.created_at.isoformat()
                }
            },
            message="发送成功"
        )

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"生成回应失败：{str(e)}"
        )


@router.post("/send-image")
async def send_image_message(
    companion_id: int,
    media_id: str,
    caption: Optional[str] = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    发送图片消息并获取AI回应

    与视频类似，但针对图片内容
    """
    # 类似视频的处理逻辑
    # ...
    pass


@router.post("/send-audio")
async def send_audio_message(
    companion_id: int,
    media_id: str,
    transcript: Optional[str] = "",  # 语音转文字
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    发送语音消息并获取AI回应

    可以先语音转文字，然后AI回应
    """
    # 类似的处理逻辑
    # ...
    pass
