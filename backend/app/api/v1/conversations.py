"""
对话管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.companion import Companion
from app.models.conversation import Conversation, Message
from app.models.memory import Memory
from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationWithMessages,
    MessageResponse,
    ChatRequest,
    ChatResponse,
)
from app.services.ai_service import AIService

router = APIRouter()
ai_service = AIService()


@router.post("/chat", response_model=dict)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    发送消息并获取AI回复
    """
    # 验证角色所有权
    companion = db.query(Companion).filter(
        Companion.id == request.companion_id,
        Companion.user_id == current_user.id,
        Companion.deleted_at.is_(None)
    ).first()

    if not companion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="角色不存在",
        )

    # 获取或创建对话
    if request.conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == request.conversation_id,
            Conversation.user_id == current_user.id,
        ).first()

        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="对话不存在",
            )
    else:
        # 创建新对话
        conversation = Conversation(
            user_id=current_user.id,
            companion_id=request.companion_id,
            title=f"与{companion.name}的对话",
            started_at=datetime.utcnow(),
        )
        db.add(conversation)
        db.flush()

    # 保存用户消息
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.message,
        content_type="text",
        created_at=datetime.utcnow(),
    )
    db.add(user_message)
    db.flush()

    # 分析用户消息情感（已禁用以提升性能）
    # 情感分析改为异步后台任务，或使用本地模型
    # try:
    #     emotion_data = await ai_service.analyze_emotion(request.message)
    #     user_message.emotion = emotion_data.get("emotion")
    #     user_message.sentiment = emotion_data.get("sentiment")
    #     user_message.emotion_score = emotion_data.get("score")
    # except:
    #     pass

    # 获取对话历史（最近10条）
    recent_messages = db.query(Message).filter(
        Message.conversation_id == conversation.id
    ).order_by(Message.created_at.desc()).limit(10).all()

    recent_messages.reverse()  # 按时间正序

    # 获取相关记忆（未来实现向量检索）
    memories = db.query(Memory).filter(
        Memory.user_id == current_user.id,
        Memory.companion_id == request.companion_id,
    ).order_by(Memory.importance_score.desc()).limit(5).all()

    # 构建上下文
    context_messages = []

    # 添加记忆上下文
    if memories:
        memory_text = "关于用户的记忆：\n" + "\n".join([f"- {m.content}" for m in memories])
        context_messages.append({"role": "system", "content": memory_text})

    # 添加历史对话
    for msg in recent_messages[:-1]:  # 排除刚刚添加的用户消息
        context_messages.append({
            "role": msg.role,
            "content": msg.content,
        })

    # 添加当前用户消息
    context_messages.append({
        "role": "user",
        "content": request.message,
    })

    # 生成AI回复
    try:
        ai_response = await ai_service.generate_response(
            system_prompt=companion.system_prompt or "你是一个关心用户的AI助手。",
            messages=context_messages,
            temperature=0.8,  # 略微提高创造性
            max_tokens=200,   # 减少token数，加快响应（原500太多）
        )

        # 保存AI回复
        assistant_message = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=ai_response["content"],
            content_type="text",
            model_used=ai_response.get("model"),
            tokens_used=ai_response.get("tokens"),
            created_at=datetime.utcnow(),
        )
        db.add(assistant_message)

        # 更新对话统计
        conversation.last_message_at = datetime.utcnow()
        conversation.message_count = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).count()

        # 更新用户和角色统计
        current_user.total_messages += 2
        companion.total_messages += 2

        db.commit()
        db.refresh(user_message)
        db.refresh(assistant_message)

        # 异步提取记忆（后台任务）
        try:
            conversation_context = f"用户：{request.message}\nAI：{ai_response['content']}"
            memory_data = await ai_service.extract_memory(conversation_context)

            if memory_data:
                new_memory = Memory(
                    user_id=current_user.id,
                    companion_id=request.companion_id,
                    memory_type=memory_data.get("type", "fact"),
                    content=memory_data.get("content"),
                    importance_score=memory_data.get("importance", 0.5),
                    source_message_id=user_message.id,
                    source_type="conversation",
                    created_at=datetime.utcnow(),
                )
                db.add(new_memory)
                db.commit()
        except:
            pass  # 记忆提取失败不影响对话

        return {
            "success": True,
            "message": "对话成功",
            "data": ChatResponse(
                conversation_id=conversation.id,
                user_message=MessageResponse.from_orm(user_message),
                assistant_message=MessageResponse.from_orm(assistant_message),
                voice_url=None,  # 未来添加语音合成
            ),
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI服务错误: {str(e)}",
        )


@router.get("", response_model=dict)
async def list_conversations(
    companion_id: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取用户的对话列表
    """
    query = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    )

    if companion_id:
        query = query.filter(Conversation.companion_id == companion_id)

    conversations = query.order_by(
        Conversation.last_message_at.desc()
    ).all()

    return {
        "success": True,
        "message": "获取成功",
        "data": [ConversationResponse.from_orm(c) for c in conversations],
    }


@router.get("/{conversation_id}", response_model=dict)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    获取对话详情（包含消息）
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话不存在",
        )

    # 获取消息
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.created_at.asc()).all()

    result = ConversationResponse.from_orm(conversation)
    result_dict = result.dict()
    result_dict["messages"] = [MessageResponse.from_orm(m) for m in messages]

    return {
        "success": True,
        "message": "获取成功",
        "data": result_dict,
    }


@router.delete("/{conversation_id}", response_model=dict)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    删除对话
    """
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="对话不存在",
        )

    # 删除对话（级联删除消息）
    db.delete(conversation)
    db.commit()

    return {
        "success": True,
        "message": "对话已删除",
    }
