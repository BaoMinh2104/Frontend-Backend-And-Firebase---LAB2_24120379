from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from backend.app.dependencies.auth import get_current_user
from backend.app.schemas.conversation import (
    CaptionRecordItem,
    ConversationCaptionResponse,
    ConversationCreate,
    ConversationItem,
    ConversationRename,
)
from backend.app.services import firestore_service
from backend.app.services.caption_service import caption_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _uid(user) -> str:
    return user["uid"]


def _require_conversation(uid: str, conversation_id: str):
    conversation = firestore_service.get_conversation(uid, conversation_id)

    if conversation is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện.")

    return conversation


@router.get("", response_model=list[ConversationItem])
def get_conversations(user=Depends(get_current_user)):
    return firestore_service.list_conversations(_uid(user))


@router.post("", response_model=ConversationItem, status_code=status.HTTP_201_CREATED)
def post_conversation(
    request: ConversationCreate | None = None,
    user=Depends(get_current_user),
):
    return firestore_service.create_conversation(_uid(user), request.title if request else None)


@router.patch("/{conversation_id}", response_model=ConversationItem)
def patch_conversation(
    conversation_id: str,
    request: ConversationRename,
    user=Depends(get_current_user),
):
    try:
        conversation = firestore_service.rename_conversation(
            _uid(user),
            conversation_id,
            request.title,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if conversation is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện.")

    return conversation


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_conversation(conversation_id: str, user=Depends(get_current_user)):
    deleted = firestore_service.delete_conversation(_uid(user), conversation_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện.")

    return None


@router.get("/{conversation_id}/messages", response_model=list[CaptionRecordItem])
def get_conversation_messages(conversation_id: str, user=Depends(get_current_user)):
    uid = _uid(user)
    _require_conversation(uid, conversation_id)
    return firestore_service.load_caption_records(uid, conversation_id)


@router.post("/{conversation_id}/caption", response_model=ConversationCaptionResponse)
async def post_conversation_caption(
    conversation_id: str,
    file: UploadFile = File(..., description="Ảnh cần tạo caption"),
    prompt: str | None = Form(default=None, description="Prompt tùy chọn"),
    user=Depends(get_current_user),
):
    uid = _uid(user)
    _require_conversation(uid, conversation_id)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File tải lên phải là ảnh hợp lệ.")

    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="File ảnh rỗng.")

        caption = caption_service.generate_caption(image_bytes, prompt)
        record = firestore_service.save_caption_record(
            uid=uid,
            conversation_id=conversation_id,
            filename=file.filename or "uploaded_image",
            content_type=file.content_type,
            prompt=prompt,
            caption=caption,
            image_bytes=image_bytes,
        )
        conversation = firestore_service.maybe_generate_title_from_first_record(
            uid=uid,
            conversation_id=conversation_id,
            prompt=prompt,
            filename=file.filename or "uploaded_image",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi sinh caption từ model: {exc}",
        ) from exc

    if conversation is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện.")

    return {
        "record": record,
        "conversation": conversation,
        "records": firestore_service.load_caption_records(uid, conversation_id),
    }
