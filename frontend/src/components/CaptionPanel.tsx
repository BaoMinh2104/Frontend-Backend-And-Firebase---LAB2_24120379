import { FormEvent, useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CaptionRecordCard } from "@/components/CaptionRecordCard";
import type { CaptionRecord, Conversation } from "@/lib/types";
import { cn } from "@/lib/utils";

type CaptionPanelProps = {
  conversation: Conversation | null;
  records: CaptionRecord[];
  isAuthenticated: boolean;
  isSending: boolean;
  isLoadingRecords: boolean;
  error: string;
  onUpload: (file: File, prompt: string) => Promise<void>;
  onRequireLogin: () => void;
};

function getConversationTitle(conversation: Conversation | null) {
  if (!conversation) {
    return "Image Caption Session";
  }

  return conversation.title.trim() || "Image Caption Session";
}

export function CaptionPanel({
  conversation,
  records,
  isAuthenticated,
  isSending,
  isLoadingRecords,
  error,
  onUpload,
  onRequireLogin
}: CaptionPanelProps) {
  const [draftPrompt, setDraftPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isLocked = !isAuthenticated;
  const isInputDisabled = isLocked || isSending;

  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function submitUpload(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    if (isLocked) {
      onRequireLogin();
      return;
    }

    if (!selectedFile || isSending) {
      return;
    }

    await onUpload(selectedFile, draftPrompt.trim());
    setSelectedFile(null);
    setDraftPrompt("");
  }

  return (
    <section className="liquid-glass animate-fade-rise-delay flex min-h-[calc(100vh-32px)] flex-col rounded-lg p-4 sm:p-5">
      <div className="flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-white/42">BLIP Image Captioning</p>
          <h1 className="font-display mt-2 truncate text-4xl font-normal leading-none text-white sm:text-5xl">
            {getConversationTitle(conversation)}
          </h1>
        </div>
        <p className="text-sm text-white/48">
          {isAuthenticated ? "Đã kết nối FastAPI + Firebase" : "Cần đăng nhập để upload ảnh"}
        </p>
      </div>

      <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto py-5 pr-1 sm:pr-3">
        {isLoadingRecords ? (
          <div className="flex h-full min-h-[360px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Đang tải lịch sử caption
          </div>
        ) : records.length === 0 ? (
          <div className="flex h-full min-h-[360px] items-center justify-center px-4 text-center">
            <p className="font-display max-w-xl text-4xl leading-tight text-white/78 sm:text-5xl">
              {isAuthenticated
                ? "Upload ảnh đầu tiên để bắt đầu caption."
                : "Đăng nhập để bắt đầu caption ảnh."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <CaptionRecordCard key={record.id} record={record} />
            ))}
            {isSending ? (
              <div className="flex justify-start">
                <div className="liquid-glass rounded-lg px-5 py-3 text-sm text-white/72">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Đang sinh caption
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/82">
          {error}
        </p>
      ) : null}

      <form className="liquid-glass relative rounded-lg p-3" onSubmit={(event) => void submitUpload(event)}>
        {isLocked ? (
          <button
            type="button"
            className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/20 text-sm font-medium text-white/82 backdrop-blur-[1px] transition hover:bg-black/25"
            onClick={onRequireLogin}
          >
            Đăng nhập để upload ảnh
          </button>
        ) : null}

        <div className={cn("space-y-3", isLocked && "opacity-55")}>
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <Textarea
              value={draftPrompt}
              onChange={(event) => setDraftPrompt(event.target.value)}
              disabled={isInputDisabled}
              placeholder="Prompt tùy chọn, ví dụ: a photography of"
              className="min-h-[92px]"
            />

            <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-center text-sm text-white/72 transition hover:bg-white/[0.05]">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isInputDisabled}
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <div>
                <ImagePlus className="mx-auto mb-2 h-5 w-5" />
                {selectedFile ? selectedFile.name : "Chọn ảnh để caption"}
              </div>
            </label>
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-lg border border-white/10 bg-black/10">
              <img src={previewUrl} alt="Preview" className="max-h-56 w-full object-contain" />
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="glass"
              className={cn("h-[52px] rounded-lg px-7", !selectedFile && "opacity-70")}
              disabled={isInputDisabled || !selectedFile}
            >
              {isSending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Generate Caption
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
