from pydantic import BaseModel


class ConversationCreate(BaseModel):
    title: str | None = None


class ConversationRename(BaseModel):
    title: str


class ConversationItem(BaseModel):
    id: str
    title: str
    created_at: str | None = None
    updated_at: str | None = None


class CaptionRecordItem(BaseModel):
    id: str
    filename: str
    content_type: str
    prompt: str | None = None
    caption: str
    thumbnail_data_url: str | None = None
    created_at: str | None = None


class ConversationCaptionResponse(BaseModel):
    record: CaptionRecordItem
    conversation: ConversationItem
    records: list[CaptionRecordItem]
